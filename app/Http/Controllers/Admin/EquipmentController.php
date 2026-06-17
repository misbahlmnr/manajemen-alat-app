<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreEquipmentRequest;
use App\Http\Requests\Admin\UpdateEquipmentRequest;
use App\Models\Equipment;
use App\Services\Equipment\EquipmentImageService;
use App\Support\EquipmentFormatter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EquipmentController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Equipment::class);

        $search = $request->string('search')->trim();
        $category = $request->string('category')->toString() ?: 'all';
        $status = $request->string('status')->toString() ?: 'all';
        $condition = $request->string('condition')->toString() ?: 'all';

        $equipment = Equipment::query()
            ->alat()
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
            ->when($condition !== 'all', fn ($q) => $q->conditionFilter($condition))
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Equipment $item) => EquipmentFormatter::format($item));

        $categories = Equipment::alat()
            ->select('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category');

        return Inertia::render('Admin/Equipment/Index', [
            'equipment' => $equipment,
            'filters' => [
                'search' => $search->toString(),
                'category' => $category,
                'status' => $status,
                'condition' => $condition,
            ],
            'categories' => $categories,
            'categoryOptions' => config('lab.equipment_categories'),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Equipment::class);

        $categories = Equipment::alat()
            ->select('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category');

        return Inertia::render('Admin/Equipment/Create', [
            'categoryOptions' => $categories,
        ]);
    }

    public function store(StoreEquipmentRequest $request, EquipmentImageService $images): RedirectResponse
    {
        $data = collect($request->validated())->except(['image'])->all();

        $equipment = Equipment::create([
            ...$data,
            'code' => Equipment::generateCode('alat'),
            'item_type' => 'alat',
        ]);

        if ($request->hasFile('image')) {
            $equipment->update([
                'image_path' => $images->store($equipment, $request->file('image')),
            ]);
        }

        return redirect()
            ->route('admin.equipment.index')
            ->with('success', 'Alat berhasil ditambahkan.');
    }

    public function show(Equipment $equipment): Response
    {
        $this->authorize('view', $equipment);
        $this->ensureAlat($equipment);

        return Inertia::render('Admin/Equipment/Show', [
            'equipment' => EquipmentFormatter::format($equipment),
        ]);
    }

    public function edit(Equipment $equipment): Response
    {
        $this->authorize('update', $equipment);
        $this->ensureAlat($equipment);

        $categories = Equipment::alat()
            ->select('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category');

        return Inertia::render('Admin/Equipment/Edit', [
            'equipment' => EquipmentFormatter::format($equipment),
            'categoryOptions' => $categories,
        ]);
    }

    public function update(UpdateEquipmentRequest $request, Equipment $equipment, EquipmentImageService $images): RedirectResponse
    {
        $this->ensureAlat($equipment);

        $data = collect($request->validated())->except(['image'])->all();
        $equipment->update($data);

        if ($request->hasFile('image')) {
            $equipment->update([
                'image_path' => $images->store($equipment, $request->file('image')),
            ]);
        }

        return redirect()
            ->route('admin.equipment.show', $equipment)
            ->with('success', 'Alat berhasil diperbarui.');
    }

    public function destroy(Equipment $equipment, EquipmentImageService $images): RedirectResponse
    {
        $this->authorize('delete', $equipment);
        $this->ensureAlat($equipment);

        $images->delete($equipment);
        $equipment->delete();

        return redirect()
            ->route('admin.equipment.index')
            ->with('success', 'Alat berhasil dihapus.');
    }

    private function ensureAlat(Equipment $equipment): void
    {
        if ($equipment->item_type !== 'alat') {
            abort(404);
        }
    }
}
