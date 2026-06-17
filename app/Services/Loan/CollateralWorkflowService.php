<?php

namespace App\Services\Loan;

use App\Models\Loan;
use App\Models\LoanCollateral;
use App\Models\LoanCompensation;
use App\Models\LoanReturnInspection;
use App\Models\User;
use App\Services\Notification\LabNotificationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CollateralWorkflowService
{
    public function __construct(
        private LoanWorkflowService $loanWorkflow,
    ) {}

    public function holdCard(LoanCollateral $collateral, User $admin): void
    {
        if (! in_array($collateral->status, ['dititipkan'], true)) {
            throw ValidationException::withMessages([
                'status' => 'Kartu hanya dapat ditahan dari status dititipkan.',
            ]);
        }

        $collateral->update([
            'status' => 'ditahan',
            'held_at' => now(),
            'held_by_admin_id' => $admin->id,
        ]);

        app(LabNotificationService::class)->collateralHeld($collateral->fresh());
    }

    public function requestReturnInspection(Loan $loan, ?string $note, User $actor): void
    {
        if (! $loan->requiresCollateral()) {
            $this->loanWorkflow->processReturn($loan, $note, $actor);

            return;
        }

        if (! in_array($loan->status, ['dipinjam', 'terlambat'], true)) {
            throw ValidationException::withMessages([
                'status' => 'Pengembalian hanya untuk peminjaman aktif.',
            ]);
        }

        $loan->update(['status' => 'menunggu_inspeksi']);
        $this->loanWorkflow->logStatus($loan, 'menunggu_inspeksi', $note ?? 'Menunggu inspeksi pengembalian.', $actor);

        LoanReturnInspection::updateOrCreate(
            ['loan_id' => $loan->id],
            ['result' => 'belum']
        );

    }

    public function inspectReturn(Loan $loan, array $data, User $admin): void
    {
        if ($loan->status !== 'menunggu_inspeksi') {
            throw ValidationException::withMessages([
                'status' => 'Peminjaman harus dalam status menunggu inspeksi.',
            ]);
        }

        DB::transaction(function () use ($loan, $data, $admin) {
            $result = $data['result'];

            LoanReturnInspection::updateOrCreate(
                ['loan_id' => $loan->id],
                [
                    'result' => $result,
                    'notes' => $data['notes'] ?? null,
                    'missing_items' => $data['missing_items'] ?? null,
                    'damage_description' => $data['damage_description'] ?? null,
                    'checked_by_admin_id' => $admin->id,
                    'checked_at' => now(),
                ]
            );

            $this->loanWorkflow->restoreStock($loan);

            if ($result === 'rusak' && filled($data['damage_level'] ?? null)) {
                app(\App\Services\Equipment\EquipmentConditionService::class)
                    ->applyReturnDamage($loan, $data['damage_level']);
            }

            $loan->update([
                'status' => 'dikembalikan',
                'returned_at' => now(),
            ]);
            $this->loanWorkflow->logStatus($loan, 'dikembalikan', 'Inspeksi pengembalian selesai.', $admin, notify: false);

            $collateral = $loan->collateral;

            if ($result === 'lengkap') {
                if ($collateral) {
                    $collateral->update([
                        'status' => 'dikembalikan',
                        'returned_at' => now(),
                    ]);
                }
                LoanCompensation::updateOrCreate(
                    ['loan_id' => $loan->id],
                    ['required' => false, 'status' => 'tidak_perlu']
                );
            } else {
                if ($collateral) {
                    $collateral->update(['status' => 'menunggu_kompensasi']);
                }
                LoanCompensation::updateOrCreate(
                    ['loan_id' => $loan->id],
                    [
                        'required' => true,
                        'status' => 'pending',
                        'amount' => $data['amount'] ?? null,
                        'description' => $data['description'] ?? $data['missing_items'] ?? null,
                    ]
                );
            }

            $freshLoan = $loan->fresh();

            if ($result === 'lengkap') {
                app(LabNotificationService::class)->loanReturned($freshLoan);
            } else {
                app(LabNotificationService::class)->compensationRequired($freshLoan);
            }
        });
    }

    public function completeCompensationAndReturnCard(LoanCollateral $collateral, User $admin): void
    {
        if ($collateral->status !== 'menunggu_kompensasi') {
            throw ValidationException::withMessages([
                'status' => 'Kompensasi belum selesai atau kartu tidak dalam penahanan kompensasi.',
            ]);
        }

        DB::transaction(function () use ($collateral, $admin) {
            $loan = $collateral->loan;

            LoanCompensation::updateOrCreate(
                ['loan_id' => $loan->id],
                [
                    'required' => true,
                    'status' => 'selesai',
                    'completed_at' => now(),
                    'completed_by_admin_id' => $admin->id,
                ]
            );

            $collateral->update([
                'status' => 'dikembalikan',
                'returned_at' => now(),
            ]);

            app(LabNotificationService::class)->compensationCompleted($loan->fresh());
        });
    }

    public function returnCardDirect(LoanCollateral $collateral, User $admin): void
    {
        if (! in_array($collateral->status, ['ditahan', 'menunggu_kompensasi'], true)) {
            throw ValidationException::withMessages([
                'status' => 'Kartu tidak dalam status yang dapat dikembalikan.',
            ]);
        }

        $collateral->update([
            'status' => 'dikembalikan',
            'returned_at' => now(),
        ]);
    }

    public function registerPendingCollateral(Loan $loan): ?LoanCollateral
    {
        if (! $loan->requiresCollateral()) {
            return null;
        }

        $existing = $loan->collateral;
        if ($existing) {
            return $existing;
        }

        $loan->loadMissing('borrower:id,nisn');

        return LoanCollateral::create([
            'code' => LoanCollateral::generateCode(),
            'loan_id' => $loan->id,
            'student_id' => $loan->borrower_id,
            'card_type' => 'kartu_pelajar',
            'card_number' => $loan->borrower?->nisn,
            'status' => 'dititipkan',
            'notes' => 'Pengajuan bawa pulang — menunggu penyerahan kartu pelajar.',
        ]);
    }

    public function removePendingCollateralIfExists(Loan $loan): void
    {
        $collateral = $loan->collateral;

        if ($collateral && $collateral->status === 'dititipkan') {
            $collateral->delete();
        }
    }

    public function syncCollateralForLoan(Loan $loan): void
    {
        $loan->loadMissing('borrower:id,nisn');

        if ($loan->requiresCollateral()) {
            $this->registerPendingCollateral($loan);

            return;
        }

        $this->removePendingCollateralIfExists($loan);
    }

    public function ensureCollateralForBawaPulangLoan(Loan $loan, User $admin, ?array $cardData = null): LoanCollateral
    {
        if (! $loan->requiresCollateral()) {
            throw ValidationException::withMessages([
                'loan' => 'Peminjaman ini tidak memerlukan jaminan kartu.',
            ]);
        }

        $existing = $loan->collateral;
        if ($existing) {
            if ($existing->status === 'dititipkan') {
                $this->holdCard($existing, $admin);
            }

            return $existing->fresh();
        }

        $collateral = LoanCollateral::create([
            'code' => LoanCollateral::generateCode(),
            'loan_id' => $loan->id,
            'student_id' => $loan->borrower_id,
            'card_type' => $cardData['card_type'] ?? 'kartu_pelajar',
            'card_number' => $cardData['card_number'] ?? $loan->borrower?->nisn,
            'status' => 'ditahan',
            'held_at' => now(),
            'held_by_admin_id' => $admin->id,
            'notes' => $cardData['notes'] ?? null,
        ]);

        app(LabNotificationService::class)->collateralHeld($collateral->fresh());

        return $collateral;
    }
}
