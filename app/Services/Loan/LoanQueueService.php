<?php

namespace App\Services\Loan;

use App\Models\Equipment;
use App\Models\Loan;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class LoanQueueService
{

    /**
     * Validasi item pengajuan tanpa menolak stok habis (alat masuk antrian).
     */
    public function validateItemsForSubmit(array $items, string $itemType, ?int $borrowerId = null): void
    {
        foreach ($items as $row) {
            $equipment = Equipment::query()->find($row['equipment_id'] ?? null);

            if (! $equipment || $equipment->item_type !== $itemType) {
                throw ValidationException::withMessages([
                    'items' => 'Barang tidak valid untuk jenis pengajuan ini.',
                ]);
            }

            if ($equipment->status !== 'tersedia') {
                throw ValidationException::withMessages([
                    'items' => "{$equipment->name} sedang tidak tersedia untuk dipinjam.",
                ]);
            }

            if ($borrowerId && $equipment->available < (int) $row['quantity']) {
                $activeLoan = Loan::query()
                    ->where('borrower_id', $borrowerId)
                    ->whereIn('status', ['dipinjam', 'terlambat', 'menunggu_inspeksi'])
                    ->whereHas('items', fn ($q) => $q->where('equipment_id', $equipment->id))
                    ->first(['id', 'code']);

                if ($activeLoan) {
                    throw ValidationException::withMessages([
                        'items' => "{$equipment->name} masih dalam peminjaman aktif ({$activeLoan->code}). Ajukan pengembalian terlebih dahulu.",
                    ]);
                }
            }
        }
    }

    /**
     * Tentukan status awal pengajuan: diminta (stok cukup) atau antrian (stok kurang).
     */
    public function resolveInitialStatus(array $items, string $itemType): string
    {
        if ($itemType !== 'alat') {
            return 'diminta';
        }

        return $this->hasStockShortage($items) ? 'antrian' : 'diminta';
    }

    public function hasStockShortage(array $items): bool
    {
        foreach ($items as $row) {
            $equipment = Equipment::query()->find($row['equipment_id'] ?? null);

            if ($equipment && $equipment->available < (int) $row['quantity']) {
                return true;
            }
        }

        return false;
    }

    public function enqueue(Loan $loan, ?User $actor = null): void
    {
        if ($loan->status !== 'antrian') {
            return;
        }

        $loan->update([
            'queued_at' => $loan->queued_at ?? now(),
        ]);

        $position = $this->getQueuePosition($loan);

        $this->workflow()->logStatus(
            $loan,
            'antrian',
            $position
                ? "Masuk antrian stok (posisi #{$position}). Menunggu alat tersedia."
                : 'Masuk antrian stok. Menunggu alat tersedia.',
            $actor,
            notify: false,
        );
    }

    /**
     * Skor efektif antrian: prioritas admin (jika diset) atau prioritas jadwal.
     */
    public function effectiveSortScore(Loan $loan): int
    {
        $adminPriority = (int) ($loan->queue_priority ?? 0);
        $scheduleScore = $this->schedulePriorityScore($loan);

        if ($adminPriority > 0) {
            return max($adminPriority, $scheduleScore);
        }

        return $scheduleScore;
    }

    public function schedulePriorityScore(Loan $loan): int
    {
        $loan->loadMissing('schedule:id,priority');
        $priority = $loan->schedule?->priority ?? 'normal';

        return (int) config("lab.queue.schedule_priority_scores.{$priority}", 40);
    }

    /**
     * Antrian round-robin per alat: skor prioritas DESC, lalu FIFO (queued_at ASC).
     */
    public function queuedLoansForEquipment(int $equipmentId): Collection
    {
        return Loan::query()
            ->where('status', 'antrian')
            ->where('item_type', 'alat')
            ->whereHas('items', fn ($q) => $q->where('equipment_id', $equipmentId))
            ->with(['items', 'schedule:id,priority', 'borrower:id,name'])
            ->get()
            ->sort(function (Loan $a, Loan $b) {
                $scoreDiff = $this->effectiveSortScore($b) <=> $this->effectiveSortScore($a);

                if ($scoreDiff !== 0) {
                    return $scoreDiff;
                }

                $aTime = $a->queued_at ?? $a->created_at;
                $bTime = $b->queued_at ?? $b->created_at;

                return $aTime <=> $bTime;
            })
            ->values();
    }

    public function getQueuePosition(Loan $loan): ?int
    {
        if ($loan->status !== 'antrian') {
            return null;
        }

        $loan->loadMissing('items');
        $positions = [];

        foreach ($loan->items as $item) {
            $queue = $this->queuedLoansForEquipment($item->equipment_id);
            $index = $queue->search(fn (Loan $queued) => $queued->id === $loan->id);

            if ($index !== false) {
                $positions[] = $index + 1;
            }
        }

        return $positions !== [] ? max($positions) : null;
    }

    public function allItemsAvailable(Loan $loan): bool
    {
        $loan->loadMissing('items.equipment');

        foreach ($loan->items as $item) {
            if (! $item->equipment || $item->equipment->available < $item->quantity) {
                return false;
            }
        }

        return true;
    }

    /**
     * Promosikan pengajuan antrian ke diminta jika seluruh item tersedia.
     */
    public function promoteFromQueue(Loan $loan, ?User $actor = null): bool
    {
        if ($loan->status !== 'antrian' || ! $this->allItemsAvailable($loan)) {
            return false;
        }

        $loan->update(['status' => 'diminta']);

        $this->workflow()->logStatus(
            $loan,
            'diminta',
            'Stok tersedia — pengajuan siap ditinjau admin.',
            $actor,
        );

        app(\App\Services\Notification\LabNotificationService::class)->loanPromotedFromQueue($loan->fresh());

        return true;
    }

    /**
     * Proses antrian untuk satu alat setelah stok bertambah.
     *
     * @return array<int, Loan> Daftar loan yang dipromosikan
     */
    public function processQueueForEquipment(int $equipmentId, ?User $actor = null): array
    {
        $equipment = Equipment::query()->find($equipmentId);

        if (! $equipment || $equipment->available <= 0) {
            return [];
        }

        $promoted = [];
        $virtualAvailability = $this->virtualAvailabilityMap();

        foreach ($this->queuedLoansForEquipment($equipmentId) as $loan) {
            if (! $this->canAllocateLoan($loan, $virtualAvailability)) {
                continue;
            }

            if ($this->promoteFromQueue($loan, $actor)) {
                $this->allocateLoanVirtually($loan, $virtualAvailability);
                $promoted[] = $loan->fresh();
            }
        }

        return $promoted;
    }

    /**
     * @param  array<int>  $equipmentIds
     * @return array<int, Loan>
     */
    public function processQueueForEquipments(array $equipmentIds, ?User $actor = null): array
    {
        $promoted = [];

        foreach (array_unique($equipmentIds) as $equipmentId) {
            foreach ($this->processQueueForEquipment((int) $equipmentId, $actor) as $loan) {
                $promoted[$loan->id] = $loan;
            }
        }

        return array_values($promoted);
    }

    public function processQueueAfterLoanItemsReleased(Loan $loan, ?User $actor = null): array
    {
        $loan->loadMissing('items');

        return $this->processQueueForEquipments(
            $loan->items->pluck('equipment_id')->all(),
            $actor,
        );
    }

    public function setAdminPriority(Loan $loan, ?int $priority, ?string $note, User $admin): void
    {
        if ($loan->status !== 'antrian') {
            throw ValidationException::withMessages([
                'queue_priority' => 'Prioritas antrian hanya dapat diatur untuk peminjaman berstatus antrian.',
            ]);
        }

        $max = (int) config('lab.queue.max_admin_priority', 1000);

        if ($priority === null || $priority <= 0) {
            $loan->update([
                'queue_priority' => 0,
                'queue_priority_note' => null,
                'queue_priority_set_by' => null,
                'queue_priority_set_at' => null,
            ]);

            $this->workflow()->logStatus(
                $loan,
                'antrian',
                'Prioritas antrian direset ke round-robin normal.',
                $admin,
                notify: false,
            );

            return;
        }

        $priority = max(1, min($priority, $max));

        $loan->update([
            'queue_priority' => $priority,
            'queue_priority_note' => $note,
            'queue_priority_set_by' => $admin->id,
            'queue_priority_set_at' => now(),
        ]);

        $this->workflow()->logStatus(
            $loan,
            'antrian',
            "Prioritas antrian dinaikkan admin (#{$priority}).".($note ? " {$note}" : ''),
            $admin,
            notify: false,
        );
    }

    public function applyDefaultAdminPriority(Loan $loan, ?string $note, User $admin): void
    {
        $this->setAdminPriority(
            $loan,
            (int) config('lab.queue.default_admin_priority', 150),
            $note,
            $admin,
        );
    }

    /**
     * @return Collection<int, Loan>
     */
    public function globalQueue(?int $equipmentId = null): Collection
    {
        $query = Loan::query()
            ->where('status', 'antrian')
            ->where('item_type', 'alat')
            ->with(['borrower:id,name,class', 'items.equipment:id,name', 'schedule:id,priority,title']);

        if ($equipmentId) {
            $query->whereHas('items', fn ($q) => $q->where('equipment_id', $equipmentId));
        }

        return $query->get()->sort(function (Loan $a, Loan $b) {
            $scoreDiff = $this->effectiveSortScore($b) <=> $this->effectiveSortScore($a);

            if ($scoreDiff !== 0) {
                return $scoreDiff;
            }

            $aTime = $a->queued_at ?? $a->created_at;
            $bTime = $b->queued_at ?? $b->created_at;

            return $aTime <=> $bTime;
        })->values();
    }

    public function queueSummary(Loan $loan): array
    {
        $position = $this->getQueuePosition($loan);

        return [
            'queue_position' => $position,
            'queue_priority' => (int) ($loan->queue_priority ?? 0),
            'effective_sort_score' => $this->effectiveSortScore($loan),
            'schedule_priority_score' => $this->schedulePriorityScore($loan),
            'queued_at' => $loan->queued_at?->toIso8601String(),
            'queued_at_formatted' => $loan->queued_at?->translatedFormat('d M Y H:i'),
            'queue_priority_note' => $loan->queue_priority_note,
            'has_admin_priority' => (int) ($loan->queue_priority ?? 0) > 0,
        ];
    }

    /**
     * @return array<int, int>
     */
    private function virtualAvailabilityMap(): array
    {
        return Equipment::query()
            ->pluck('available', 'id')
            ->map(fn ($available) => (int) $available)
            ->all();
    }

    /**
     * @param  array<int, int>  $virtualAvailability
     */
    private function canAllocateLoan(Loan $loan, array $virtualAvailability): bool
    {
        $loan->loadMissing('items');

        foreach ($loan->items as $item) {
            $available = $virtualAvailability[$item->equipment_id] ?? 0;

            if ($available < $item->quantity) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param  array<int, int>  $virtualAvailability
     */
    private function allocateLoanVirtually(Loan $loan, array &$virtualAvailability): void
    {
        $loan->loadMissing('items');

        foreach ($loan->items as $item) {
            $virtualAvailability[$item->equipment_id] = ($virtualAvailability[$item->equipment_id] ?? 0) - $item->quantity;
        }
    }

    private function workflow(): LoanWorkflowService
    {
        return app(LoanWorkflowService::class);
    }
}
