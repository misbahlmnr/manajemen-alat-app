<?php

namespace App\Services\Report\Concerns;

use App\Models\Equipment;
use App\Models\Loan;

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
            'condition' => $item->condition,
            'condition_label' => $this->conditionLabel($item->condition),
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
                'baik' => $collection->where('condition', 'baik')->count(),
                'rusak' => $collection->whereIn('condition', ['rusak_ringan', 'rusak_berat'])->count(),
                'low_stock' => $collection->where('is_low_stock', true)->count(),
            ],
        ];
    }
}
