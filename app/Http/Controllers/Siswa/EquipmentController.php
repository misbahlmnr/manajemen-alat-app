<?php

namespace App\Http\Controllers\Siswa;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use App\Services\Loan\LoanRequestAvailabilityService;
use App\Support\EquipmentFormatter;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EquipmentController extends Controller
{
    public function __construct(
        private LoanRequestAvailabilityService $requestAvailability,
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Equipment::class);

        $search = $request->string('search')->trim();
        $category = $request->string('category')->toString() ?: 'all';
        $status = $request->string('status')->toString() ?: 'all';
        $condition = $request->string('condition')->toString() ?: 'all';
        $availability = $request->string('availability')->toString() ?: 'all';
        $requestDate = $request->date('request_date')?->toDateString()
            ?? now()->toDateString();

        $slotContext = $this->slotContextFromRequest($request, $requestDate);

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
            ->availability($availability)
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Equipment $item) => $this->formatEquipment($item, false, $slotContext));

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
                'request_date' => $requestDate,
            ],
            'categories' => $categories,
        ]);
    }

    public function show(Request $request, Equipment $equipment): Response
    {
        $this->authorize('view', $equipment);
        $this->ensureAlat($equipment);

        $requestDate = $request->date('request_date')?->toDateString()
            ?? now()->toDateString();
        $slotContext = $this->slotContextFromRequest($request, $requestDate);

        return Inertia::render('Siswa/Equipment/Show', [
            'equipment' => $this->formatEquipment($equipment, true, $slotContext),
            'availabilityContext' => [
                'request_date' => $requestDate,
            ],
        ]);
    }

    private function ensureAlat(Equipment $equipment): void
    {
        if ($equipment->item_type !== 'alat') {
            abort(404);
        }
    }

    /**
     * @param  array<string, mixed>  $slotContext
     * @return array<string, mixed>
     */
    private function formatEquipment(Equipment $equipment, bool $detailed = false, array $slotContext = []): array
    {
        $context = $slotContext !== []
            ? $slotContext
            : $this->slotContextFromRequest(request(), now()->toDateString());

        $requestable = $this->requestAvailability->remainingForSubmit($equipment, $context);
        $capacity = max(0, (int) $equipment->qty_baik);
        $queueOpen = $equipment->status === 'tersedia' && $requestable <= 0;

        return [
            ...EquipmentFormatter::format($equipment, $detailed),
            'slot_remaining' => $requestable,
            'available' => $requestable,
            'borrowed' => max(0, $capacity - $requestable),
            'availability_label' => $this->requestAvailabilityLabel($equipment, $requestable),
            'can_borrow' => $equipment->status === 'tersedia',
            'queue_open' => $queueOpen,
            'cta_label' => $queueOpen ? 'Ajukan' : 'Tambah',
            'show_url' => route('siswa.equipment.show', [
                'equipment' => $equipment,
                'request_date' => $context['request_date'] ?? null,
            ]),
            'borrow_url' => $this->borrowUrl($equipment, $context),
            'location' => $equipment->location ?? '—',
            'availability_date' => $context['request_date'] ?? null,
        ];
    }

    /**
     * @param  array<string, mixed>  $context
     */
    private function borrowUrl(Equipment $equipment, array $context): ?string
    {
        if ($equipment->status !== 'tersedia') {
            return null;
        }

        return route('siswa.loans.create', array_filter([
            'type' => 'alat',
            'equipment_id' => $equipment->id,
            'request_date' => $context['request_date'] ?? null,
            'practicum_schedule_id' => $context['practicum_schedule_id'] ?? null,
        ], fn ($value) => $value !== null && $value !== ''));
    }

    /**
     * Konteks slot sama dengan default halaman Ajukan (praktikum / lab).
     *
     * @return array<string, mixed>
     */
    private function slotContextFromRequest(Request $request, string $requestDate): array
    {
        $loanType = $request->string('loan_type')->toString() ?: 'praktikum';
        if (! in_array($loanType, ['praktikum', 'pribadi', 'bawa_pulang'], true)) {
            $loanType = 'praktikum';
        }

        $legacy = \App\Models\Loan::legacyFieldsForType($loanType);

        return [
            'item_type' => 'alat',
            'loan_type' => $loanType,
            'borrow_scope' => $legacy['borrow_scope'],
            'borrow_reason' => $legacy['borrow_reason'],
            'request_date' => $requestDate,
            'practicum_schedule_id' => $request->integer('practicum_schedule_id') ?: null,
            'due_at' => $request->input('due_at'),
        ];
    }

    private function requestAvailabilityLabel(Equipment $equipment, int $requestable): string
    {
        if ($equipment->status === 'tidak_tersedia') {
            return 'tidak_tersedia';
        }

        if ($equipment->qty_baik <= 0 && $equipment->qty_rusak_berat > 0) {
            return 'rusak';
        }

        if ($requestable <= 0) {
            return 'habis';
        }

        if ($requestable < (int) $equipment->qty_baik) {
            return 'dipinjam';
        }

        return 'tersedia';
    }
}
