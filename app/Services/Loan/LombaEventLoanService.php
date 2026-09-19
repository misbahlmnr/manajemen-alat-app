<?php

namespace App\Services\Loan;

use App\Models\Equipment;
use App\Models\Loan;
use App\Models\PracticumSchedule;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LombaEventLoanService
{
    public function __construct(
        private LoanWorkflowService $workflow,
        private LoanQueueService $queue,
    ) {}

    /**
     * @param  array<int, array{equipment_id: int, quantity: int}>  $items
     * @param  array<int>  $participantIds
     */
    public function syncEquipmentAndParticipants(
        PracticumSchedule $schedule,
        array $items,
        array $participantIds,
    ): void {
        $syncEquipment = [];
        foreach ($items as $row) {
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

        $items = $schedule->equipmentItems->map(fn (Equipment $equipment) => [
            'equipment_id' => $equipment->id,
            'quantity' => (int) ($equipment->pivot->quantity ?? 1),
        ])->values()->all();

        if ($items === []) {
            throw ValidationException::withMessages([
                'items' => 'Event lomba harus memiliki minimal satu alat.',
            ]);
        }

        $this->queue->validateItemsForSubmit($items, 'alat', $schedule->penanggung_jawab_id, 'lomba');

        $pj = $schedule->penanggungJawab;
        $requestDate = $schedule->tanggal?->toDateString() ?? now()->toDateString();

        return DB::transaction(function () use ($schedule, $items, $pj, $requestDate, $actor) {
            $submission = Submission::createForBorrower($pj, [
                'supervisor_id' => $schedule->guru_id,
                'purpose' => $schedule->title ?: 'Event Lomba',
                'notes' => $schedule->notes,
                'request_date' => $requestDate,
            ]);

            $legacy = Loan::legacyFieldsForType('lomba');

            $loan = Loan::create([
                'code' => Loan::generateCode(),
                'submission_id' => $submission->id,
                'borrower_id' => $pj->id,
                'borrower_class' => $pj->class,
                'supervisor_id' => $schedule->guru_id,
                'practicum_schedule_id' => $schedule->id,
                'item_type' => 'alat',
                'loan_type' => 'lomba',
                'status' => 'diminta',
                'request_date' => $requestDate,
                'purpose' => $schedule->title ?: 'Event Lomba',
                'notes' => $schedule->notes,
                'borrow_scope' => $legacy['borrow_scope'],
                'borrow_reason' => $legacy['borrow_reason'],
            ]);

            foreach ($items as $row) {
                $loan->items()->create([
                    'equipment_id' => $row['equipment_id'],
                    'quantity' => $row['quantity'],
                ]);
            }

            $this->queue->applyDueAtForLoan($loan->fresh());
            $this->workflow->logStatus(
                $loan,
                'diminta',
                'Pengajuan lomba dibuat dari Event Lomba oleh admin.',
                $actor,
            );

            return $loan->fresh(['items.equipment', 'borrower', 'submission']);
        });
    }

    /**
     * Sync participants always. Sync PJ/items only while loan is still diminta/antrian.
     *
     * @param  array<int, array{equipment_id: int, quantity: int}>  $items
     * @param  array<int>  $participantIds
     */
    public function updateEvent(
        PracticumSchedule $schedule,
        array $items,
        array $participantIds,
        ?User $actor = null,
    ): void {
        $this->syncEquipmentAndParticipants($schedule, $items, $participantIds);

        $loan = Loan::query()
            ->where('practicum_schedule_id', $schedule->id)
            ->where('loan_type', 'lomba')
            ->whereNotIn('status', ['ditolak', 'dibatalkan', 'dikembalikan'])
            ->latest('id')
            ->first();

        if (! $loan) {
            if ($schedule->isLombaEvent()) {
                $this->createLoanForEvent($schedule->fresh(), $actor);
            }

            return;
        }

        $schedule->participants(); // already synced

        if (! in_array($loan->status, ['diminta', 'antrian'], true)) {
            return;
        }

        if ($schedule->penanggung_jawab_id && (int) $loan->borrower_id !== (int) $schedule->penanggung_jawab_id) {
            $pj = User::query()->findOrFail($schedule->penanggung_jawab_id);
            $loan->update([
                'borrower_id' => $pj->id,
                'borrower_class' => $pj->class,
            ]);
            $loan->submission?->update([
                'borrower_id' => $pj->id,
                'borrower_class' => $pj->class,
            ]);
        }

        $loan->update([
            'supervisor_id' => $schedule->guru_id,
            'purpose' => $schedule->title ?: $loan->purpose,
            'notes' => $schedule->notes,
            'request_date' => $schedule->tanggal?->toDateString() ?? $loan->request_date,
        ]);

        $loan->items()->delete();
        foreach ($items as $row) {
            $loan->items()->create([
                'equipment_id' => (int) $row['equipment_id'],
                'quantity' => max(1, (int) ($row['quantity'] ?? 1)),
            ]);
        }

        $this->queue->applyDueAtForLoan($loan->fresh());
    }
}
