<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSupplyRequest;
use App\Http\Requests\Admin\UpdateSupplyRequest;
use App\Models\Equipment;
use App\Models\Supply;
use Illuminate\Http\RedirectResponse;
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
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Supply $item) => $this->formatSupply($item));

        $categories = Supply::query()
            ->select('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category');

        return Inertia::render('Admin/Supply/Index', [
            'supplies' => $supplies,
            'filters' => [
                'search' => $search->toString(),
                'category' => $category,
                'status' => $status,
            ],
            'categories' => $categories,
            'categoryOptions' => config('lab.supply_categories'),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Supply::class);

        $categories = Supply::query()
            ->select('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category');

        return Inertia::render('Admin/Supply/Create', [
            'categoryOptions' => $categories,
            'unitOptions' => config('lab.supply_units'),
        ]);
    }

    public function store(StoreSupplyRequest $request): RedirectResponse
    {
        Supply::create([
            ...$request->validated(),
            'code' => Equipment::generateCode('bahan'),
            'condition' => 'baik',
        ]);

        return redirect()
            ->route('admin.supplies.index')
            ->with('success', 'Bahan berhasil ditambahkan.');
    }

    public function show(Supply $supply): Response
    {
        $this->authorize('view', $supply);

        return Inertia::render('Admin/Supply/Show', [
            'supply' => $this->formatSupply($supply),
        ]);
    }

    public function edit(Supply $supply): Response
    {
        $this->authorize('update', $supply);
        
        $categories = Supply::query()
            ->select('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category');

        return Inertia::render('Admin/Supply/Edit', [
            'supply' => $this->formatSupply($supply),
            'categoryOptions' => $categories,
            'unitOptions' => config('lab.supply_units'),
        ]);
    }

    public function update(UpdateSupplyRequest $request, Supply $supply): RedirectResponse
    {
        $supply->update($request->validated());

        return redirect()
            ->route('admin.supplies.show', $supply)
            ->with('success', 'Bahan berhasil diperbarui.');
    }

    public function destroy(Supply $supply): RedirectResponse
    {
        $this->authorize('delete', $supply);

        $supply->delete();

        return redirect()
            ->route('admin.supplies.index')
            ->with('success', 'Bahan berhasil dihapus.');
    }

    private function formatSupply(Supply $supply): array
    {
        return [
            'id' => $supply->id,
            'code' => $supply->code,
            'name' => $supply->name,
            'category' => $supply->category,
            'stock' => $supply->stock,
            'available' => $supply->available,
            'unit' => $supply->unit,
            'min_stock' => $supply->min_stock,
            'location' => $supply->location,
            'description' => $supply->description,
            'status' => $supply->status,
            'is_low_stock' => $supply->is_low_stock,
            'created_at_formatted' => $supply->created_at?->translatedFormat('d M Y'),
            'updated_at_formatted' => $supply->updated_at?->translatedFormat('d M Y H:i'),
        ];
    }
}
