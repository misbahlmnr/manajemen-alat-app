<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSupplyRequest;
use App\Http\Requests\Admin\UpdateSupplyRequest;
use App\Models\Equipment;
use App\Models\Supply;
use App\Services\Equipment\EquipmentImageService;
use App\Support\EquipmentFormatter;
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
            ->through(fn (Supply $item) => EquipmentFormatter::format($item));

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

    public function store(StoreSupplyRequest $request, EquipmentImageService $images): RedirectResponse
    {
        $data = collect($request->validated())->except(['image'])->all();

        $supply = Supply::create([
            ...$data,
            'code' => Equipment::generateCode('bahan'),
        ]);

        if ($request->hasFile('image')) {
            $supply->update([
                'image_path' => $images->store($supply, $request->file('image')),
            ]);
        }

        return redirect()
            ->route('admin.supplies.index')
            ->with('success', 'Bahan berhasil ditambahkan.');
    }

    public function show(Supply $supply): Response
    {
        $this->authorize('view', $supply);

        return Inertia::render('Admin/Supply/Show', [
            'supply' => EquipmentFormatter::format($supply),
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
            'supply' => EquipmentFormatter::format($supply),
            'categoryOptions' => $categories,
            'unitOptions' => config('lab.supply_units'),
        ]);
    }

    public function update(UpdateSupplyRequest $request, Supply $supply, EquipmentImageService $images): RedirectResponse
    {
        $data = collect($request->validated())->except(['image'])->all();
        $supply->update($data);

        if ($request->hasFile('image')) {
            $supply->update([
                'image_path' => $images->store($supply, $request->file('image')),
            ]);
        }

        return redirect()
            ->route('admin.supplies.show', $supply)
            ->with('success', 'Bahan berhasil diperbarui.');
    }

    public function destroy(Supply $supply, EquipmentImageService $images): RedirectResponse
    {
        $this->authorize('delete', $supply);

        $images->delete($supply);
        $supply->delete();

        return redirect()
            ->route('admin.supplies.index')
            ->with('success', 'Bahan berhasil dihapus.');
    }
}
