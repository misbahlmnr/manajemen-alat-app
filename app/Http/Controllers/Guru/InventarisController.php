<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use App\Models\Supply;
use App\Support\EquipmentFormatter;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventarisController extends Controller
{
    public function index(Request $request): Response
    {
        $type = $request->string('type')->toString() === 'bahan' ? 'bahan' : 'alat';

        if ($type === 'bahan') {
            $this->authorize('viewAny', Supply::class);

            return $this->renderBahan($request);
        }

        $this->authorize('viewAny', Equipment::class);

        return $this->renderAlat($request);
    }

    private function renderAlat(Request $request): Response
    {
        $search = $request->string('search')->trim();
        $category = $request->string('category')->toString() ?: 'all';
        $status = $request->string('status')->toString() ?: 'all';
        $condition = $request->string('condition')->toString() ?: 'all';
        $availability = $request->string('availability')->toString() ?: 'all';

        $equipment = Equipment::query()
            ->alat()
            ->when($search->isNotEmpty(), function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                        ->orWhere('category', 'like', "%{$search}%")
                        ->orWhere('location', 'like', "%{$search}%");
                });
            })
            ->when($category !== 'all', fn ($q) => $q->where('category', $category))
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->when($condition !== 'all', fn ($q) => $q->conditionFilter($condition))
            ->availability($availability)
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Equipment $item) => $this->formatAlat($item));

        $categories = Equipment::alat()
            ->select('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category');

        return Inertia::render('Guru/Inventaris/Index', [
            'inventarisType' => 'alat',
            'equipment' => $equipment,
            'supplies' => null,
            'filters' => [
                'search' => $search->toString(),
                'category' => $category,
                'status' => $status,
                'condition' => $condition,
                'availability' => $availability,
                'stock_status' => 'all',
            ],
            'categories' => $categories,
        ]);
    }

    private function renderBahan(Request $request): Response
    {
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
                        ->orWhere('location', 'like', "%{$search}%");
                });
            })
            ->when($category !== 'all', fn ($q) => $q->where('category', $category))
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->stockStatus($stockStatus)
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Supply $item) => $this->formatBahan($item));

        $categories = Supply::query()
            ->select('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category');

        return Inertia::render('Guru/Inventaris/Index', [
            'inventarisType' => 'bahan',
            'equipment' => null,
            'supplies' => $supplies,
            'filters' => [
                'search' => $search->toString(),
                'category' => $category,
                'status' => $status,
                'condition' => 'all',
                'availability' => 'all',
                'stock_status' => $stockStatus,
            ],
            'categories' => $categories,
        ]);
    }

    public function showAlat(Equipment $equipment): Response
    {
        $this->authorize('view', $equipment);
        $this->ensureAlat($equipment);

        return Inertia::render('Guru/Inventaris/ShowAlat', [
            'equipment' => $this->formatAlat($equipment, true),
        ]);
    }

    public function showBahan(Supply $supply): Response
    {
        $this->authorize('view', $supply);

        return Inertia::render('Guru/Inventaris/ShowBahan', [
            'supply' => $this->formatBahan($supply, true),
        ]);
    }

    private function ensureAlat(Equipment $equipment): void
    {
        if ($equipment->item_type !== 'alat') {
            abort(404);
        }
    }

    private function formatAlat(Equipment $equipment, bool $detailed = false): array
    {
        return [
            ...EquipmentFormatter::format($equipment, $detailed),
            'borrowed' => max(0, $equipment->qty_baik - $equipment->available),
            'show_url' => route('guru.inventaris.alat.show', $equipment),
            'location' => $equipment->location ?? '—',
        ];
    }

    private function formatBahan(Supply $supply, bool $detailed = false): array
    {
        return [
            ...EquipmentFormatter::format($supply, $detailed),
            'show_url' => route('guru.inventaris.bahan.show', $supply),
            'location' => $supply->location ?? '—',
        ];
    }
}
