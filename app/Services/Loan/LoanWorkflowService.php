<?php

namespace App\Services\Loan;

use App\Models\Equipment;
use App\Models\Loan;
use App\Models\LoanStatusLog;
use App\Models\User;
use App\Services\Notification\LabNotificationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LoanWorkflowService
{
    public function logStatus(Loan $loan, string $status, ?string $note, ?User $actor): void
    {
        LoanStatusLog::create([
            'loan_id' => $loan->id,
            'status' => $status,
            'note' => $note,
            'user_id' => $actor?->id,
            'created_at' => now(),
        ]);
    }

    public function approve(Loan $loan, User $actor): void
    {
        if (! in_array($loan->status, ['diminta', 'antrian'], true)) {
            throw ValidationException::withMessages([
                'status' => 'Hanya pengajuan menunggu yang dapat disetujui.',
            ]);
        }

        DB::transaction(function () use ($loan, $actor) {
            if ($loan->isAlat()) {
                $loan->update(['status' => 'disetujui']);
                $this->logStatus($loan, 'disetujui', 'Pengajuan disetujui admin.', $actor);
            } else {
                $this->deductStock($loan);
                $loan->update([
                    'status' => 'dipinjam',
                    'borrowed_at' => now(),
                ]);
                $this->logStatus($loan, 'dipinjam', 'Bahan disetujui dan diambil.', $actor);
            }
        });

        app(LabNotificationService::class)->loanApproved($loan->fresh());
    }

    public function reject(Loan $loan, string $reason, User $actor): void
    {
        if (! in_array($loan->status, ['diminta', 'antrian', 'disetujui'], true)) {
            throw ValidationException::withMessages([
                'status' => 'Pengajuan ini tidak dapat ditolak.',
            ]);
        }

        $loan->update([
            'status' => 'ditolak',
            'rejection_reason' => $reason,
        ]);

        app(CollateralWorkflowService::class)->removePendingCollateralIfExists($loan->fresh());

        $this->logStatus($loan, 'ditolak', $reason, $actor);

        app(LabNotificationService::class)->loanRejected($loan->fresh(), $reason);
    }

    public function markBorrowed(Loan $loan, User $actor): void
    {
        if (! $loan->isAlat() || $loan->status !== 'disetujui') {
            throw ValidationException::withMessages([
                'status' => 'Hanya peminjaman alat yang disetujui dapat ditandai dipinjam.',
            ]);
        }

        DB::transaction(function () use ($loan, $actor) {
            $this->deductStock($loan);
            $loan->update([
                'status' => 'dipinjam',
                'borrowed_at' => $loan->borrowed_at ?? now(),
            ]);
            $this->logStatus($loan, 'dipinjam', 'Alat diserahkan ke peminjam.', $actor);

            if ($loan->requiresCollateral()) {
                app(CollateralWorkflowService::class)->ensureCollateralForBawaPulangLoan($loan, $actor);
            }
        });

        app(LabNotificationService::class)->loanBorrowed($loan->fresh());
    }

    public function processReturn(Loan $loan, ?string $note, User $actor): void
    {
        if (! $loan->isAlat() || ! in_array($loan->status, ['dipinjam', 'terlambat'], true)) {
            throw ValidationException::withMessages([
                'status' => 'Pengembalian hanya untuk peminjaman alat yang sedang dipinjam.',
            ]);
        }

        if ($loan->requiresCollateral()) {
            app(CollateralWorkflowService::class)->requestReturnInspection($loan, $note, $actor);

            return;
        }

        DB::transaction(function () use ($loan, $note, $actor) {
            $this->restoreStock($loan);
            $loan->update([
                'status' => 'dikembalikan',
                'returned_at' => now(),
            ]);
            $this->logStatus($loan, 'dikembalikan', $note ?? 'Alat telah dikembalikan.', $actor);
        });

        app(LabNotificationService::class)->loanReturned($loan->fresh());
    }

    public function cancel(Loan $loan, User $actor): void
    {
        if (in_array($loan->status, ['dikembalikan', 'ditolak', 'dibatalkan'], true)) {
            throw ValidationException::withMessages([
                'status' => 'Peminjaman ini sudah selesai.',
            ]);
        }

        DB::transaction(function () use ($loan, $actor) {
            if (in_array($loan->status, ['dipinjam', 'terlambat'], true)) {
                $this->restoreStock($loan);
            }

            app(CollateralWorkflowService::class)->removePendingCollateralIfExists($loan);

            $loan->update(['status' => 'dibatalkan']);
            $this->logStatus($loan, 'dibatalkan', 'Peminjaman dibatalkan.', $actor);
        });

        app(LabNotificationService::class)->loanCancelled($loan->fresh());
    }

    public function syncOverdue(): void
    {
        $loans = Loan::query()
            ->where('item_type', 'alat')
            ->where('status', 'dipinjam')
            ->whereNotNull('due_at')
            ->where('due_at', '<', now())
            ->with(['borrower:id,name', 'supervisor:id,name'])
            ->get();

        $notifier = app(LabNotificationService::class);

        foreach ($loans as $loan) {
            $loan->update(['status' => 'terlambat']);
            $this->logStatus($loan, 'terlambat', 'Peminjaman melewati batas waktu.', null);
            $notifier->loanOverdue($loan->fresh());
        }
    }

    public function deductStock(Loan $loan): void
    {
        $loan->load('items.equipment');

        foreach ($loan->items as $item) {
            $equipment = $item->equipment;
            if ($equipment->available < $item->quantity) {
                throw ValidationException::withMessages([
                    'items' => "Stok {$equipment->name} tidak mencukupi.",
                ]);
            }

            $equipment->decrement('available', $item->quantity);
        }
    }

    public function restoreStock(Loan $loan): void
    {
        $loan->load('items.equipment');

        foreach ($loan->items as $item) {
            $equipment = $item->equipment;
            $equipment->increment('available', min($item->quantity, $equipment->stock - $equipment->available));
        }
    }

    public function validateStockForItems(array $items, string $itemType): void
    {
        foreach ($items as $row) {
            $equipment = Equipment::query()->find($row['equipment_id']);
            if (! $equipment || $equipment->item_type !== $itemType) {
                throw ValidationException::withMessages([
                    'items' => 'Barang tidak valid untuk jenis peminjaman ini.',
                ]);
            }
            if ($equipment->available < (int) $row['quantity']) {
                throw ValidationException::withMessages([
                    'items' => "Stok {$equipment->name} tidak mencukupi (tersedia: {$equipment->available}).",
                ]);
            }
        }
    }
}
