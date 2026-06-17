<?php

namespace App\Http\Controllers\Siswa;

use App\Http\Controllers\Controller;
use App\Models\Supply;
use App\Support\EquipmentFormatter;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SupplyController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Supply::class);

        $search = $request->string('search')->trim();
        $category = $request->string('category')->toString() ?: 'all';
        $status = $request->string('status')->toString() ?: 'all';
        $stockStatus = $request->string('stock_status')->toString() ?: 'all';

        $supplies = Supply::query()
            ->when($search->isNotEmpty(), function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                        ->orWhere('category', 'like', "%{$search}%")
                        ->orWhere('location', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($category !== 'all', fn ($q) => $q->where('category', $category))
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->stockStatus($stockStatus)
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Supply $item) => $this->formatSupply($item));

        $categories = Supply::query()
            ->select('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category');

        return Inertia::render('Siswa/Supply/Index', [
            'supplies' => $supplies,
            'filters' => [
                'search' => $search->toString(),
                'category' => $category,
                'status' => $status,
                'stock_status' => $stockStatus,
            ],
            'categories' => $categories,
        ]);
    }

    public function show(Supply $supply): Response
    {
        $this->authorize('view', $supply);

        return Inertia::render('Siswa/Supply/Show', [
            'supply' => $this->formatSupply($supply, true),
        ]);
    }

    private function formatSupply(Supply $supply, bool $detailed = false): array
    {
        return [
            ...EquipmentFormatter::format($supply, $detailed),
            'can_request' => $supply->status === 'tersedia' && $supply->available > 0,
            'show_url' => route('siswa.supplies.show', $supply),
            'request_url' => $this->requestUrl($supply),
            'location' => $supply->location ?? '—',
        ];
    }

    private function requestUrl(Supply $supply): ?string
    {
        if ($supply->status !== 'tersedia' || $supply->available <= 0) {
            return null;
        }

        return route('siswa.loans.create', ['type' => 'bahan', 'supply_id' => $supply->id]);
    }
}
