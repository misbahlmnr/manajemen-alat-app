<?php

namespace App\Services\Dashboard\Concerns;

use App\Models\Loan;

trait FormatsDashboardLoan
{
    protected function formatDashboardLoan(Loan $loan): array
    {
        $items = $loan->relationLoaded('items') ? $loan->items : collect();
        $firstItem = $items->first();
        $totalQty = (int) $items->sum('quantity');
        $itemsSummary = $items
            ->map(fn ($item) => ($item->equipment?->name ?? 'Item').' ×'.$item->quantity)
            ->join(', ') ?: '—';

        $data = [
            'id' => $loan->id,
            'code' => $loan->code,
            'borrowerId' => $loan->borrower_id,
            'borrower_id' => $loan->borrower_id,
            'borrowerName' => $loan->borrower?->name,
            'borrower_name' => $loan->borrower?->name,
            'borrowerClass' => $loan->borrower?->class,
            'borrower_class' => $loan->borrower?->class,
            'equipmentId' => $firstItem?->equipment_id,
            'equipmentName' => $firstItem?->equipment?->name ?? $itemsSummary,
            'itemType' => $loan->item_type,
            'item_type' => $loan->item_type,
            'quantity' => $totalQty,
            'items_summary' => $itemsSummary,
            'status' => $loan->status,
            'requestDate' => $loan->request_date?->format('Y-m-d'),
            'request_date' => $loan->request_date?->format('Y-m-d'),
            'borrowDate' => $loan->borrowed_at?->format('Y-m-d') ?? $loan->request_date?->format('Y-m-d'),
            'borrowed_at' => $loan->borrowed_at?->format('Y-m-d'),
            'dueDate' => $loan->due_at?->format('Y-m-d'),
            'due_at' => $loan->due_at?->format('Y-m-d'),
            'returnDate' => $loan->returned_at?->format('Y-m-d'),
            'returned_at' => $loan->returned_at?->format('Y-m-d'),
            'notes' => $loan->notes,
            'purpose' => $loan->purpose,
        ];

        if ($loan->relationLoaded('collateral') && $loan->collateral) {
            $data['collateral'] = [
                'status' => $loan->collateral->status,
                'type' => 'kartu_pelajar',
            ];
        }

        if ($loan->relationLoaded('compensation') && $loan->compensation) {
            $data['compensation'] = [
                'required' => $loan->compensation->required,
                'status' => $loan->compensation->status,
                'amount' => $loan->compensation->amount,
                'description' => $loan->compensation->description,
            ];
        }

        return $data;
    }
}
