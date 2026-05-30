<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\InspectReturnRequest;
use App\Http\Requests\Admin\StoreLoanCollateralRequest;
use App\Http\Requests\Admin\UpdateLoanCollateralRequest;
use App\Models\Loan;
use App\Models\LoanCollateral;
use App\Models\User;
use App\Services\Loan\CollateralWorkflowService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LoanCollateralController extends Controller
{
    public function __construct(
        private CollateralWorkflowService $workflow,
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', LoanCollateral::class);

        $search = $request->string('search')->trim();
        $status = $request->string('status')->toString() ?: 'all';
        $studentId = $request->string('student_id')->toString() ?: 'all';
        $kelas = $request->string('kelas')->toString() ?: 'all';
        $dateFrom = $request->string('date_from')->toString();
        $dateTo = $request->string('date_to')->toString();

        $collaterals = LoanCollateral::query()
            ->with([
                'student:id,name,class,nisn',
                'loan:id,code,status,borrow_scope',
                'loan.items.equipment:id,name',
                'heldByAdmin:id,name',
            ])
            ->when($search->isNotEmpty(), function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('code', 'like', "%{$search}%")
                        ->orWhere('card_number', 'like', "%{$search}%")
                        ->orWhereHas('student', fn ($s) => $s->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('loan', fn ($l) => $l->where('code', 'like', "%{$search}%"));
                });
            })
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->when($studentId !== 'all', fn ($q) => $q->where('student_id', $studentId))
            ->when($kelas !== 'all', fn ($q) => $q->whereHas('student', fn ($s) => $s->where('class', $kelas)))
            ->when($dateFrom !== '', fn ($q) => $q->whereDate('held_at', '>=', $dateFrom))
            ->when($dateTo !== '', fn ($q) => $q->whereDate('held_at', '<=', $dateTo))
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(fn (LoanCollateral $item) => $this->formatCollateral($item));

        return Inertia::render('Admin/Collateral/Index', [
            'collaterals' => $collaterals,
            'filters' => [
                'search' => $search->toString(),
                'status' => $status,
                'student_id' => $studentId,
                'kelas' => $kelas,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'studentOptions' => $this->studentOptions(),
            'kelasOptions' => config('lab.class_options'),
            'statusOptions' => config('lab.collateral_statuses'),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', LoanCollateral::class);

        return Inertia::render('Admin/Collateral/Create', $this->formOptions());
    }

    public function store(StoreLoanCollateralRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $loan = Loan::findOrFail($validated['loan_id']);

        if ($loan->borrower_id != $validated['student_id']) {
            return back()->withErrors(['student_id' => 'Siswa harus sama dengan peminjam pada peminjaman terkait.']);
        }

        if ($loan->collateral()->exists()) {
            return back()->withErrors(['loan_id' => 'Peminjaman ini sudah memiliki jaminan kartu.']);
        }

        $collateral = LoanCollateral::create([
            ...$validated,
            'code' => LoanCollateral::generateCode(),
            'held_at' => $validated['status'] === 'ditahan' ? now() : null,
            'held_by_admin_id' => $validated['status'] === 'ditahan'
                ? $request->user()->id
                : null,
        ]);

        return redirect()
            ->route('admin.collaterals.index')
            ->with('success', 'Jaminan kartu berhasil ditambahkan.');
    }

    public function show(LoanCollateral $collateral): Response
    {
        $this->authorize('view', $collateral);
        $collateral->load([
            'student:id,name,class,nisn,email',
            'loan.borrower:id,name',
            'loan.items.equipment:id,code,name',
            'loan.inspection',
            'loan.compensation',
            'loan.statusLogs.user:id,name',
            'heldByAdmin:id,name',
        ]);

        return Inertia::render('Admin/Collateral/Show', [
            'collateral' => $this->formatCollateral($collateral, true),
        ]);
    }

    public function edit(LoanCollateral $collateral): Response
    {
        $this->authorize('update', $collateral);

        return Inertia::render('Admin/Collateral/Edit', [
            'collateral' => $this->formatCollateral($collateral->load('loan'), true),
            ...$this->formOptions(),
        ]);
    }

    public function update(UpdateLoanCollateralRequest $request, LoanCollateral $collateral): RedirectResponse
    {
        $collateral->update($request->validated());

        return redirect()
            ->route('admin.collaterals.show', $collateral)
            ->with('success', 'Jaminan kartu berhasil diperbarui.');
    }

    public function destroy(LoanCollateral $collateral): RedirectResponse
    {
        $this->authorize('delete', $collateral);
        $collateral->delete();

        return redirect()
            ->route('admin.collaterals.index')
            ->with('success', 'Jaminan kartu berhasil dihapus.');
    }

    public function hold(LoanCollateral $collateral): RedirectResponse
    {
        $this->authorize('hold', $collateral);
        $this->workflow->holdCard($collateral, request()->user());

        return back()->with('success', 'Kartu ditandai sebagai ditahan.');
    }

    public function returnCard(LoanCollateral $collateral): RedirectResponse
    {
        $this->authorize('returnCard', $collateral);
        $this->workflow->returnCardDirect($collateral, request()->user());

        return back()->with('success', 'Kartu berhasil dikembalikan ke siswa.');
    }

    public function completeCompensation(LoanCollateral $collateral): RedirectResponse
    {
        $this->authorize('completeCompensation', $collateral);
        $this->workflow->completeCompensationAndReturnCard($collateral, request()->user());

        return back()->with('success', 'Kompensasi selesai. Kartu dikembalikan.');
    }

    public function inspect(InspectReturnRequest $request, Loan $loan): RedirectResponse
    {
        $this->authorize('inspect', LoanCollateral::class);
        $this->workflow->inspectReturn($loan, $request->validated(), $request->user());

        $collateral = $loan->fresh()->collateral;

        if ($collateral) {
            return redirect()
                ->route('admin.collaterals.show', $collateral)
                ->with('success', 'Inspeksi pengembalian selesai.');
        }

        return redirect()
            ->route('admin.loans.show', $loan)
            ->with('success', 'Inspeksi pengembalian selesai.');
    }

    private function formOptions(): array
    {
        $loans = Loan::query()
            ->where('item_type', 'alat')
            ->where('borrow_scope', 'bawa_pulang')
            ->whereDoesntHave('collateral')
            ->with('borrower:id,name,class')
            ->latest()
            ->get();

        return [
            'loanOptions' => $loans->map(fn (Loan $l) => [
                'id' => $l->id,
                'label' => "{$l->code} — {$l->borrower?->name} ({$l->borrower?->class})",
                'borrower_id' => $l->borrower_id,
                'borrower_nisn' => $l->borrower?->nisn,
            ])->values()->all(),
            'studentOptions' => $this->studentOptions(),
            'cardTypeOptions' => config('lab.collateral_card_types'),
            'statusOptions' => config('lab.collateral_statuses'),
        ];
    }

    private function studentOptions(): array
    {
        return User::query()
            ->where('role', 'siswa')
            ->orderBy('name')
            ->get(['id', 'name', 'class', 'nisn'])
            ->map(fn (User $u) => [
                'id' => $u->id,
                'label' => "{$u->name}".($u->class ? " ({$u->class})" : ''),
                'nisn' => $u->nisn,
            ])
            ->values()
            ->all();
    }

    private function formatCollateral(LoanCollateral $collateral, bool $detailed = false): array
    {
        $loan = $collateral->relationLoaded('loan') ? $collateral->loan : null;
        $equipmentSummary = $loan && $loan->relationLoaded('items')
            ? $loan->items->map(fn ($i) => $i->equipment?->name.' ×'.$i->quantity)->join(', ')
            : null;

        $data = [
            'id' => $collateral->id,
            'code' => $collateral->code,
            'loan_id' => $collateral->loan_id,
            'loan_code' => $loan?->code,
            'loan_status' => $loan?->status,
            'equipment_summary' => $equipmentSummary,
            'student_id' => $collateral->student_id,
            'student_name' => $collateral->student?->name,
            'student_class' => $collateral->student?->class,
            'student_nisn' => $collateral->student?->nisn,
            'card_type' => $collateral->card_type,
            'card_type_label' => config("lab.collateral_card_types.{$collateral->card_type}", $collateral->card_type),
            'card_number' => $collateral->card_number,
            'status' => $collateral->status,
            'held_at_formatted' => $collateral->held_at?->translatedFormat('d M Y H:i') ?: '—',
            'returned_at_formatted' => $collateral->returned_at?->translatedFormat('d M Y H:i') ?: '—',
            'held_by_name' => $collateral->heldByAdmin?->name,
            'notes' => $collateral->notes,
            'created_at_formatted' => $collateral->created_at?->translatedFormat('d M Y'),
            'can_hold' => $collateral->status === 'dititipkan',
            'can_return_card' => in_array($collateral->status, ['ditahan', 'menunggu_kompensasi'], true),
            'can_complete_compensation' => $collateral->status === 'menunggu_kompensasi',
            'can_inspect' => $loan?->status === 'menunggu_inspeksi',
        ];

        if ($detailed && $loan) {
            $data['inspection'] = $loan->relationLoaded('inspection') && $loan->inspection
                ? [
                    'result' => $loan->inspection->result,
                    'notes' => $loan->inspection->notes,
                    'missing_items' => $loan->inspection->missing_items,
                    'damage_description' => $loan->inspection->damage_description,
                    'checked_at_formatted' => $loan->inspection->checked_at?->translatedFormat('d M Y H:i'),
                ]
                : null;
            $data['compensation'] = $loan->relationLoaded('compensation') && $loan->compensation
                ? [
                    'required' => $loan->compensation->required,
                    'status' => $loan->compensation->status,
                    'amount' => $loan->compensation->amount,
                    'description' => $loan->compensation->description,
                    'completed_at_formatted' => $loan->compensation->completed_at?->translatedFormat('d M Y H:i'),
                ]
                : null;
            $data['loan_timeline'] = $loan->relationLoaded('statusLogs')
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
