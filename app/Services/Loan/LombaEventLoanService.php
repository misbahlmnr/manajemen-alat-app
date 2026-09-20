<?php

namespace App\Services\Loan;

use App\Models\Equipment;
use App\Models\Loan;
use App\Models\PracticumSchedule;
use App\Models\Submission;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class LombaEventLoanService
{
    public function __construct(
        private LoanWorkflowService $workflow,
        private LoanQueueService $queue,
    ) {}

    /**
     * @param  array<int, array{equipment_id: int, quantity: int}>  $items
     * @param  array<int>  $participantIds
     * @param  array<int, array{equipment_id: int, quantity: int}>  $bahanItems
     */
    public function syncEquipmentAndParticipants(
        PracticumSchedule $schedule,
        array $items,
        array $participantIds,
        array $bahanItems = [],
    ): void {
        $syncEquipment = [];
        foreach ([...$items, ...$bahanItems] as $row) {
            $equipmentId = (int) ($row['equipment_id'] ?? 0);
            $quantity = max(1, (int) ($row['quantity'] ?? 1));
            if ($equipmentId > 0) {
                $syncEquipment[$equipmentId] = ['quantity' => $quantity];
            }
        }

        $schedule->equipmentItems()->sync($syncEquipment);
        $schedule->participants()->sync(array_values(array_unique(array_filter(array_map('intval', $participantIds)))));
    }

    public function createLoanForEvent(PracticumSchedule $schedule, ?User $actor = null): Loan
    {
        if (! $schedule->isLombaEvent()) {
            throw ValidationException::withMessages([
                'schedule_kind' => 'Hanya event lomba yang dapat membuat peminjaman otomatis.',
            ]);
        }

        if (! $schedule->penanggung_jawab_id) {
            throw ValidationException::withMessages([
                'penanggung_jawab_id' => 'Ketua Tim wajib dipilih dari peserta lomba.',
            ]);
        }

        $schedule->loadMissing(['equipmentItems', 'penanggungJawab', 'guru']);

        [$alatItems, $bahanItems] = $this->splitEquipmentItems($schedule);

        if ($alatItems === [] && $bahanItems === []) {
            throw ValidationException::withMessages([
                'items' => 'Event lomba harus memiliki minimal satu alat atau bahan.',
            ]);
        }

        $pj = $schedule->penanggungJawab;
        $requestDate = $schedule->tanggal?->toDateString() ?? now()->toDateString();
        $legacy = Loan::legacyFieldsForType('lomba');

        return DB::transaction(function () use ($schedule, $alatItems, $bahanItems, $pj, $requestDate, $actor, $legacy) {
            // Validate inside the transaction so a failure never leaves partial rows.
            if ($alatItems !== []) {
                $this->queue->validateItemsForSubmit(
                    $alatItems,
                    'alat',
                    $schedule->penanggung_jawab_id,
                    'lomba',
                );
            }

            if ($bahanItems !== []) {
                $this->queue->validateItemsForSubmit(
                    $bahanItems,
                    'bahan',
                    $schedule->penanggung_jawab_id,
                    'lomba',
                );
            }

            $submission = Submission::createForBorrower($pj, [
                'supervisor_id' => $schedule->guru_id,
                'purpose' => $schedule->title ?: 'Event Lomba',
                'notes' => $schedule->notes,
                'request_date' => $requestDate,
            ]);

            $groupId = (string) Str::uuid();
            $primary = null;

            if ($alatItems !== []) {
                $slotContext = [
                    'item_type' => 'alat',
                    'loan_type' => 'lomba',
                    'borrow_scope' => $legacy['borrow_scope'],
                    'borrow_reason' => $legacy['borrow_reason'],
                    'request_date' => $requestDate,
                    'practicum_schedule_id' => $schedule->id,
                ];
                $status = $this->queue->resolveInitialStatus($alatItems, 'alat', $slotContext);

                $alatLoan = Loan::create([
                    'code' => Loan::generateCode(),
                    'loan_group_id' => $groupId,
                    'submission_id' => $submission->id,
                    'borrower_id' => $pj->id,
                    'borrower_class' => $pj->class,
                    'supervisor_id' => $schedule->guru_id,
                    'practicum_schedule_id' => $schedule->id,
                    'item_type' => 'alat',
                    'loan_type' => 'lomba',
                    'status' => $status,
                    'queued_at' => $status === 'antrian' ? now() : null,
                    'request_date' => $requestDate,
                    'purpose' => $schedule->title ?: 'Event Lomba',
                    'notes' => $schedule->notes,
                    'borrow_scope' => $legacy['borrow_scope'],
                    'borrow_reason' => $legacy['borrow_reason'],
                ]);

                foreach ($alatItems as $row) {
                    $alatLoan->items()->create([
                        'equipment_id' => $row['equipment_id'],
                        'quantity' => $row['quantity'],
                    ]);
                }

                $this->queue->applyDueAtForLoan($alatLoan->fresh());
                $this->workflow->logStatus(
                    $alatLoan,
                    $status,
                    'Pengajuan lomba dibuat otomatis dari Event Lomba.',
                    $actor,
                );
                $primary = $alatLoan;
            }

            if ($bahanItems !== []) {
                $slotContext = [
                    'item_type' => 'bahan',
                    'loan_type' => 'lomba',
                    'borrow_scope' => 'lab',
                    'borrow_reason' => null,
                    'request_date' => $requestDate,
                    'practicum_schedule_id' => $schedule->id,
                ];
                $status = $this->queue->resolveInitialStatus($bahanItems, 'bahan', $slotContext);

                $bahanLoan = Loan::create([
                    'code' => Loan::generateCode(),
                    'loan_group_id' => $groupId,
                    'submission_id' => $submission->id,
                    'borrower_id' => $pj->id,
                    'borrower_class' => $pj->class,
                    'supervisor_id' => $schedule->guru_id,
                    'practicum_schedule_id' => $schedule->id,
                    'item_type' => 'bahan',
                    'loan_type' => 'lomba',
                    'status' => $status,
                    'queued_at' => $status === 'antrian' ? now() : null,
                    'request_date' => $requestDate,
                    'purpose' => $schedule->title ?: 'Event Lomba',
                    'notes' => $schedule->notes,
                    'borrow_scope' => 'lab',
                    'borrow_reason' => null,
                ]);

                foreach ($bahanItems as $row) {
                    $bahanLoan->items()->create([
                        'equipment_id' => $row['equipment_id'],
                        'quantity' => $row['quantity'],
                    ]);
                }

                $this->workflow->logStatus(
                    $bahanLoan,
                    $status,
                    'Pengajuan lomba dibuat otomatis dari Event Lomba.',
                    $actor,
                );
                $primary ??= $bahanLoan;
            }

            $submission = $submission->fresh(['loans.items.equipment']);
            if ($submission) {
                $this->queue->syncBahanGateForSubmission($submission, $actor);
            }

            return $primary->fresh(['items.equipment', 'borrower', 'submission']);
        });
    }

    /**
     * Activate due Event Lomba: create Submission/Loan when activation window has started.
     * Idempotent — skips events that already have an active lomba loan.
     *
     * @return int Number of events successfully activated
     */
    public function activateDueEvents(?User $actor = null): int
    {
        $activated = 0;

        foreach ($this->dueLombaEventsForActivation() as $schedule) {
            try {
                $this->createLoanForEvent($schedule, $actor);
                $activated++;
            } catch (Throwable $e) {
                Log::warning('Gagal mengaktifkan Event Lomba.', [
                    'schedule_id' => $schedule->id,
                    'schedule_code' => $schedule->code,
                    'message' => $e->getMessage(),
                ]);
            }
        }

        return $activated;
    }

    /**
     * @return list<PracticumSchedule>
     */
    public function dueLombaEventsForActivation(): array
    {
        $now = now();
        $today = $now->toDateString();
        $days = max(0, (int) config('lab.lomba_activation_days', 1));
        $time = (string) config('lab.lomba_activation_time', '17:00');

        return PracticumSchedule::query()
            ->where('schedule_kind', 'lomba')
            ->whereNotNull('penanggung_jawab_id')
            ->whereNotNull('tanggal')
            ->whereDate('tanggal', '>=', $today)
            ->whereDoesntHave('loans', function ($q) {
                $q->where('loan_type', 'lomba')
                    ->whereNotIn('status', ['ditolak', 'dibatalkan', 'dikembalikan']);
            })
            ->orderBy('tanggal')
            ->orderBy('id')
            ->get()
            ->filter(function (PracticumSchedule $schedule) use ($now, $days, $time) {
                $activationAt = $this->activationAtFor($schedule, $days, $time);

                return $activationAt !== null && $activationAt->lte($now);
            })
            ->values()
            ->all();
    }

    public function activationAtFor(
        PracticumSchedule $schedule,
        ?int $days = null,
        ?string $time = null,
    ): ?Carbon {
        if (! $schedule->tanggal) {
            return null;
        }

        $days ??= max(0, (int) config('lab.lomba_activation_days', 1));
        $time ??= (string) config('lab.lomba_activation_time', '17:00');
        $timezone = (string) config('lab.school_timezone', config('app.timezone', 'Asia/Jakarta'));

        $date = $schedule->tanggal->copy()->timezone($timezone)->subDays($days)->toDateString();

        try {
            return Carbon::parse($date.' '.$time, $timezone);
        } catch (Throwable) {
            return Carbon::parse($date.' 17:00', $timezone);
        }
    }

    /**
     * Sync participants always. Sync loan contents only while ALL active event loans
     * are still diminta/antrian. Does not create a loan before scheduled activation.
     *
     * @param  array<int, array{equipment_id: int, quantity: int}>  $items
     * @param  array<int>  $participantIds
     * @param  array<int, array{equipment_id: int, quantity: int}>  $bahanItems
     */
    public function updateEvent(
        PracticumSchedule $schedule,
        array $items,
        array $participantIds,
        ?User $actor = null,
        array $bahanItems = [],
    ): void {
        $this->syncEquipmentAndParticipants($schedule, $items, $participantIds, $bahanItems);

        $activeLoans = Loan::query()
            ->where('practicum_schedule_id', $schedule->id)
            ->where('loan_type', 'lomba')
            ->whereNotIn('status', ['ditolak', 'dibatalkan', 'dikembalikan'])
            ->orderBy('id')
            ->get();

        if ($activeLoans->isEmpty()) {
            return;
        }

        // Only sync loan contents while every active loan is still editable.
        if ($activeLoans->contains(fn (Loan $loan) => ! in_array($loan->status, ['diminta', 'antrian'], true))) {
            return;
        }

        $schedule->loadMissing(['equipmentItems', 'penanggungJawab']);
        [$alatItems, $bahanPivotItems] = $this->splitEquipmentItems($schedule);

        $submission = $activeLoans->first()?->submission;
        $groupId = $activeLoans->first()?->loan_group_id ?: (string) Str::uuid();
        $requestDate = $schedule->tanggal?->toDateString() ?? now()->toDateString();
        $legacy = Loan::legacyFieldsForType('lomba');
        $pj = $schedule->penanggungJawab;

        if ($pj && $submission) {
            $submission->update([
                'borrower_id' => $pj->id,
                'borrower_class' => $pj->class,
                'supervisor_id' => $schedule->guru_id,
                'purpose' => $schedule->title ?: $submission->purpose,
                'notes' => $schedule->notes,
                'request_date' => $requestDate,
            ]);
        }

        $alatLoan = $activeLoans->firstWhere('item_type', 'alat');
        $bahanLoan = $activeLoans->firstWhere('item_type', 'bahan');

        if ($alatItems !== []) {
            $alatLoan = $this->upsertPackageLoan(
                existing: $alatLoan,
                schedule: $schedule,
                submission: $submission,
                pj: $pj,
                groupId: $groupId,
                itemType: 'alat',
                items: $alatItems,
                requestDate: $requestDate,
                legacy: $legacy,
            );
        } elseif ($alatLoan) {
            $alatLoan->delete();
            $alatLoan = null;
        }

        if ($bahanPivotItems !== []) {
            $this->upsertPackageLoan(
                existing: $bahanLoan,
                schedule: $schedule,
                submission: $submission,
                pj: $pj,
                groupId: $groupId,
                itemType: 'bahan',
                items: $bahanPivotItems,
                requestDate: $requestDate,
                legacy: $legacy,
            );
        } elseif ($bahanLoan) {
            $bahanLoan->delete();
        }

        if ($alatLoan) {
            $this->queue->applyDueAtForLoan($alatLoan->fresh());
        }

        if ($submission) {
            $this->queue->syncBahanGateForSubmission($submission->fresh(['loans.items.equipment']), $actor);
        }
    }

    /**
     * @return array{0: list<array{equipment_id: int, quantity: int}>, 1: list<array{equipment_id: int, quantity: int}>}
     */
    private function splitEquipmentItems(PracticumSchedule $schedule): array
    {
        $alatItems = [];
        $bahanItems = [];

        foreach ($schedule->equipmentItems as $equipment) {
            $row = [
                'equipment_id' => $equipment->id,
                'quantity' => (int) ($equipment->pivot->quantity ?? 1),
            ];

            if ($equipment->item_type === 'bahan') {
                $bahanItems[] = $row;
            } else {
                $alatItems[] = $row;
            }
        }

        return [$alatItems, $bahanItems];
    }

    /**
     * @param  list<array{equipment_id: int, quantity: int}>  $items
     * @param  array{borrow_scope: string, borrow_reason: string|null}  $legacy
     */
    private function upsertPackageLoan(
        ?Loan $existing,
        PracticumSchedule $schedule,
        ?Submission $submission,
        ?User $pj,
        string $groupId,
        string $itemType,
        array $items,
        string $requestDate,
        array $legacy,
    ): Loan {
        $payload = [
            'loan_group_id' => $groupId,
            'submission_id' => $submission?->id,
            'borrower_id' => $pj?->id ?? $existing?->borrower_id,
            'borrower_class' => $pj?->class ?? $existing?->borrower_class,
            'supervisor_id' => $schedule->guru_id,
            'practicum_schedule_id' => $schedule->id,
            'item_type' => $itemType,
            'loan_type' => 'lomba',
            'request_date' => $requestDate,
            'purpose' => $schedule->title ?: ($existing?->purpose ?: 'Event Lomba'),
            'notes' => $schedule->notes,
            'borrow_scope' => $itemType === 'alat' ? $legacy['borrow_scope'] : 'lab',
            'borrow_reason' => $itemType === 'alat' ? $legacy['borrow_reason'] : null,
        ];

        if ($existing) {
            $existing->update($payload);
            $loan = $existing;
        } else {
            $loan = Loan::create([
                ...$payload,
                'code' => Loan::generateCode(),
                'status' => 'diminta',
            ]);
        }

        $loan->items()->delete();
        foreach ($items as $row) {
            $loan->items()->create([
                'equipment_id' => (int) $row['equipment_id'],
                'quantity' => max(1, (int) ($row['quantity'] ?? 1)),
            ]);
        }

        return $loan->fresh();
    }
}
