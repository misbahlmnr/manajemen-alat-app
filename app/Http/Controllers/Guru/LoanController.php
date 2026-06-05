<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use App\Services\Loan\LoanWorkflowService;
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
        $kelas = $request->string('kelas')->toString() ?: 'all';
        $dateFrom = $request->string('date_from')->toString();
        $dateTo = $request->string('date_to')->toString();

        $baseQuery = Loan::query()->where('supervisor_id', $user->id);

        $scopedCountQuery = (clone $baseQuery);
        $this->applyLoanScope($scopedCountQuery, $scope);

        $loans = (clone $baseQuery)
            ->with([
                'borrower:id,name,class',
                'schedule:id,code,title,mata_kuliah,kelas,tanggal,jam_mulai,jam_selesai,priority',
                'items.equipment:id,code,name,item_type,unit',
                'collateral:id,loan_id,status',
            ])
            ->tap(fn ($query) => $this->applyLoanScope($query, $scope))
            ->when($search->isNotEmpty(), function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('code', 'like', "%{$search}%")
                        ->orWhere('purpose', 'like', "%{$search}%")
                        ->orWhereHas('borrower', fn ($b) => $b->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('items.equipment', fn ($e) => $e->where('name', 'like', "%{$search}%"));
                });
            })
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->when($itemType !== 'all', fn ($q) => $q->where('item_type', $itemType))
            ->when($kelas !== 'all', fn ($q) => $q->whereHas('borrower', fn ($b) => $b->where('class', $kelas)))
            ->when($dateFrom !== '', fn ($q) => $q->whereDate('request_date', '>=', $dateFrom))
            ->when($dateTo !== '', fn ($q) => $q->whereDate('request_date', '<=', $dateTo))
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Loan $loan) => $this->formatLoan($loan, true));

        return Inertia::render('Guru/Loan/Index', [
            'loans' => $loans,
            'tabCounts' => [
                'all' => (clone $scopedCountQuery)->count(),
                'alat' => (clone $scopedCountQuery)->where('item_type', 'alat')->count(),
                'bahan' => (clone $scopedCountQuery)->where('item_type', 'bahan')->count(),
            ],
            'filters' => [
                'search' => $search->toString(),
                'status' => $status,
                'item_type' => $itemType,
                'scope' => $scope,
                'kelas' => $kelas,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'kelasOptions' => config('lab.class_options'),
            'statusOptions' => config('lab.loan_statuses'),
        ]);
    }

    public function show(Loan $loan): Response
    {
        $this->authorize('view', $loan);

        $loan->load([
            'borrower:id,name,class,nisn',
            'schedule:id,code,title,mata_kuliah,tanggal,kelas',
            'items.equipment:id,code,name,item_type,category,unit',
            'statusLogs.user:id,name',
            'collateral',
            'compensation',
        ]);

        return Inertia::render('Guru/Loan/Show', [
            'loan' => $this->formatLoan($loan, true),
        ]);
    }

    private function applyLoanScope($query, string $scope): void
    {
        if ($scope === 'history') {
            $query->where(function ($q) {
                $q->whereIn('status', ['dikembalikan', 'ditolak', 'dibatalkan'])
                    ->orWhere(function ($inner) {
                        $inner->where('item_type', 'bahan')->where('status', 'dipinjam');
                    });
            });

            return;
        }

        $query->where(function ($q) {
            $q->whereNotIn('status', ['dikembalikan', 'ditolak', 'dibatalkan'])
                ->where(function ($inner) {
                    $inner->where('item_type', 'alat')
                        ->orWhere('status', '!=', 'dipinjam');
                });
        });
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

        $data = [
            'id' => $loan->id,
            'code' => $loan->code,
            'borrower_id' => $loan->borrower_id,
            'borrower_name' => $loan->borrower?->name,
            'borrower_class' => $loan->borrower?->class,
            'supervisor_id' => $loan->supervisor_id,
            'supervisor_name' => $loan->supervisor?->name,
            'practicum_schedule_id' => $loan->practicum_schedule_id,
            'schedule_title' => $loan->schedule?->title,
            'schedule_code' => $loan->schedule?->code,
            'schedule_mata_kuliah' => $loan->schedule?->mata_kuliah,
            'schedule_kelas' => $loan->schedule?->kelas,
            'schedule_tanggal' => $loan->schedule?->tanggal?->format('Y-m-d'),
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
            'items_count' => count($items),
            'total_quantity' => collect($items)->sum('quantity'),
            'display_title' => collect($items)->first()['equipment_name'] ?? $itemsSummary,
            'created_at_formatted' => $loan->created_at?->translatedFormat('d M Y'),
            'due_at_iso' => $loan->due_at?->toIso8601String(),
            'requires_collateral' => $loan->requiresCollateral(),
            'collateral_status' => $loan->collateral?->status,
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
