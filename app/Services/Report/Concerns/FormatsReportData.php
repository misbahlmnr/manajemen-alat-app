<?php

namespace App\Services\Report\Concerns;

use App\Models\Equipment;
use App\Models\Loan;
use App\Models\LoanItem;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

trait FormatsReportData
{
    protected function resolvePeriod(array $filters): array
    {
        $from = $filters['date_from'] !== '' ? $filters['date_from'] : null;
        $to = $filters['date_to'] !== '' ? $filters['date_to'] : null;

        return [$from, $to];
    }

    protected function formatInventarisRow(Equipment $item, string $itemType): array
    {
        return [
            'id' => $item->id,
            'code' => $item->code,
            'name' => $item->name,
            'category' => $item->category,
            'item_type' => $itemType,
            'item_type_label' => $itemType === 'alat' ? 'Alat' : 'Bahan',
            'stock' => $item->stock,
            'available' => $item->available,
            'borrowed' => max(0, $item->stock - $item->available),
            'unit' => $item->unit ?? ($itemType === 'alat' ? 'unit' : 'pcs'),
            'condition_breakdown' => $item->condition_breakdown,
            'condition_label' => $this->formatConditionBreakdownLabel($item),
            'image_url' => $item->image_url,
            'location' => $item->location ?? '—',
            'status' => $item->status,
            'availability_label' => $item->availability_label,
            'stock_label' => $item->stock_label ?? '',
            'is_low_stock' => $item->is_low_stock,
            'min_stock' => $item->min_stock,
            'description' => $item->description,
        ];
    }

    protected function formatLoanRow(Loan $loan): array
    {
        $items = $loan->relationLoaded('items')
            ? $loan->items->map(fn ($item) => [
                'equipment_name' => $item->equipment?->name,
                'equipment_code' => $item->equipment?->code,
                'quantity' => $item->quantity,
                'unit' => $item->equipment?->unit,
            ])->values()->all()
            : [];

        $itemsSummary = collect($items)
            ->map(fn ($i) => ($i['equipment_name'] ?? 'Item').' ×'.$i['quantity'])
            ->join(', ') ?: '—';

        $totalQty = (int) collect($items)->sum('quantity');

        return [
            'id' => $loan->id,
            'code' => $loan->code,
            'borrower_name' => $loan->borrower?->name ?? '—',
            'borrower_class' => $loan->borrower?->class ?? '—',
            'supervisor_name' => $loan->supervisor?->name ?? '—',
            'schedule_title' => $loan->schedule?->title,
            'items_summary' => $itemsSummary,
            'total_quantity' => $totalQty,
            'item_type' => $loan->item_type,
            'item_type_label' => $loan->item_type === 'alat' ? 'Alat' : 'Bahan',
            'status' => $loan->status,
            'borrow_scope' => $loan->borrow_scope,
            'borrow_scope_label' => $loan->borrowLocationLabel(),
            'borrow_reason' => $loan->borrow_reason,
            'borrow_reason_label' => $loan->borrowReasonLabel(),
            'is_catch_up' => $loan->isCatchUp(),
            'request_date_formatted' => $loan->request_date?->translatedFormat('d M Y') ?? '—',
            'borrowed_at_formatted' => $loan->borrowed_at?->translatedFormat('d M Y H:i') ?? '—',
            'due_at_formatted' => $loan->due_at?->translatedFormat('d M Y H:i') ?? '—',
            'returned_at_formatted' => $loan->returned_at?->translatedFormat('d M Y H:i') ?? '—',
            'purpose' => $loan->purpose,
            'notes' => $loan->notes,
            'collateral_status' => $loan->collateral?->status,
            'collateral_status_label' => $loan->collateral?->status
                ? (config('lab.collateral_statuses')[$loan->collateral->status] ?? $loan->collateral->status)
                : '—',
        ];
    }

    protected function formatConditionBreakdownLabel(Equipment $item): string
    {
        $parts = [];

        foreach ($item->condition_breakdown as $key => $qty) {
            if ($qty <= 0) {
                continue;
            }

            $parts[] = $this->conditionLabel($key)." ({$qty})";
        }

        return $parts !== [] ? implode(', ', $parts) : '—';
    }

    protected function conditionLabel(?string $condition): string
    {
        return match ($condition) {
            'baik' => 'Baik',
            'rusak_ringan' => 'Rusak Ringan',
            'rusak_berat' => 'Rusak Berat',
            default => $condition ?? '—',
        };
    }

    protected function buildInventarisReport(array $filters): array
    {
        $itemType = $filters['item_type'];
        $rows = collect();

        if ($itemType !== 'bahan') {
            $rows = $rows->merge(
                Equipment::query()
                    ->alat()
                    ->orderBy('category')
                    ->orderBy('name')
                    ->get()
                    ->map(fn (Equipment $item) => $this->formatInventarisRow($item, 'alat'))
            );
        }

        if ($itemType !== 'alat') {
            $rows = $rows->merge(
                \App\Models\Supply::query()
                    ->orderBy('category')
                    ->orderBy('name')
                    ->get()
                    ->map(fn ($item) => $this->formatInventarisRow($item, 'bahan'))
            );
        }

        $collection = $rows->values();

        return [
            'rows' => $collection->all(),
            'stats' => [
                'total' => $collection->count(),
                'alat' => $collection->where('item_type', 'alat')->count(),
                'bahan' => $collection->where('item_type', 'bahan')->count(),
                'tersedia' => $collection->sum('available'),
                'baik' => $collection->sum(fn ($row) => $row['condition_breakdown']['baik'] ?? 0),
                'rusak' => $collection->sum(fn ($row) => ($row['condition_breakdown']['rusak_ringan'] ?? 0) + ($row['condition_breakdown']['rusak_berat'] ?? 0)),
                'low_stock' => $collection->where('is_low_stock', true)->count(),
            ],
        ];
    }

    /**
     * Analytics aditif untuk tab ringkasan (chart, insight, round robin, aktivitas).
     *
     * @return array{
     *     charts: array,
     *     insights: array,
     *     round_robin: array,
     *     recent_activity: array<int, array>
     * }
     */
    protected function buildRingkasanAnalytics(Builder $loanBase, ?string $from, ?string $to): array
    {
        $queued = (clone $loanBase)->where('status', 'antrian')->count();
        $awaitingApproval = (clone $loanBase)->where('status', 'diminta')->count();
        $approved = (clone $loanBase)->where('status', 'disetujui')->count();
        $borrowed = (clone $loanBase)->where('status', 'dipinjam')->count();
        $overdue = (clone $loanBase)->where('status', 'terlambat')->count();
        $returned = (clone $loanBase)->where('status', 'dikembalikan')->count();
        $rejected = (clone $loanBase)->where('status', 'ditolak')->count();

        return [
            'charts' => [
                'submission_trend' => $this->buildSubmissionTrend($loanBase, $from, $to),
                'status_distribution' => array_values(array_filter([
                    ['label' => 'Menunggu Persetujuan', 'key' => 'diminta', 'value' => $awaitingApproval],
                    ['label' => 'Antrian', 'key' => 'antrian', 'value' => $queued],
                    ['label' => 'Disetujui', 'key' => 'disetujui', 'value' => $approved],
                    ['label' => 'Dipinjam', 'key' => 'dipinjam', 'value' => $borrowed],
                    ['label' => 'Terlambat', 'key' => 'terlambat', 'value' => $overdue],
                    ['label' => 'Dikembalikan', 'key' => 'dikembalikan', 'value' => $returned],
                    ['label' => 'Ditolak', 'key' => 'ditolak', 'value' => $rejected],
                ], fn (array $row) => $row['value'] > 0)),
            ],
            'insights' => [
                'top_alat' => $this->buildTopBorrowedItems($loanBase, 'alat'),
                'top_bahan' => $this->buildTopBorrowedItems($loanBase, 'bahan'),
            ],
            'round_robin' => $this->buildRoundRobinStats($loanBase),
            'recent_activity' => $this->buildRecentActivity($loanBase),
            'queued' => $queued,
            'awaiting_approval' => $awaitingApproval,
        ];
    }

    /**
     * @return list<array{label: string, total: int}>
     */
    protected function buildSubmissionTrend(Builder $loanBase, ?string $from, ?string $to): array
    {
        $fromDate = $from ? Carbon::parse($from)->startOfDay() : null;
        $toDate = $to ? Carbon::parse($to)->endOfDay() : null;

        if (! $fromDate || ! $toDate) {
            $toDate = now()->endOfDay();
            $fromDate = now()->subDays(29)->startOfDay();
        }

        $days = $fromDate->diffInDays($toDate);
        $groupByMonth = $days > 45;
        $driver = DB::connection()->getDriverName();

        if ($groupByMonth) {
            $labelExpr = match ($driver) {
                'sqlite' => "strftime('%Y-%m', request_date)",
                'pgsql' => "to_char(request_date, 'YYYY-MM')",
                default => "DATE_FORMAT(request_date, '%Y-%m')",
            };
        } else {
            $labelExpr = match ($driver) {
                'sqlite' => "strftime('%Y-%m-%d', request_date)",
                'pgsql' => 'request_date::date',
                default => 'DATE(request_date)',
            };
        }

        $rows = (clone $loanBase)
            ->selectRaw("{$labelExpr} as bucket, COUNT(*) as total")
            ->whereNotNull('request_date')
            ->groupBy('bucket')
            ->orderBy('bucket')
            ->get();

        return $rows->map(function ($row) use ($groupByMonth) {
            $bucket = (string) $row->bucket;
            $label = $groupByMonth
                ? Carbon::createFromFormat('Y-m', $bucket)->translatedFormat('M Y')
                : Carbon::parse($bucket)->translatedFormat('d M');

            return [
                'label' => $label,
                'total' => (int) $row->total,
            ];
        })->values()->all();
    }

    /**
     * @return list<array{name: string, count: int}>
     */
    protected function buildTopBorrowedItems(Builder $loanBase, string $itemType): array
    {
        $loanIds = (clone $loanBase)
            ->where('item_type', $itemType)
            ->pluck('id');

        if ($loanIds->isEmpty()) {
            return [];
        }

        return LoanItem::query()
            ->select([
                'equipment.name as name',
                DB::raw('SUM(loan_items.quantity) as total_qty'),
            ])
            ->join('equipment', 'equipment.id', '=', 'loan_items.equipment_id')
            ->whereIn('loan_items.loan_id', $loanIds)
            ->groupBy('equipment.id', 'equipment.name')
            ->orderByDesc('total_qty')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'name' => (string) $row->name,
                'count' => (int) $row->total_qty,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    protected function buildRoundRobinStats(Builder $loanBase): array
    {
        $waiting = (clone $loanBase)->where('status', 'antrian')->count();
        $enteredQueue = (clone $loanBase)->whereNotNull('queued_at')->count();
        $adminPriorityActive = (clone $loanBase)
            ->where('status', 'antrian')
            ->where('queue_priority', '>', 0)
            ->count();

        $waitSamples = (clone $loanBase)
            ->whereNotNull('queued_at')
            ->whereNotNull('borrowed_at')
            ->get(['queued_at', 'borrowed_at']);

        $avgWaitHours = null;
        if ($waitSamples->isNotEmpty()) {
            $avgMinutes = $waitSamples->avg(
                fn (Loan $loan) => $loan->queued_at->diffInMinutes($loan->borrowed_at)
            );
            $avgWaitHours = round($avgMinutes / 60, 1);
        }

        $longest = (clone $loanBase)
            ->where('status', 'antrian')
            ->whereNotNull('queued_at')
            ->with(['borrower:id,name', 'submission:id,code'])
            ->orderBy('queued_at')
            ->first();

        $longestLabel = null;
        $longestHours = null;
        if ($longest) {
            $longestHours = round($longest->queued_at->diffInMinutes(now()) / 60, 1);
            $longestLabel = ($longest->displayCode()).' · '.($longest->borrower?->name ?? '—');
        }

        return [
            'total_entered_queue' => $enteredQueue,
            'waiting' => $waiting,
            'admin_priority_active' => $adminPriorityActive,
            'avg_wait_hours' => $avgWaitHours,
            'longest_queue_label' => $longestLabel,
            'longest_queue_hours' => $longestHours,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function buildRecentActivity(Builder $loanBase): array
    {
        return (clone $loanBase)
            ->with(['borrower:id,name,class', 'submission:id,code'])
            ->latest('created_at')
            ->limit(5)
            ->get()
            ->map(fn (Loan $loan) => [
                'id' => $loan->id,
                'submission_code' => $loan->displayCode(),
                'borrower_name' => $loan->borrower?->name ?? '—',
                'item_type' => $loan->item_type,
                'item_type_label' => $loan->item_type === 'alat' ? 'Alat' : 'Bahan',
                'status' => $loan->status,
                'status_label' => config('lab.loan_statuses')[$loan->status] ?? $loan->status,
                'date' => $loan->request_date?->toDateString()
                    ?? $loan->created_at?->toDateString(),
                'date_formatted' => $loan->request_date?->translatedFormat('d M Y')
                    ?? $loan->created_at?->translatedFormat('d M Y')
                    ?? '—',
            ])
            ->values()
            ->all();
    }
}
