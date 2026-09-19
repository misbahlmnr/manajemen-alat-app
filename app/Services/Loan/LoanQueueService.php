<?php

namespace App\Services\Loan;

use App\Models\Equipment;
use App\Models\Loan;
use App\Models\PracticumSchedule;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class LoanQueueService
{
    /**
     * Validasi item pengajuan. Untuk non-pribadi (kecuali bawa_pulang), stok kurang = error.
     * Bawa Pulang: stok dicek saat approve (reservasi), bukan di submit.
     */
    public function validateItemsForSubmit(
        array $items,
        string $itemType,
        ?int $borrowerId = null,
        ?string $loanType = null,
    ): void {
        $allowsQueue = $itemType === 'bahan' || $loanType === 'pribadi';
        $skipRealtimeStock = $loanType === 'bawa_pulang';

        foreach ($items as $row) {
            $equipment = Equipment::query()->find($row['equipment_id'] ?? null);

            if (! $equipment || $equipment->item_type !== $itemType) {
                throw ValidationException::withMessages([
                    'items' => 'Barang tidak valid untuk jenis pengajuan ini.',
                ]);
            }

            if (! $equipment->isAvailableForInventory()) {
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

            if (! $allowsQueue && ! $skipRealtimeStock && $equipment->available < (int) $row['quantity']) {
                throw ValidationException::withMessages([
                    'items' => "Stok {$equipment->name} tidak mencukupi (tersedia: {$equipment->available}).",
                ]);
            }
        }
    }

    /**
     * Status awal: diminta (stok cukup) atau antrian (hanya pribadi + stok kurang).
     * Bawa Pulang selalu diminta — stok dialokasikan saat approve (reservasi).
     *
     * @param  array<string, mixed>  $context
     */
    public function resolveInitialStatus(array $items, string $itemType, array $context = [], ?int $exceptLoanId = null): string
    {
        $loanType = $context['loan_type']
            ?? Loan::resolveTypeFromLegacy($context['borrow_scope'] ?? null, $context['borrow_reason'] ?? null);

        if ($loanType === 'bawa_pulang') {
            return 'diminta';
        }

        $shortage = $this->hasStockShortage($items, $itemType, $context, $exceptLoanId);

        if (! $shortage) {
            return 'diminta';
        }

        if ($loanType === 'pribadi' || $itemType === 'bahan') {
            return 'antrian';
        }

        throw ValidationException::withMessages([
            'items' => 'Stok alat tidak mencukupi. Jenis peminjaman ini tidak menggunakan antrian.',
        ]);
    }

    /**
     * @deprecated Preempt lintas tipe dihapus; selalu return [].
     *
     * @param  array<int, array{equipment_id: mixed, quantity?: mixed}>  $items
     * @param  array<string, mixed>  $context
     * @return array<int, Loan>
     */
    public function preemptLowerPriorityDiminta(array $items, string $itemType, array $context, ?int $exceptLoanId = null): array
    {
        return [];
    }

    /**
     * @param  array<string, mixed>  $context
     */
    public function hasStockShortage(array $items, string $itemType = 'alat', array $context = [], ?int $exceptLoanId = null): bool
    {
        if ($this->slots()->hasShortage([
            ...$context,
            'item_type' => $itemType,
            'items' => $items,
        ], $exceptLoanId)) {
            return true;
        }

        return $itemType === 'alat'
            && ($context['loan_type'] ?? null) === 'pribadi'
            && $this->queuedAheadBlocksDraft($items, $context, $exceptLoanId);
    }

    public function enqueue(Loan $loan, ?User $actor = null): void
    {
        if ($loan->status !== 'antrian') {
            return;
        }

        if (! $loan->allowsQueue() && $loan->isAlat()) {
            throw ValidationException::withMessages([
                'status' => 'Hanya peminjaman pribadi yang dapat masuk antrian.',
            ]);
        }

        $loan->update([
            'queued_at' => $loan->queued_at ?? now(),
        ]);

        $position = $this->getQueuePosition($loan);
        $label = $loan->isAlat() ? 'alat' : 'bahan';

        $this->workflow()->logStatus(
            $loan,
            'antrian',
            $position
                ? "Masuk antrian stok {$label} (posisi #{$position}). Menunggu tersedia."
                : "Masuk antrian stok {$label}. Menunggu tersedia.",
            $actor,
            notify: false,
        );
    }

    /**
     * Skor urutan antrian = prioritas manual admin.
     */
    public function effectiveSortScore(Loan $loan): int
    {
        return (int) ($loan->queue_priority ?? 0);
    }

    public function setQueuePriority(Loan $loan, int $priority, ?User $actor = null, ?string $note = null): void
    {
        if ($loan->status !== 'antrian') {
            throw ValidationException::withMessages([
                'queue_priority' => 'Prioritas hanya dapat diatur untuk pengajuan berstatus antrian.',
            ]);
        }

        if ($loan->isAlat() && ! $loan->isPribadi()) {
            throw ValidationException::withMessages([
                'queue_priority' => 'Prioritas antrian hanya untuk peminjaman pribadi.',
            ]);
        }

        $loan->update([
            'queue_priority' => max(0, $priority),
            'queue_priority_note' => $note,
            'queue_priority_set_by' => $actor?->id,
            'queue_priority_set_at' => now(),
        ]);
    }

    /**
     * Antrian per barang: queue_priority DESC, queued_at ASC, id ASC.
     */
    public function queuedLoansForEquipment(int $equipmentId): Collection
    {
        return Loan::query()
            ->where('status', 'antrian')
            ->where(function ($q) {
                $q->where('loan_type', 'pribadi')
                    ->orWhere(function ($inner) {
                        $inner->where('item_type', 'bahan');
                    })
                    ->orWhere(function ($legacy) {
                        // Legacy rows tanpa loan_type: pribadi = lab + lanjutan
                        $legacy->whereNull('loan_type')
                            ->where('item_type', 'alat')
                            ->where('borrow_scope', 'lab')
                            ->where('borrow_reason', 'lanjutan');
                    });
            })
            ->whereHas('items', fn ($q) => $q->where('equipment_id', $equipmentId))
            ->with(['items', 'borrower:id,name', 'schedule'])
            ->get()
            ->sort(fn (Loan $a, Loan $b) => $this->compareQueueOrder($a, $b))
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

    public function allItemsAvailable(Loan $loan, int|array|null $exceptLoanIds = null, bool $includePending = true): bool
    {
        return ! $this->slots()->hasShortage($loan, $exceptLoanIds, $includePending);
    }

    public function promoteFromQueue(Loan $loan, ?User $actor = null, int|array|null $exceptLoanIds = null): bool
    {
        if ($loan->status !== 'antrian' || ! $this->allItemsAvailable($loan, $exceptLoanIds)) {
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

    public function demoteToQueue(Loan $loan, ?User $actor = null): bool
    {
        if ($loan->status !== 'diminta') {
            return false;
        }

        if ($loan->isAlat() && ! $loan->allowsQueue()) {
            return false;
        }

        $loan->update([
            'status' => 'antrian',
            'queued_at' => $loan->queued_at ?? $loan->created_at ?? now(),
        ]);

        $this->enqueue($loan->fresh(), $actor);
        app(\App\Services\Notification\LabNotificationService::class)->loanMovedToQueue($loan->fresh());

        return true;
    }

    /**
     * @param  array<int>  $equipmentIds
     * @return array<int, Loan>
     */
    public function demotePendingLoansForEquipments(array $equipmentIds, ?User $actor = null, ?int $exceptLoanId = null): array
    {
        $equipmentIds = array_values(array_unique(array_filter(array_map('intval', $equipmentIds))));

        if ($equipmentIds === []) {
            return [];
        }

        $pending = Loan::query()
            ->where('status', 'diminta')
            ->when($exceptLoanId, fn ($q) => $q->where('id', '!=', $exceptLoanId))
            ->where(function ($q) {
                $q->where('loan_type', 'pribadi')
                    ->orWhere('item_type', 'bahan')
                    ->orWhere(function ($legacy) {
                        $legacy->whereNull('loan_type')
                            ->where('item_type', 'alat')
                            ->where('borrow_scope', 'lab')
                            ->where('borrow_reason', 'lanjutan');
                    });
            })
            ->whereHas('items', fn ($q) => $q->whereIn('equipment_id', $equipmentIds))
            ->with(['items.equipment'])
            ->get();

        $demoted = [];

        foreach ($pending as $loan) {
            if ($this->allItemsAvailable($loan, includePending: false)) {
                continue;
            }

            if ($this->demoteToQueue($loan, $actor)) {
                $demoted[] = $loan->fresh();
            }
        }

        return $demoted;
    }

    /**
     * @param  array<int>  $exceptLoanIds
     * @return array<int, Loan>
     */
    public function processQueueForEquipment(
        int $equipmentId,
        ?User $actor = null,
        array $exceptLoanIds = [],
        bool $skipPraktikum = false,
    ): array {
        unset($skipPraktikum);

        $equipment = Equipment::query()->find($equipmentId);

        if (! $equipment) {
            return [];
        }

        if ($equipment->item_type === 'bahan' && $equipment->available <= 0) {
            return [];
        }

        $promoted = [];
        $virtualAvailability = $this->virtualAvailabilityMap();
        $virtualIntervals = [];

        foreach ($this->queuedLoansForEquipment($equipmentId) as $loan) {
            if (! $this->canAllocateLoan($loan, $virtualAvailability, $virtualIntervals, $exceptLoanIds)) {
                break;
            }

            if ($this->promoteFromQueue($loan, $actor, $exceptLoanIds)) {
                if (! $loan->isAlat()) {
                    $this->allocateLoanVirtually($loan, $virtualAvailability, $virtualIntervals);
                }
                $promoted[] = $loan->fresh();
            }
        }

        return $promoted;
    }

    /**
     * @param  array<int>  $equipmentIds
     * @param  array<int>  $exceptLoanIds
     * @return array<int, Loan>
     */
    public function processQueueForEquipments(
        array $equipmentIds,
        ?User $actor = null,
        array $exceptLoanIds = [],
        bool $skipPraktikum = false,
    ): array {
        unset($skipPraktikum);
        $promoted = [];

        foreach (array_unique($equipmentIds) as $equipmentId) {
            foreach ($this->processQueueForEquipment((int) $equipmentId, $actor, $exceptLoanIds) as $loan) {
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
            [$loan->id],
        );
    }

    public function resolveTimeSliceDueAt(Loan $loan, ?Carbon $from = null): Carbon
    {
        $from = ($from ?? now())->copy();
        $loan->loadMissing('schedule');

        if ($loan->isBawaPulang() || $loan->isLomba()) {
            $days = max(1, (int) config('lab.queue.bawa_pulang_max_days', 1));
            $close = (string) config('lab.queue.school_close_time', '17:00');
            $baseDate = $loan->request_date?->toDateString()
                ?? $from->toDateString();

            return Carbon::parse($baseDate.' '.$close)->addDays($days);
        }

        if ($loan->isPribadi()) {
            $close = (string) config('lab.queue.school_close_time', '17:00');
            $date = $loan->request_date?->toDateString()
                ?? $from->toDateString();

            return Carbon::parse($date.' '.$close);
        }

        if ($loan->schedule?->jam_selesai) {
            $date = $loan->request_date?->toDateString()
                ?? $loan->schedule->tanggal?->toDateString()
                ?? $from->toDateString();

            return Carbon::parse($date.' '.$loan->schedule->jam_selesai);
        }

        $close = (string) config('lab.queue.school_close_time', '17:00');

        return Carbon::parse($from->toDateString().' '.$close);
    }

    public function clampDueAtToTimeSlice(Loan $loan, ?Carbon $from = null): Carbon
    {
        $sliceEnd = $this->resolveTimeSliceDueAt($loan, $from);
        $requested = $loan->due_at;

        if ($requested === null) {
            return $sliceEnd;
        }

        return $requested->lessThanOrEqualTo($sliceEnd) ? $requested->copy() : $sliceEnd;
    }

    public function applyDueAtForLoan(Loan $loan, ?Carbon $from = null): void
    {
        if (! $loan->isAlat()) {
            return;
        }

        $loan->loadMissing('schedule');
        $loan->update([
            'due_at' => $this->resolveTimeSliceDueAt($loan, $from),
        ]);
    }

    /**
     * @return Collection<int, Loan>
     */
    public function globalQueue(?int $equipmentId = null): Collection
    {
        $query = Loan::query()
            ->where('status', 'antrian')
            ->with(['borrower:id,name,class', 'items.equipment:id,name', 'schedule']);

        if ($equipmentId) {
            $query->whereHas('items', fn ($q) => $q->where('equipment_id', $equipmentId));
        }

        return $query->get()->sort(fn (Loan $a, Loan $b) => $this->compareQueueOrder($a, $b))->values();
    }

    public function queueSummary(Loan $loan): array
    {
        $position = $this->getQueuePosition($loan);
        $loan->loadMissing('items.equipment', 'schedule');

        $stockAvailable = null;
        $stockNeeded = null;
        $slotWindow = $loan->isAlat() ? $this->slots()->windowFor($loan) : null;

        foreach ($loan->items as $item) {
            if (! $item->equipment) {
                continue;
            }

            $available = $loan->isAlat() && $slotWindow
                ? $this->slots()->remaining($item->equipment, $slotWindow[0], $slotWindow[1], $loan->id)
                : (int) ($item->equipment->available ?? 0);
            $needed = (int) $item->quantity;

            if ($stockAvailable === null || $available < $stockAvailable) {
                $stockAvailable = $available;
                $stockNeeded = $needed;
            }
        }

        $waitingStock = ! $this->allItemsAvailable($loan);
        $typeLabel = $loan->loanTypeLabel();

        return [
            'queue_position' => $position,
            'effective_sort_score' => $this->effectiveSortScore($loan),
            'queued_at' => $loan->queued_at?->toIso8601String(),
            'queued_at_formatted' => $loan->queued_at?->translatedFormat('d M Y H:i'),
            'queue_type_key' => $loan->queueTypeKey(),
            'queue_type_label' => $typeLabel,
            'queue_priority' => (int) ($loan->queue_priority ?? 0),
            'queue_priority_label' => $typeLabel,
            'queue_stock_available' => $stockAvailable ?? 0,
            'queue_stock_needed' => $stockNeeded ?? 0,
            'queue_waiting_stock' => $waitingStock,
            'queue_status_label' => $waitingStock
                ? 'Menunggu stok kembali'
                : 'Siap ditinjau',
        ];
    }

    public function compareQueueOrder(Loan $a, Loan $b): int
    {
        $scoreDiff = $this->effectiveSortScore($b) <=> $this->effectiveSortScore($a);

        if ($scoreDiff !== 0) {
            return $scoreDiff;
        }

        $aTime = $a->queued_at ?? $a->created_at;
        $bTime = $b->queued_at ?? $b->created_at;
        $timeDiff = $aTime <=> $bTime;

        if ($timeDiff !== 0) {
            return $timeDiff;
        }

        return $a->id <=> $b->id;
    }

    /**
     * @deprecated Proximity scoring removed; kept for call sites.
     */
    public function scheduleProximitySeconds(Loan $loan, ?Carbon $at = null): int
    {
        unset($loan, $at);

        return PHP_INT_MAX;
    }

    /**
     * @param  array<int, array{equipment_id: mixed, quantity?: mixed}>  $items
     * @param  array<string, mixed>  $context
     */
    private function queuedAheadBlocksDraft(array $items, array $context, ?int $exceptLoanId = null): bool
    {
        [$incomingStart, $incomingEnd] = $this->slots()->windowFromContext($context);
        $exceptLoanIds = $exceptLoanId ? [(int) $exceptLoanId] : [];

        foreach ($items as $row) {
            $equipmentId = (int) ($row['equipment_id'] ?? 0);
            $needed = (int) ($row['quantity'] ?? 0);
            $equipment = $equipmentId ? Equipment::query()->find($equipmentId) : null;

            if (! $equipment || $equipment->item_type !== 'alat' || $needed <= 0) {
                continue;
            }

            $virtualAvailability = $this->virtualAvailabilityMap();
            $virtualIntervals = [];
            $headDoesNotFit = false;

            foreach ($this->queuedLoansForEquipment($equipmentId) as $queued) {
                if ($exceptLoanId && $queued->id === $exceptLoanId) {
                    continue;
                }

                [$queuedStart, $queuedEnd] = $this->slots()->windowFor($queued);

                if (! ($incomingStart->lt($queuedEnd) && $queuedStart->lt($incomingEnd))) {
                    continue;
                }

                if (! $this->canAllocateLoan($queued, $virtualAvailability, $virtualIntervals, $exceptLoanIds)) {
                    $headDoesNotFit = true;
                    break;
                }

                $this->allocateLoanVirtually($queued, $virtualAvailability, $virtualIntervals);
            }

            if ($headDoesNotFit) {
                return true;
            }

            $remaining = $this->slots()->remaining(
                $equipment,
                $incomingStart,
                $incomingEnd,
                $exceptLoanId,
                $virtualIntervals[$equipmentId] ?? [],
            );

            if ($remaining < $needed) {
                return true;
            }
        }

        return false;
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
     * @param  array<int, array<int, array{0: Carbon, 1: Carbon, 2: int}>>  $virtualIntervals
     * @param  array<int>  $exceptLoanIds
     */
    private function canAllocateLoan(
        Loan $loan,
        array $virtualAvailability,
        array $virtualIntervals,
        array $exceptLoanIds = [],
    ): bool {
        $loan->loadMissing('items.equipment', 'schedule');

        if (! $loan->isAlat()) {
            foreach ($loan->items as $item) {
                $available = $virtualAvailability[$item->equipment_id] ?? 0;

                if ($available < $item->quantity) {
                    return false;
                }
            }

            return true;
        }

        [$start, $end] = $this->slots()->windowFor($loan);

        foreach ($loan->items as $item) {
            $equipment = $item->equipment;

            if (! $equipment) {
                return false;
            }

            $remaining = $this->slots()->remaining(
                $equipment,
                $start,
                $end,
                [$loan->id, ...$exceptLoanIds],
                $virtualIntervals[$equipment->id] ?? [],
            );

            if ($remaining < $item->quantity) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param  array<int, int>  $virtualAvailability
     * @param  array<int, array<int, array{0: Carbon, 1: Carbon, 2: int}>>  $virtualIntervals
     */
    private function allocateLoanVirtually(Loan $loan, array &$virtualAvailability, array &$virtualIntervals): void
    {
        $loan->loadMissing('items.equipment', 'schedule');

        if (! $loan->isAlat()) {
            foreach ($loan->items as $item) {
                $virtualAvailability[$item->equipment_id] = ($virtualAvailability[$item->equipment_id] ?? 0) - $item->quantity;
            }

            return;
        }

        [$start, $end] = $this->slots()->windowFor($loan);

        foreach ($loan->items as $item) {
            $virtualIntervals[$item->equipment_id][] = [$start, $end, (int) $item->quantity];
        }
    }

    private function slots(): LoanSlotAvailabilityService
    {
        return app(LoanSlotAvailabilityService::class);
    }

    private function workflow(): LoanWorkflowService
    {
        return app(LoanWorkflowService::class);
    }
}
