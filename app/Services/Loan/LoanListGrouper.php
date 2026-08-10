<?php

namespace App\Services\Loan;

use App\Models\Loan;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator as Paginator;

class LoanListGrouper
{
    /**
     * Paginate loans as visual units: one package (shared loan_group_id) = one page unit.
     *
     * @param  callable(Loan): array  $formatter
     */
    public function paginate(Builder $query, int $perPage, callable $formatter): LengthAwarePaginator
    {
        $page = Paginator::resolveCurrentPage();

        $rows = (clone $query)
            ->reorder()
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get(['id', 'loan_group_id', 'created_at']);

        $orderedKeys = [];
        $seen = [];

        foreach ($rows as $row) {
            $key = $row->loan_group_id ?: 'solo-'.$row->id;

            if (isset($seen[$key])) {
                continue;
            }

            $seen[$key] = true;
            $orderedKeys[] = $key;
        }

        $total = count($orderedKeys);
        $pageKeys = array_values(array_slice($orderedKeys, ($page - 1) * $perPage, $perPage));

        if ($pageKeys === []) {
            return new Paginator([], $total, $perPage, $page, [
                'path' => Paginator::resolveCurrentPath(),
                'query' => request()->query(),
            ]);
        }

        $soloIds = [];
        $groupIds = [];

        foreach ($pageKeys as $key) {
            if (str_starts_with($key, 'solo-')) {
                $soloIds[] = (int) substr($key, 5);
            } else {
                $groupIds[] = $key;
            }
        }

        $loans = (clone $query)
            ->reorder()
            ->where(function (Builder $q) use ($soloIds, $groupIds) {
                if ($soloIds !== []) {
                    $q->orWhereIn('id', $soloIds);
                }
                if ($groupIds !== []) {
                    $q->orWhereIn('loan_group_id', $groupIds);
                }
            })
            ->orderByDesc('created_at')
            ->orderBy('item_type')
            ->get()
            ->groupBy(fn (Loan $loan) => $loan->loan_group_id ?: 'solo-'.$loan->id);

        $items = collect($pageKeys)->map(function (string $key) use ($loans, $formatter) {
            $members = $loans->get($key, collect());

            if ($members->isEmpty()) {
                return null;
            }

            $formatted = $members->map(fn (Loan $loan) => $formatter($loan))->values();

            if ($members->count() === 1 && ! $members->first()->loan_group_id) {
                return $formatted->first();
            }

            $primary = $formatted->firstWhere('item_type', 'alat') ?? $formatted->first();

            return [
                ...$primary,
                'is_package' => true,
                'loan_group_id' => $members->first()->loan_group_id,
                'package_members' => $formatted->all(),
                'package_codes' => $formatted->pluck('code')->all(),
                'items_summary' => $formatted
                    ->map(fn ($row) => ($row['item_type_label'] ?? '').': '.($row['items_summary'] ?? '—'))
                    ->join(' · '),
                'status' => $formatted->pluck('status')->unique()->count() === 1
                    ? $formatted->first()['status']
                    : 'paket',
                'item_type' => 'paket',
                'item_type_label' => 'Paket',
            ];
        })->filter()->values();

        return new Paginator($items->all(), $total, $perPage, $page, [
            'path' => Paginator::resolveCurrentPath(),
            'query' => request()->query(),
        ]);
    }
}
