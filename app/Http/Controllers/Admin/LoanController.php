<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\RejectLoanRequest;
use App\Http\Requests\Admin\ReturnLoanRequest;
use App\Http\Requests\Admin\StoreLoanRequest;
use App\Http\Requests\Admin\UpdateLoanRequest;
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

        $search = $request->string('search')->trim();
        $status = $request->string('status')->toString() ?: 'all';
        $itemType = $request->string('item_type')->toString() ?: 'all';
        $borrowerId = $request->string('borrower_id')->toString() ?: 'all';
        $supervisorId = $request->string('supervisor_id')->toString() ?: 'all';
        $kelas = $request->string('kelas')->toString() ?: 'all';
        $dateFrom = $request->string('date_from')->toString();
        $dateTo = $request->string('date_to')->toString();

        $loans = Loan::query()
            ->with(['borrower:id,name,role,class', 'supervisor:id,name', 'items.equipment:id,code,name,item_type'])
            ->when($search->isNotEmpty(), function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('code', 'like', "%{$search}%")
                        ->orWhere('purpose', 'like', "%{$search}%")
                        ->orWhere('notes', 'like', "%{$search}%")
                        ->orWhereHas('borrower', fn ($b) => $b->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('items.equipment', fn ($e) => $e->where('name', 'like', "%{$search}%"));
                });
            })
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->when($itemType !== 'all', fn ($q) => $q->where('item_type', $itemType))
            ->when($borrowerId !== 'all', fn ($q) => $q->where('borrower_id', $borrowerId))
            ->when($supervisorId !== 'all', fn ($q) => $q->where('supervisor_id', $supervisorId))
            ->when($kelas !== 'all', fn ($q) => $q->whereHas('borrower', fn ($b) => $b->where('class', $kelas)))
            ->when($dateFrom !== '', fn ($q) => $q->whereDate('request_date', '>=', $dateFrom))
            ->when($dateTo !== '', fn ($q) => $q->whereDate('request_date', '<=', $dateTo))
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Loan $loan) => $this->formatLoan($loan));

        return Inertia::render('Admin/Loan/Index', [
            'loans' => $loans,
            'filters' => [
                'search' => $search->toString(),
                'status' => $status,
                'item_type' => $itemType,
                'borrower_id' => $borrowerId,
                'supervisor_id' => $supervisorId,
                'kelas' => $kelas,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'borrowerOptions' => $this->borrowerOptions(),
            'supervisorOptions' => $this->supervisorOptions(),
            'kelasOptions' => config('lab.class_options'),
            'statusOptions' => config('lab.loan_statuses'),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Loan::class);

        return Inertia::render('Admin/Loan/Create', $this->formOptions());
    }

    public function store(StoreLoanRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $items = $validated['items'];
        unset($validated['items']);

        $this->workflow->validateStockForItems($items, $validated['item_type']);

        $loan = Loan::create([
            ...$validated,
            'code' => Loan::generateCode(),
            'status' => 'diminta',
            'borrow_scope' => $validated['borrow_scope'] ?? 'lab',
            'due_at' => $validated['item_type'] === 'alat' ? ($validated['due_at'] ?? null) : null,
        ]);

        $this->syncItems($loan, $items);
        $this->workflow->logStatus($loan, 'diminta', 'Pengajuan peminjaman dibuat.', $request->user());

        return redirect()
            ->route('admin.loans.index')
            ->with('success', 'Pengajuan peminjaman berhasil dibuat.');
    }

    public function show(Loan $loan): Response
    {
        $this->authorize('view', $loan);
        $loan->load([
            'borrower:id,name,role,class,nisn',
            'supervisor:id,name,nip',
            'schedule:id,code,title,mata_kuliah,tanggal',
            'items.equipment:id,code,name,item_type,category',
            'statusLogs.user:id,name',
            'collateral',
            'inspection',
            'compensation',
        ]);

        return Inertia::render('Admin/Loan/Show', [
            'loan' => $this->formatLoan($loan, true),
        ]);
    }

    public function edit(Loan $loan): Response
    {
        $this->authorize('update', $loan);
        $loan->load('items.equipment:id,code,name,item_type,available');

        return Inertia::render('Admin/Loan/Edit', [
            'loan' => $this->formatLoan($loan, true),
            ...$this->formOptions(),
        ]);
    }

    public function update(UpdateLoanRequest $request, Loan $loan): RedirectResponse
    {
        $this->authorize('update', $loan);

        $validated = $request->validated();
        $items = $validated['items'];
        unset($validated['items']);

        $this->workflow->validateStockForItems($items, $validated['item_type']);

        $loan->update([
            ...$validated,
            'due_at' => $validated['item_type'] === 'alat' ? ($validated['due_at'] ?? null) : null,
        ]);

        $this->syncItems($loan, $items);

        return redirect()
            ->route('admin.loans.show', $loan)
            ->with('success', 'Peminjaman berhasil diperbarui.');
    }

    public function destroy(Loan $loan): RedirectResponse
    {
        $this->authorize('delete', $loan);

        if (in_array($loan->status, ['dipinjam', 'terlambat'], true)) {
            $this->workflow->restoreStock($loan);
        }

        $loan->delete();

        return redirect()
            ->route('admin.loans.index')
            ->with('success', 'Peminjaman berhasil dihapus.');
    }

    public function approve(Loan $loan): RedirectResponse
    {
        $this->authorize('approve', $loan);
        $this->workflow->approve($loan, request()->user());

        return back()->with('success', 'Peminjaman berhasil disetujui.');
    }

    public function reject(RejectLoanRequest $request, Loan $loan): RedirectResponse
    {
        $this->authorize('reject', $loan);
        $this->workflow->reject($loan, $request->validated('rejection_reason'), $request->user());

        return back()->with('success', 'Peminjaman ditolak.');
    }

    public function markBorrowed(Loan $loan): RedirectResponse
    {
        $this->authorize('markBorrowed', $loan);
        $this->workflow->markBorrowed($loan, request()->user());

        return back()->with('success', 'Status diperbarui: alat sedang dipinjam.');
    }

    public function processReturn(ReturnLoanRequest $request, Loan $loan): RedirectResponse
    {
        $this->authorize('processReturn', $loan);
        $this->workflow->processReturn($loan, $request->validated('note'), $request->user());

        return back()->with('success', 'Pengembalian berhasil diproses.');
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

    private function formOptions(): array
    {
        return [
            'borrowerOptions' => $this->borrowerOptions(),
            'supervisorOptions' => $this->supervisorOptions(),
            'scheduleOptions' => PracticumSchedule::query()
                ->where('status', 'aktif')
                ->orderByDesc('tanggal')
                ->get(['id', 'code', 'title', 'mata_kuliah', 'kelas', 'tanggal'])
                ->map(fn ($s) => [
                    'id' => $s->id,
                    'label' => "{$s->code} — {$s->title} ({$s->kelas})",
                ])
                ->values()
                ->all(),
            'equipmentOptionsAlat' => $this->equipmentOptions('alat'),
            'equipmentOptionsBahan' => $this->equipmentOptions('bahan'),
        ];
    }

    private function borrowerOptions(): array
    {
        return User::query()
            ->where('role', 'siswa')
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'class'])
            ->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'class' => $u->class,
                'label' => "{$u->name}".($u->class ? " ({$u->class})" : ''),
            ])
            ->values()
            ->all();
    }

    private function supervisorOptions(): array
    {
        return User::query()
            ->where('role', 'guru')
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (User $u) => ['id' => $u->id, 'name' => $u->name])
            ->values()
            ->all();
    }

    private function equipmentOptions(string $itemType): array
    {
        $query = Equipment::query()->where('status', 'active')->orderBy('name');

        if ($itemType === 'alat') {
            $query->alat();
        } else {
            $query->bahan();
        }

        return $query->get(['id', 'code', 'name', 'available', 'unit'])
            ->map(fn (Equipment $e) => [
                'id' => $e->id,
                'label' => "{$e->code} — {$e->name} (tersedia: {$e->available}".($e->unit ? " {$e->unit}" : '').')',
            ])
            ->values()
            ->all();
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
            'borrower_role' => $loan->borrower?->role,
            'borrower_class' => $loan->borrower?->class,
            'supervisor_id' => $loan->supervisor_id,
            'supervisor_name' => $loan->supervisor?->name,
            'practicum_schedule_id' => $loan->practicum_schedule_id,
            'schedule_title' => $loan->schedule?->title,
            'item_type' => $loan->item_type,
            'item_type_label' => $loan->item_type === 'alat' ? 'Alat' : 'Bahan',
            'status' => $loan->status,
            'request_date' => $loan->request_date?->format('Y-m-d'),
            'request_date_formatted' => $loan->request_date?->translatedFormat('d M Y'),
            'borrowed_at_formatted' => $loan->borrowed_at?->translatedFormat('d M Y H:i'),
            'due_at' => $loan->due_at?->format('Y-m-d\TH:i'),
            'due_at_formatted' => $loan->due_at?->translatedFormat('d M Y H:i') ?: '—',
            'returned_at_formatted' => $loan->returned_at?->translatedFormat('d M Y H:i') ?: '—',
            'purpose' => $loan->purpose,
            'notes' => $loan->notes,
            'rejection_reason' => $loan->rejection_reason,
            'borrow_scope' => $loan->borrow_scope,
            'items_summary' => $itemsSummary ?: '—',
            'created_at_formatted' => $loan->created_at?->translatedFormat('d M Y'),
            'can_approve' => in_array($loan->status, ['diminta', 'antrian'], true),
            'can_reject' => in_array($loan->status, ['diminta', 'antrian', 'disetujui'], true),
            'can_mark_borrowed' => $loan->isAlat() && $loan->status === 'disetujui',
            'can_return' => $loan->isAlat() && in_array($loan->status, ['dipinjam', 'terlambat'], true),
            'can_inspect' => $loan->status === 'menunggu_inspeksi',
            'can_edit' => in_array($loan->status, ['diminta', 'antrian'], true),
            'requires_collateral' => $loan->requiresCollateral(),
            'collateral_id' => $loan->collateral?->id,
            'collateral_code' => $loan->collateral?->code,
            'collateral_status' => $loan->collateral?->status,
        ];

        if ($detailed) {
            $data['items'] = $items;
            $data['timeline'] = $loan->relationLoaded('statusLogs')
                ? $loan->statusLogs->map(fn ($log) => [
                    'status' => $log->status,
                    'note' => $log->note,
                    'user_name' => $log->user?->name,
                    'created_at_formatted' => $log->created_at?->translatedFormat('d M Y H:i'),
                ])->values()->all()
                : [];
        }

        return $data;
    }
}
