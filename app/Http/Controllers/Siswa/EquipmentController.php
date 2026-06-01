<?php

namespace App\Http\Controllers\Siswa;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
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
        $availability = $request->string('availability')->toString() ?: 'all';

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
            ->when($condition !== 'all', fn ($q) => $q->where('condition', $condition))
            ->availability($availability)
            ->orderBy('name')
            ->paginate(12)
            ->withQueryString()
            ->through(fn (Equipment $item) => $this->formatEquipment($item));

        $categories = Equipment::alat()
            ->select('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category');

        return Inertia::render('Siswa/Equipment/Index', [
            'equipment' => $equipment,
            'filters' => [
                'search' => $search->toString(),
                'category' => $category,
                'status' => $status,
                'condition' => $condition,
                'availability' => $availability,
            ],
            'categories' => $categories,
        ]);
    }

    public function show(Equipment $equipment): Response
    {
        $this->authorize('view', $equipment);
        $this->ensureAlat($equipment);

        return Inertia::render('Siswa/Equipment/Show', [
            'equipment' => $this->formatEquipment($equipment, true),
        ]);
    }

    private function ensureAlat(Equipment $equipment): void
    {
        if ($equipment->item_type !== 'alat') {
            abort(404);
        }
    }

    private function formatEquipment(Equipment $equipment, bool $detailed = false): array
    {
        $borrowed = max(0, $equipment->stock - $equipment->available);

        $data = [
            'id' => $equipment->id,
            'code' => $equipment->code,
            'name' => $equipment->name,
            'category' => $equipment->category,
            'stock' => $equipment->stock,
            'available' => $equipment->available,
            'borrowed' => $borrowed,
            'condition' => $equipment->condition,
            'location' => $equipment->location ?? '—',
            'description' => $equipment->description,
            'status' => $equipment->status,
            'availability_label' => $equipment->availability_label,
            'can_borrow' => $equipment->status === 'active'
                && $equipment->available > 0
                && $equipment->condition !== 'rusak_berat',
            'show_url' => route('siswa.equipment.show', $equipment),
            'borrow_url' => $this->borrowUrl($equipment),
        ];

        if ($detailed) {
            $data['created_at_formatted'] = $equipment->created_at?->translatedFormat('d M Y');
            $data['updated_at_formatted'] = $equipment->updated_at?->translatedFormat('d M Y H:i');
        }

        return $data;
    }

    private function borrowUrl(Equipment $equipment): ?string
    {
        if ($equipment->status !== 'active' || $equipment->available <= 0 || $equipment->condition === 'rusak_berat') {
            return null;
        }

        return route('siswa.loans.create', ['type' => 'alat', 'equipment_id' => $equipment->id]);
    }
}
