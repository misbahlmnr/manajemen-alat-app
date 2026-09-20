<?php

namespace App\Services\Loan;

use App\Models\Equipment;
use App\Models\Loan;
use App\Models\PracticumSchedule;
use Carbon\Carbon;

class LoanSlotAvailabilityService
{
    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    public function windowFor(Loan $loan): array
    {
        $loan->loadMissing('schedule');

        [$start, $end] = $this->windowFromContext([
            'item_type' => $loan->item_type,
            'loan_type' => $loan->resolvedLoanType(),
            'borrow_scope' => $loan->borrow_scope,
            'borrow_reason' => $loan->borrow_reason,
            'request_date' => $loan->request_date?->toDateString(),
            'practicum_schedule_id' => $loan->practicum_schedule_id,
            'due_at' => $loan->due_at,
            'status' => $loan->status,
        ], $loan->schedule);

        if ($this->isPhysicallyOut($loan->status)) {
            $now = PracticumSchedule::inSchoolTimezone();
            if ($end->lt($now)) {
                $end = $now->copy();
            }
        }

        return [$start, $end];
    }

    /**
     * @param  array<string, mixed>  $context
     * @return array{0: Carbon, 1: Carbon}
     */
    public function windowFromContext(array $context, ?PracticumSchedule $schedule = null): array
    {
        $timezone = PracticumSchedule::schoolTimezone();
        $date = $this->contextDate($context);
        $loanType = $context['loan_type']
            ?? Loan::resolveTypeFromLegacy(
                $context['borrow_scope'] ?? null,
                $context['borrow_reason'] ?? null,
            );
        $open = $this->labOpenTime();
        $close = $this->schoolCloseTime();

        if ($schedule === null && ! empty($context['practicum_schedule_id'])) {
            $schedule = PracticumSchedule::query()->find($context['practicum_schedule_id']);
        }

        if (in_array($loanType, ['bawa_pulang', 'lomba'], true)) {
            // Selalu mulai dari jam pulang sekolah agar tidak overlap dengan Praktik Lab hari yang sama.
            $closeAt = Carbon::parse($date.' '.$close, $timezone);
            $start = $closeAt->copy();

            $dueAt = $this->parseDueAt($context['due_at'] ?? null, $timezone);
            $end = $dueAt ?? $closeAt->copy()->addDays($this->bawaPulangMaxDays());

            if ($end->lte($start)) {
                $end = $start->copy()->addDays($this->bawaPulangMaxDays());
            }

            return [$start, $end];
        }

        if ($loanType === 'praktikum' && $schedule?->jam_mulai && $schedule?->jam_selesai) {
            return [
                Carbon::parse($date.' '.$this->normalizeTime($schedule->jam_mulai), $timezone),
                Carbon::parse($date.' '.$this->normalizeTime($schedule->jam_selesai), $timezone),
            ];
        }

        return [
            Carbon::parse($date.' '.$open, $timezone),
            Carbon::parse($date.' '.$close, $timezone),
        ];
    }

    public function windowHasStarted(Loan $loan, ?Carbon $at = null): bool
    {
        $at = $at ? PracticumSchedule::inSchoolTimezone($at) : PracticumSchedule::inSchoolTimezone();
        [$start] = $this->windowFor($loan);

        return $start->lte($at);
    }

    public function slotLabel(Loan $loan): ?string
    {
        return $this->slotPresentation($loan)['label'] ?? null;
    }

    /**
     * @return array{kind: string, label: string, field_label: string, hint: string|null}|null
     */
    public function slotPresentation(Loan $loan): ?array
    {
        if (! $loan->isAlat() || $loan->request_date === null) {
            return null;
        }

        $loan->loadMissing('schedule');
        $schedule = $loan->schedule;

        if (
            $loan->practicum_schedule_id
            && ($schedule === null || ! $schedule->jam_mulai || ! $schedule->jam_selesai)
        ) {
            $schedule = PracticumSchedule::query()->find($loan->practicum_schedule_id);
        }

        [$start, $end] = $this->windowFromContext([
            'item_type' => $loan->item_type,
            'borrow_scope' => $loan->borrow_scope,
            'borrow_reason' => $loan->borrow_reason,
            'request_date' => $loan->request_date->toDateString(),
            'practicum_schedule_id' => $loan->practicum_schedule_id,
            'due_at' => $loan->due_at,
            'status' => $loan->status,
        ], $schedule);

        $startTime = $start->format('H:i');
        $endTime = $end->format('H:i');
        $kind = $this->slotKindFor($loan);

        if ($kind === 'lab_hours') {
            return [
                'kind' => 'lab_hours',
                'label' => "Pakai di lab sampai jam {$endTime}",
                'field_label' => 'Pemakaian',
                'hint' => null,
            ];
        }

        if ($kind === 'take_home') {
            $return = $start->isSameDay($end)
                ? $endTime
                : $end->format('d M').' '.$endTime;

            return [
                'kind' => 'take_home',
                'label' => "Kembali {$return}",
                'field_label' => 'Bawa pulang',
                'hint' => $loan->isBawaPulangLomba()
                    ? 'Boleh diambil setelah disetujui dan kartu ditahan.'
                    : 'Diambil setelah jam mapel terakhir yang memakai alat ini selesai.',
            ];
        }

        return [
            'kind' => 'schedule',
            'label' => "{$startTime}–{$endTime}",
            'field_label' => 'Jam mapel',
            'hint' => null,
        ];
    }

    /**
     * @return array{slot_label: string|null, slot_kind: string|null, slot_field_label: string|null, slot_hint: string|null}
     */
    public function slotView(Loan $loan): array
    {
        $presentation = $this->slotPresentation($loan);

        return [
            'slot_label' => $presentation['label'] ?? null,
            'slot_kind' => $presentation['kind'] ?? null,
            'slot_field_label' => $presentation['field_label'] ?? null,
            'slot_hint' => $presentation['hint'] ?? null,
        ];
    }

    private function slotKindFor(Loan $loan): string
    {
        if ($loan->isBawaPulang() || $loan->isLomba()) {
            return 'take_home';
        }

        if ($loan->isPribadi()) {
            return 'lab_hours';
        }

        return 'schedule';
    }

    /**
     * @deprecated Handover tidak lagi menunggu akhir praktikum.
     */
    public function lastPraktikumEndFor(Loan $loan): ?Carbon
    {
        unset($loan);

        return null;
    }

    public function canHandOver(Loan $loan, ?Carbon $at = null): bool
    {
        return $this->handoverBlockedReason($loan, $at) === null;
    }

    public function handoverBlockedReason(Loan $loan, ?Carbon $at = null): ?string
    {
        unset($loan, $at);

        // Serah terima tidak lagi diblokir menunggu praktikum selesai.
        return null;
    }

    /**
     * Puncak pemakaian bersamaan di jendela — bukan jumlah semua booking yang overlap.
     * Pagi 6 + siang 6 tidak saling makan (Peak Concurrent untuk non-pribadi).
     * Remaining Pribadi memakai committedForPersonal (Reserved Campus), bukan method ini.
     *
     * @param  array<int, array{0: Carbon, 1: Carbon, 2: int}>  $extraIntervals
     */
    public function committedQuantity(
        int $equipmentId,
        Carbon $start,
        Carbon $end,
        int|array|null $exceptLoanIds = null,
        array $extraIntervals = [],
        bool $includePending = true,
    ): int {
        $intervals = [
            ...$this->occupyingIntervals($equipmentId, $exceptLoanIds, $includePending),
            ...$extraIntervals,
        ];

        return $this->peakConcurrent($intervals, $start, $end);
    }

    /**
     * Committed qty for loan_type=pribadi: Reserved Campus (praktikum + lomba on request_date)
     * plus other occupying pribadi. Does not use Peak Concurrent. No double count.
     *
     * Date basis: request_date in school timezone (not created_at / updated_at / due_at).
     * Bawa pulang excluded. Lomba counts only after a Loan exists (Delayed Activation).
     */
    public function committedForPersonal(
        int $equipmentId,
        string $requestDate,
        int|array|null $exceptLoanIds = null,
        bool $includePending = true,
    ): int {
        $except = $this->normalizeExceptIds($exceptLoanIds);
        $statuses = $includePending ? Loan::SLOT_OCCUPYING_STATUSES : Loan::SLOT_FIRM_STATUSES;
        $date = PracticumSchedule::inSchoolTimezone($requestDate)->toDateString();

        $loans = Loan::query()
            ->where('item_type', 'alat')
            ->whereIn('status', $statuses)
            ->whereDate('request_date', $date)
            ->when($except !== [], fn ($q) => $q->whereNotIn('id', $except))
            ->whereHas('items', fn ($q) => $q->where('equipment_id', $equipmentId))
            ->with([
                'items' => fn ($q) => $q->where('equipment_id', $equipmentId),
            ])
            ->get();

        $reservedCampus = 0;
        $otherPersonal = 0;

        foreach ($loans as $loan) {
            $quantity = (int) $loan->items->sum('quantity');

            if ($quantity <= 0) {
                continue;
            }

            $loanType = $loan->resolvedLoanType();

            if (in_array($loanType, ['praktikum', 'lomba'], true)) {
                $reservedCampus += $quantity;
            } elseif ($loanType === 'pribadi') {
                $otherPersonal += $quantity;
            }
        }

        return $reservedCampus + $otherPersonal;
    }

    /**
     * @param  array<int, array{0: Carbon, 1: Carbon, 2: int}>  $extraIntervals
     */
    public function remaining(
        Equipment $equipment,
        Carbon $start,
        Carbon $end,
        int|array|null $exceptLoanIds = null,
        array $extraIntervals = [],
        bool $includePending = true,
    ): int {
        if ($equipment->item_type !== 'alat') {
            return app(LoanMaterialAvailabilityService::class)
                ->remaining($equipment, $exceptLoanIds, $includePending);
        }

        $capacity = max(0, (int) $equipment->qty_baik);
        $committed = $this->committedQuantity(
            $equipment->id,
            $start,
            $end,
            $exceptLoanIds,
            $extraIntervals,
            $includePending,
        );

        return max(0, $capacity - $committed);
    }

    /**
     * @param  array<string, mixed>|Loan  $draft
     */
    public function hasShortage(
        Loan|array $draft,
        int|array|null $exceptLoanIds = null,
        bool $includePending = true,
    ): bool {
        if ($draft instanceof Loan) {
            $draft->loadMissing('items.equipment', 'schedule');
            $exceptLoanIds = $this->normalizeExceptIds($exceptLoanIds, $draft->id);

            if (! $draft->isAlat()) {
                $materials = app(LoanMaterialAvailabilityService::class);
                foreach ($draft->items as $item) {
                    if ($item->equipment && $materials->hasShortage(
                        $item->equipment,
                        (int) $item->quantity,
                        $exceptLoanIds,
                        $includePending,
                    )) {
                        return true;
                    }
                }

                return false;
            }

            if ($draft->isPribadi()) {
                $context = [
                    'loan_type' => 'pribadi',
                    'borrow_scope' => $draft->borrow_scope,
                    'borrow_reason' => $draft->borrow_reason,
                    'request_date' => $draft->request_date?->toDateString(),
                ];

                foreach ($draft->items as $item) {
                    if (! $item->equipment) {
                        continue;
                    }

                    if ($this->remainingForDraft(
                        $item->equipment,
                        $context,
                        $exceptLoanIds,
                        $includePending,
                    ) < (int) $item->quantity) {
                        return true;
                    }
                }

                return false;
            }

            [$start, $end] = $this->windowFor($draft);

            foreach ($draft->items as $item) {
                if (! $item->equipment) {
                    continue;
                }

                if ($this->remaining($item->equipment, $start, $end, $exceptLoanIds, [], $includePending) < (int) $item->quantity) {
                    return true;
                }
            }

            return false;
        }

        $itemType = $draft['item_type'] ?? 'alat';
        $items = $draft['items'] ?? [];

        if ($itemType !== 'alat') {
            $materials = app(LoanMaterialAvailabilityService::class);
            foreach ($items as $row) {
                $equipment = Equipment::query()->find($row['equipment_id'] ?? null);

                if ($equipment && $materials->hasShortage(
                    $equipment,
                    (int) $row['quantity'],
                    $exceptLoanIds,
                    $includePending,
                )) {
                    return true;
                }
            }

            return false;
        }

        $loanType = $draft['loan_type']
            ?? Loan::resolveTypeFromLegacy(
                $draft['borrow_scope'] ?? null,
                $draft['borrow_reason'] ?? null,
            );

        if ($loanType === 'pribadi') {
            foreach ($items as $row) {
                $equipment = Equipment::query()->find($row['equipment_id'] ?? null);

                if (! $equipment) {
                    continue;
                }

                if ($this->remainingForDraft($equipment, $draft, $exceptLoanIds, $includePending) < (int) ($row['quantity'] ?? 0)) {
                    return true;
                }
            }

            return false;
        }

        [$start, $end] = $this->windowFromContext($draft);

        foreach ($items as $row) {
            $equipment = Equipment::query()->find($row['equipment_id'] ?? null);

            if (! $equipment) {
                continue;
            }

            if ($this->remaining($equipment, $start, $end, $exceptLoanIds, [], $includePending) < (int) $row['quantity']) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  array<string, mixed>  $context
     */
    public function remainingForDraft(
        Equipment $equipment,
        array $context,
        int|array|null $exceptLoanIds = null,
        bool $includePending = true,
    ): int {
        if ($equipment->item_type !== 'alat') {
            return app(LoanMaterialAvailabilityService::class)
                ->remaining($equipment, $exceptLoanIds, $includePending);
        }

        $loanType = $context['loan_type']
            ?? Loan::resolveTypeFromLegacy(
                $context['borrow_scope'] ?? null,
                $context['borrow_reason'] ?? null,
            );

        if ($loanType === 'pribadi') {
            $capacity = max(0, (int) $equipment->qty_baik);
            $committed = $this->committedForPersonal(
                $equipment->id,
                $this->contextDate($context),
                $exceptLoanIds,
                $includePending,
            );

            return max(0, $capacity - $committed);
        }

        [$start, $end] = $this->windowFromContext($context);

        return $this->remaining($equipment, $start, $end, $exceptLoanIds, [], $includePending);
    }

    /**
     * @param  array<int, array{0: Carbon, 1: Carbon, 2: int}>  $intervals
     */
    public function peakConcurrent(array $intervals, Carbon $start, Carbon $end): int
    {
        if ($start->gte($end)) {
            return 0;
        }

        $events = [];

        foreach ($intervals as $interval) {
            [$intervalStart, $intervalEnd, $quantity] = $interval;
            $quantity = (int) $quantity;

            if ($quantity <= 0 || $intervalStart->gte($end) || $intervalEnd->lte($start)) {
                continue;
            }

            $clipStart = $intervalStart->greaterThan($start) ? $intervalStart : $start;
            $clipEnd = $intervalEnd->lessThan($end) ? $intervalEnd : $end;

            $events[] = [$clipStart->getTimestamp(), 1, $quantity];
            $events[] = [$clipEnd->getTimestamp(), 0, $quantity];
        }

        usort($events, function (array $a, array $b): int {
            if ($a[0] !== $b[0]) {
                return $a[0] <=> $b[0];
            }

            return $a[1] <=> $b[1];
        });

        $current = 0;
        $peak = 0;

        foreach ($events as [, $isStart, $quantity]) {
            $current += $isStart ? $quantity : -$quantity;
            $peak = max($peak, $current);
        }

        return $peak;
    }

    /**
     * @return array<int, array{0: Carbon, 1: Carbon, 2: int}>
     */
    private function occupyingIntervals(
        int $equipmentId,
        int|array|null $exceptLoanIds = null,
        bool $includePending = true,
    ): array {
        $except = $this->normalizeExceptIds($exceptLoanIds);
        $statuses = $includePending ? Loan::SLOT_OCCUPYING_STATUSES : Loan::SLOT_FIRM_STATUSES;

        $loans = Loan::query()
            ->where('item_type', 'alat')
            ->whereIn('status', $statuses)
            ->when($except !== [], fn ($q) => $q->whereNotIn('id', $except))
            ->whereHas('items', fn ($q) => $q->where('equipment_id', $equipmentId))
            ->with([
                'schedule',
                'items' => fn ($q) => $q->where('equipment_id', $equipmentId),
            ])
            ->get();

        $intervals = [];

        foreach ($loans as $loan) {
            $quantity = (int) $loan->items->sum('quantity');

            if ($quantity <= 0) {
                continue;
            }

            [$start, $end] = $this->windowFor($loan);
            $intervals[] = [$start, $end, $quantity];
        }

        return $intervals;
    }

    /**
     * @return array<int, int>
     */
    private function normalizeExceptIds(int|array|null $exceptLoanIds, ?int $alsoExcept = null): array
    {
        $ids = is_array($exceptLoanIds)
            ? $exceptLoanIds
            : ($exceptLoanIds !== null ? [$exceptLoanIds] : []);

        if ($alsoExcept) {
            $ids[] = $alsoExcept;
        }

        return array_values(array_unique(array_filter(array_map('intval', $ids))));
    }

    private function isPhysicallyOut(?string $status): bool
    {
        return in_array($status, ['dipinjam', 'terlambat', 'menunggu_inspeksi'], true);
    }

    /**
     * @param  array<string, mixed>  $context
     */
    private function contextDate(array $context): string
    {
        $raw = $context['request_date'] ?? null;

        if ($raw instanceof Carbon) {
            return PracticumSchedule::inSchoolTimezone($raw)->toDateString();
        }

        if (is_string($raw) && $raw !== '') {
            return PracticumSchedule::inSchoolTimezone($raw)->toDateString();
        }

        return PracticumSchedule::inSchoolTimezone()->toDateString();
    }

    private function parseDueAt(mixed $value, string $timezone): ?Carbon
    {
        if ($value instanceof Carbon) {
            return $value->copy()->timezone($timezone);
        }

        if (! is_string($value) || $value === '') {
            return null;
        }

        return Carbon::parse(str_replace('T', ' ', $value), $timezone);
    }

    private function labOpenTime(): string
    {
        return $this->normalizeTime((string) config('lab.queue.lab_open_time', '07:00'));
    }

    private function schoolCloseTime(): string
    {
        return $this->normalizeTime((string) config('lab.queue.school_close_time', '17:00'));
    }

    private function bawaPulangMaxDays(): int
    {
        return max(1, (int) config('lab.queue.bawa_pulang_max_days', 1));
    }

    private function normalizeTime(mixed $value): string
    {
        $time = substr((string) $value, 0, 8);

        if ($time === '') {
            return '00:00:00';
        }

        return strlen($time) === 5 ? "{$time}:00" : $time;
    }
}
