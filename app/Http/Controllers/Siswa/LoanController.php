<?php

namespace App\Http\Controllers\Siswa;

use App\Http\Controllers\Controller;
use App\Http\Requests\Siswa\StoreStudentLoanRequest;
use App\Models\Equipment;
use App\Models\Loan;
use App\Models\PracticumSchedule;
use App\Models\User;
use App\Services\Loan\LoanWorkflowService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LoanController extends Controller
{
    public function __construct(
        private LoanWorkflowService $workflow,
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Loan::class);
        $this->workflow->syncOverdue();

        $user = $request->user();
        $search = $request->string('search')->trim();
        $status = $request->string('status')->toString() ?: 'all';
        $itemType = $request->string('item_type')->toString() ?: 'all';
        $scope = $request->string('scope')->toString() ?: 'active';
        $dateFrom = $request->string('date_from')->toString();
        $dateTo = $request->string('date_to')->toString();

        $baseQuery = Loan::query()->where('borrower_id', $user->id);

        $loans = (clone $baseQuery)
            ->with([
                'supervisor:id,name',
                'schedule:id,code,title,mata_kuliah,kelas,tanggal,jam_mulai,jam_selesai,priority',
                'items.equipment:id,code,name,item_type,unit',
                'collateral:id,loan_id,status,held_at,returned_at',
            ])
            ->when($scope === 'history', function ($query) {
                $query->whereIn('status', ['dikembalikan', 'ditolak', 'dibatalkan']);
            }, function ($query) {
                $query->whereNotIn('status', ['dikembalikan', 'ditolak', 'dibatalkan']);
            })
            ->when($search->isNotEmpty(), function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('code', 'like', "%{$search}%")
                        ->orWhere('purpose', 'like', "%{$search}%")
                        ->orWhereHas('items.equipment', fn ($e) => $e->where('name', 'like', "%{$search}%"));
                });
            })
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->when($itemType !== 'all', fn ($q) => $q->where('item_type', $itemType))
            ->when($dateFrom !== '', fn ($q) => $q->whereDate('request_date', '>=', $dateFrom))
            ->when($dateTo !== '', fn ($q) => $q->whereDate('request_date', '<=', $dateTo))
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Loan $loan) => $this->formatLoan($loan, true));

        return Inertia::render('Siswa/Loan/Index', [
            'loans' => $loans,
            'tabCounts' => [
                'all' => (clone $baseQuery)->count(),
                'alat' => (clone $baseQuery)->where('item_type', 'alat')->count(),
                'bahan' => (clone $baseQuery)->where('item_type', 'bahan')->count(),
            ],
            'filters' => [
                'search' => $search->toString(),
                'status' => $status,
                'item_type' => $itemType,
                'scope' => $scope,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'statusOptions' => config('lab.loan_statuses'),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->authorize('create', Loan::class);

        $type = $request->string('type')->toString() === 'bahan' ? 'bahan' : 'alat';
        $prefillEquipmentId = $request->integer('equipment_id') ?: null;
        $prefillSupplyId = $request->integer('supply_id') ?: null;

        $prefillId = $type === 'bahan' ? $prefillSupplyId : $prefillEquipmentId;

        $options = $this->formOptions($request->user());
        $prefillItem = $this->resolvePrefillCatalogItem($prefillId, $type);

        return Inertia::render('Siswa/Loan/Create', [
            'loanType' => $type,
            'prefillItem' => $prefillItem,
            'catalog' => $this->paginatedCatalog($request, $type),
            'catalogFilters' => [
                'search' => $request->string('catalog_search')->trim()->toString(),
            ],
            ...$options,
            'defaults' => [
                'item_type' => $type,
                'request_date' => now()->toDateString(),
                'borrow_scope' => 'lab',
                'supervisor_id' => '',
                'practicum_schedule_id' => '',
                'due_at' => '',
                'purpose' => '',
                'notes' => '',
                'collateral_agreed' => false,
                'items' => $prefillId
                    ? [['equipment_id' => (string) $prefillId, 'quantity' => 1]]
                    : [['equipment_id' => '', 'quantity' => 1]],
            ],
        ]);
    }

    public function store(StoreStudentLoanRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $items = $validated['items'];
        unset($validated['items'], $validated['collateral_agreed']);

        $this->workflow->validateStockForItems($items, $validated['item_type']);

        $loan = Loan::create([
            ...$validated,
            'borrower_id' => $request->user()->id,
            'code' => Loan::generateCode(),
            'status' => 'diminta',
            'borrow_scope' => $validated['borrow_scope'] ?? 'lab',
            'due_at' => $validated['item_type'] === 'alat' ? ($validated['due_at'] ?? null) : null,
        ]);

        $this->syncItems($loan, $items);
        $this->workflow->logStatus($loan, 'diminta', 'Pengajuan peminjaman dibuat oleh siswa.', $request->user());

        if ($validated['item_type'] === 'bahan') {
            $message = 'Pengambilan bahan berhasil dicatat! Menunggu verifikasi admin.';
        } elseif (($validated['borrow_scope'] ?? 'lab') === 'bawa_pulang') {
            $message = 'Permintaan terkirim! Siapkan kartu pelajar untuk diserahkan saat pengambilan alat.';
        } else {
            $message = 'Permintaan peminjaman terkirim! Menunggu verifikasi admin.';
        }

        return redirect()
            ->route('siswa.loans.index')
            ->with('success', $message);
    }

    public function show(Loan $loan): Response
    {
        $this->authorize('view', $loan);

        $loan->load([
            'supervisor:id,name,nip',
            'schedule:id,code,title,mata_kuliah,tanggal,kelas',
            'items.equipment:id,code,name,item_type,category,unit',
            'statusLogs.user:id,name',
            'collateral',
            'compensation',
        ]);

        return Inertia::render('Siswa/Loan/Show', [
            'loan' => $this->formatLoan($loan, true),
        ]);
    }

    public function cancel(Loan $loan): RedirectResponse
    {
        $this->authorize('cancel', $loan);
        $this->workflow->cancel($loan, request()->user());

        return redirect()
            ->route('siswa.loans.index')
            ->with('success', 'Pengajuan peminjaman dibatalkan.');
    }

    public function requestReturn(Request $request, Loan $loan): RedirectResponse
    {
        $this->authorize('requestReturn', $loan);

        $request->validate([
            'note' => ['nullable', 'string', 'max:2000'],
        ]);

        $this->workflow->processReturn($loan, $request->input('note'), $request->user());

        $fresh = $loan->fresh();

        $message = $fresh && $fresh->requiresCollateral()
            ? 'Pengembalian diajukan. Menunggu inspeksi admin.'
            : 'Pengembalian berhasil diajukan.';

        return back()->with('success', $message);
    }

    private function syncItems(Loan $loan, array $rows): void
    {
        $loan->items()->delete();
        foreach ($rows as $row) {
            $loan->items()->create([
                'equipment_id' => $row['equipment_id'],
                'quantity' => (int) $row['quantity'],
            ]);
        }
    }

    private function formOptions(User $user): array
    {
        return [
            'supervisorOptions' => User::query()
                ->where('role', 'guru')
                ->where('status', 'active')
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (User $u) => ['id' => $u->id, 'name' => $u->name])
                ->values()
                ->all(),
            'schedules' => PracticumSchedule::query()
                ->where('status', 'aktif')
                ->when($user->class, fn ($q) => $q->where('kelas', $user->class))
                ->whereDate('tanggal', '>=', now()->toDateString())
                ->orderBy('tanggal')
                ->get(['id', 'code', 'title', 'mata_kuliah', 'kelas', 'tanggal', 'jam_mulai', 'jam_selesai', 'priority'])
                ->map(fn ($s) => [
                    'id' => $s->id,
                    'code' => $s->code,
                    'title' => $s->title,
                    'mata_kuliah' => $s->mata_kuliah,
                    'kelas' => $s->kelas,
                    'tanggal' => $s->tanggal?->format('Y-m-d'),
                    'jam_mulai' => $s->jam_mulai,
                    'jam_selesai' => $s->jam_selesai,
                    'priority' => $s->priority,
                ])
                ->values()
                ->all(),
        ];
    }

    private function paginatedCatalog(Request $request, string $itemType)
    {
        $search = $request->string('catalog_search')->trim();

        $query = Equipment::query()
            ->where('status', 'active')
            ->where('available', '>', 0)
            ->when($search->isNotEmpty(), function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                        ->orWhere('category', 'like', "%{$search}%");
                });
            })
            ->orderBy('name');

        if ($itemType === 'alat') {
            $query->alat();
        } else {
            $query->bahan();
        }

        return $query
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Equipment $item) => $this->formatCatalogItem($item));
    }

    private function resolvePrefillCatalogItem(?int $id, string $itemType): ?array
    {
        if (! $id) {
            return null;
        }

        $query = Equipment::query()
            ->where('id', $id)
            ->where('status', 'active')
            ->where('available', '>', 0);

        if ($itemType === 'alat') {
            $query->alat();
        } else {
            $query->bahan();
        }

        $item = $query->first();

        return $item ? $this->formatCatalogItem($item) : null;
    }

    private function formatCatalogItem(Equipment $equipment): array
    {
        $isBahan = $equipment->item_type === 'bahan';

        return [
            'id' => $equipment->id,
            'code' => $equipment->code,
            'name' => $equipment->name,
            'category' => $equipment->category,
            'available' => $equipment->available,
            'stock' => $equipment->stock,
            'unit' => $equipment->unit ?? ($isBahan ? 'pcs' : 'unit'),
            'min_stock' => $equipment->min_stock,
            'is_low_stock' => $isBahan
                && $equipment->min_stock !== null
                && $equipment->available <= $equipment->min_stock,
        ];
    }

    private function formatLoan(Loan $loan, bool $detailed = false): array
    {
        $items = $loan->relationLoaded('items')
            ? $loan->items->map(fn ($item) => [
                'id' => $item->id,
                'equipment_id' => $item->equipment_id,
                'equipment_name' => $item->equipment?->name,
                'equipment_code' => $item->equipment?->code,
                'quantity' => $item->quantity,
                'unit' => $item->equipment?->unit,
            ])->values()->all()
            : [];

        $itemsSummary = collect($items)
            ->map(fn ($i) => ($i['equipment_name'] ?? 'Item').' ×'.$i['quantity'])
            ->join(', ');

        $itemsCount = count($items);

        $data = [
            'id' => $loan->id,
            'code' => $loan->code,
            'supervisor_id' => $loan->supervisor_id,
            'supervisor_name' => $loan->supervisor?->name,
            'practicum_schedule_id' => $loan->practicum_schedule_id,
            'schedule_title' => $loan->schedule?->title,
            'schedule_code' => $loan->schedule?->code,
            'schedule_mata_kuliah' => $loan->schedule?->mata_kuliah,
            'schedule_kelas' => $loan->schedule?->kelas,
            'schedule_tanggal' => $loan->schedule?->tanggal?->format('Y-m-d'),
            'schedule_jam_mulai' => $loan->schedule?->jam_mulai,
            'schedule_jam_selesai' => $loan->schedule?->jam_selesai,
            'schedule_priority' => $loan->schedule?->priority,
            'item_type' => $loan->item_type,
            'item_type_label' => $loan->item_type === 'alat' ? 'Alat' : 'Bahan',
            'status' => $loan->status,
            'request_date' => $loan->request_date?->format('Y-m-d'),
            'request_date_formatted' => $loan->request_date?->translatedFormat('d M Y'),
            'borrowed_at_formatted' => $loan->borrowed_at?->translatedFormat('d M Y H:i') ?: '—',
            'due_at_formatted' => $loan->due_at?->translatedFormat('d M Y H:i') ?: '—',
            'returned_at_formatted' => $loan->returned_at?->translatedFormat('d M Y H:i') ?: '—',
            'purpose' => $loan->purpose,
            'notes' => $loan->notes,
            'rejection_reason' => $loan->rejection_reason,
            'borrow_scope' => $loan->borrow_scope,
            'borrow_scope_label' => $loan->borrow_scope === 'bawa_pulang' ? 'Bawa Pulang' : 'Pakai di Lab',
            'items_summary' => $itemsSummary ?: '—',
            'items_count' => $itemsCount,
            'total_quantity' => collect($items)->sum('quantity'),
            'display_title' => collect($items)->first()['equipment_name'] ?? $itemsSummary,
            'created_at_formatted' => $loan->created_at?->translatedFormat('d M Y'),
            'due_at_iso' => $loan->due_at?->toIso8601String(),
            'requires_collateral' => $loan->requiresCollateral(),
            'collateral_id' => $loan->collateral?->id,
            'collateral_code' => $loan->collateral?->code,
            'collateral_status' => $loan->collateral?->status,
            'can_cancel' => auth()->user()?->can('cancel', $loan) ?? false,
            'can_request_return' => auth()->user()?->can('requestReturn', $loan) ?? false,
            'is_overdue' => $loan->status === 'terlambat',
        ];

        if ($detailed || $loan->relationLoaded('items')) {
            $data['items'] = $items;
            $data['timeline'] = $loan->relationLoaded('statusLogs')
                ? $loan->statusLogs->map(fn ($log) => [
                    'status' => $log->status,
                    'note' => $log->note,
                    'user_name' => $log->user?->name,
                    'created_at_formatted' => $log->created_at?->translatedFormat('d M Y H:i'),
                ])->values()->all()
                : [];
            $data['compensation'] = $loan->relationLoaded('compensation') && $loan->compensation
                ? [
                    'required' => $loan->compensation->required,
                    'status' => $loan->compensation->status,
                    'description' => $loan->compensation->description,
                ]
                : null;
        }

        return $data;
    }
}
