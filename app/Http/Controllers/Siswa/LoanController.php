<?php

namespace App\Http\Controllers\Siswa;

use App\Http\Controllers\Controller;
use App\Http\Requests\Siswa\StoreStudentLoanRequest;
use App\Http\Requests\Siswa\StoreStudentPackageLoanRequest;
use App\Http\Requests\Siswa\UpdateStudentLoanRequest;
use App\Models\Equipment;
use App\Models\Loan;
use App\Models\PracticumSchedule;
use App\Models\Submission;
use App\Models\User;
use App\Services\Loan\CollateralWorkflowService;
use App\Services\Loan\LoanQueueService;
use App\Services\Loan\LoanWorkflowService;
use App\Services\Loan\SubmissionPresenter;
use App\Services\Notification\LabNotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class LoanController extends Controller
{
    public function __construct(
        private LoanWorkflowService $workflow,
        private CollateralWorkflowService $collateralWorkflow,
        private LoanQueueService $queueService,
        private SubmissionPresenter $submissions,
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

        $baseQuery = Submission::query()->where('borrower_id', $user->id);

        $scopedCountQuery = (clone $baseQuery)->whereHas(
            'loans',
            fn ($q) => $this->applyStudentLoanScope($q, $scope),
        );

        $listQuery = (clone $baseQuery)
            ->with([
                'borrower:id,name,role,class',
                'supervisor:id,name',
                'loans.supervisor:id,name',
                'loans.schedule:id,code,title,mata_kuliah,kelas,tanggal,jam_mulai,jam_selesai,priority',
                'loans.items.equipment:id,code,name,item_type,unit,image_path',
                'loans.collateral:id,loan_id,status,held_at,returned_at',
            ])
            ->whereHas('loans', fn ($q) => $this->applyStudentLoanScope($q, $scope))
            ->when($search->isNotEmpty(), function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('code', 'like', "%{$search}%")
                        ->orWhere('purpose', 'like', "%{$search}%")
                        ->orWhere('notes', 'like', "%{$search}%")
                        ->orWhereHas('loans.items.equipment', fn ($e) => $e->where('name', 'like', "%{$search}%"));
                });
            })
            ->when($status !== 'all', fn ($q) => $q->whereAggregateStatus($status))
            ->when($itemType !== 'all', function ($q) use ($itemType) {
                $q->whereHas('loans', fn ($l) => $l->where('item_type', $itemType));
            })
            ->when($dateFrom !== '', fn ($q) => $q->whereDate('request_date', '>=', $dateFrom))
            ->when($dateTo !== '', fn ($q) => $q->whereDate('request_date', '<=', $dateTo))
            ->latest();

        $loans = $listQuery
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Submission $submission) => $this->submissions->list(
                $submission,
                fn (Loan $loan) => $this->formatLoan($loan, true),
                'siswa.loans.submission',
            ));

        return Inertia::render('Siswa/Loan/Index', [
            'loans' => $loans,
            'tabCounts' => [
                'all' => (clone $scopedCountQuery)->count(),
                'alat' => (clone $scopedCountQuery)->whereHas('loans', fn ($q) => $q->where('item_type', 'alat'))->count(),
                'bahan' => (clone $scopedCountQuery)->whereHas('loans', fn ($q) => $q->where('item_type', 'bahan'))->count(),
            ],
            'filters' => [
                'search' => $search->toString(),
                'status' => $status,
                'item_type' => $itemType,
                'scope' => $scope,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'statusOptions' => config('lab.submission_statuses'),
            'queueConfig' => [
                'school_close_time' => config('lab.queue.school_close_time'),
                'bawa_pulang_max_days' => config('lab.queue.bawa_pulang_max_days'),
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $this->authorize('create', Loan::class);
        $this->workflow->syncOverdue();

        $user = $request->user();
        $type = $request->string('type')->toString() === 'bahan' ? 'bahan' : 'alat';
        $prefillEquipmentId = $request->integer('equipment_id') ?: null;
        $prefillSupplyId = $request->integer('supply_id') ?: null;

        $prefillId = $type === 'bahan' ? $prefillSupplyId : $prefillEquipmentId;

        $options = $this->formOptions($user);
        $prefillItem = $this->resolvePrefillCatalogItem($prefillId, $type);

        return Inertia::render('Siswa/Loan/Create', [
            'loanType' => $type,
            'prefillItem' => $prefillItem,
            'overdueLoans' => $this->overdueLoansFor($user),
            'catalog' => $this->paginatedCatalog($request, $type),
            'catalogFilters' => [
                'search' => $request->string('catalog_search')->trim()->toString(),
            ],
            ...$options,
            'defaults' => [
                'item_type' => $type,
                'request_date' => now()->toDateString(),
                'borrow_scope' => 'lab',
                'borrow_reason' => 'reguler',
                'supervisor_id' => '',
                'practicum_schedule_id' => '',
                'due_at' => '',
                'purpose' => '',
                'notes' => '',
                'usage_room' => '',
                'collateral_agreed' => false,
                'items' => $prefillId
                    ? [['equipment_id' => (string) $prefillId, 'quantity' => 1]]
                    : [['equipment_id' => '', 'quantity' => 1]],
            ],
            'queueConfig' => [
                'school_close_time' => config('lab.queue.school_close_time'),
                'bawa_pulang_max_days' => config('lab.queue.bawa_pulang_max_days'),
            ],
        ]);
    }

    public function store(StoreStudentLoanRequest $request): RedirectResponse
    {
        $this->authorize('create', Loan::class);
        $this->workflow->syncOverdue();

        $loan = DB::transaction(function () use ($request) {
            $payload = $request->validated();
            $submission = Submission::createForBorrower($request->user(), $payload);

            return $this->createStudentLoan($payload, $request->user(), null, $submission);
        });

        return redirect()
            ->route('siswa.loans.index', ['scope' => 'active'])
            ->with('success', $this->successMessageFor($loan));
    }

    public function storePackage(StoreStudentPackageLoanRequest $request): RedirectResponse
    {
        $this->authorize('create', Loan::class);
        $this->workflow->syncOverdue();

        try {
            $alatPayload = $this->validateNestedStudentLoan(
                array_merge($request->input('alat', []), ['item_type' => 'alat']),
            );
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw \Illuminate\Validation\ValidationException::withMessages(
                collect($e->errors())
                    ->mapWithKeys(fn ($messages, $key) => ["alat.{$key}" => $messages])
                    ->all(),
            );
        }

        try {
            $bahanPayload = $this->validateNestedStudentLoan(
                array_merge($request->input('bahan', []), ['item_type' => 'bahan']),
            );
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw \Illuminate\Validation\ValidationException::withMessages(
                collect($e->errors())
                    ->mapWithKeys(fn ($messages, $key) => ["bahan.{$key}" => $messages])
                    ->all(),
            );
        }

        $groupId = (string) Str::uuid();

        [$alatLoan, $submission] = DB::transaction(function () use ($alatPayload, $bahanPayload, $request, $groupId) {
            $submission = Submission::createForBorrower($request->user(), $alatPayload);
            $alatLoan = $this->createStudentLoan($alatPayload, $request->user(), $groupId, $submission);
            $this->createStudentLoan($bahanPayload, $request->user(), $groupId, $submission);

            return [$alatLoan, $submission];
        });

        return redirect()
            ->route('siswa.loans.index', ['scope' => 'active'])
            ->with('success', 'Pengajuan '.$submission->code.' terkirim. Alat dan bahan diproses terpisah sesuai ketersediaan stok.');
    }

    public function edit(Request $request, Loan $loan): Response
    {
        $this->authorize('update', $loan);

        $loan->load('items.equipment');

        $options = $this->formOptions($request->user(), $loan);

        return Inertia::render('Siswa/Loan/Create', [
            'loan' => $this->formatLoan($loan, true),
            'loanType' => $loan->item_type,
            'overdueLoans' => $this->overdueLoansFor($request->user()),
            'catalog' => $this->paginatedCatalog($request, $loan->item_type, $loan),
            'catalogFilters' => [
                'search' => $request->string('catalog_search')->trim()->toString(),
            ],
            'initialCart' => $loan->items
                ->map(function ($item) {
                    if (! $item->equipment) {
                        return null;
                    }

                    return [
                        'equipment' => $this->formatCatalogItem($item->equipment),
                        'quantity' => $item->quantity,
                    ];
                })
                ->filter()
                ->values()
                ->all(),
            ...$options,
            'defaults' => [
                'item_type' => $loan->item_type,
                'supervisor_id' => (string) $loan->supervisor_id,
                'practicum_schedule_id' => $loan->practicum_schedule_id
                    ? (string) $loan->practicum_schedule_id
                    : '',
                'request_date' => $loan->request_date?->format('Y-m-d') ?? now()->toDateString(),
                'borrow_scope' => $loan->borrow_scope ?? 'lab',
                'borrow_reason' => $loan->borrow_reason ?? 'reguler',
                'due_at' => $loan->due_at?->format('Y-m-d\TH:i') ?? '',
                'purpose' => $loan->purpose ?? '',
                'notes' => $loan->notes ?? $loan->purpose ?? '',
                'usage_room' => $loan->usage_room ?? '',
                'collateral_agreed' => false,
            ],
        ]);
    }

    public function update(UpdateStudentLoanRequest $request, Loan $loan): RedirectResponse
    {
        $this->authorize('update', $loan);

        $validated = $request->validated();
        $items = $validated['items'];
        unset($validated['items'], $validated['collateral_agreed'], $validated['item_type']);

        $this->queueService->validateItemsForSubmit(
            $items,
            $loan->item_type,
            $request->user()->id,
        );

        $newStatus = in_array($loan->status, ['diminta', 'antrian'], true)
            ? $this->queueService->resolveInitialStatus($items, $loan->item_type)
            : $loan->status;

        $statusUpdate = [];

        if (in_array($loan->status, ['diminta', 'antrian'], true)) {
            $statusUpdate = [
                'status' => $newStatus,
                'queued_at' => $newStatus === 'antrian'
                    ? ($loan->queued_at ?? now())
                    : null,
            ];
        }

        $dueAt = $loan->isAlat() ? ($validated['due_at'] ?? null) : null;

        $loan->update([
            'supervisor_id' => $validated['supervisor_id'] ?? null,
            'practicum_schedule_id' => $validated['practicum_schedule_id'] ?? null,
            'request_date' => $validated['request_date'],
            'purpose' => $validated['purpose'],
            'notes' => $validated['notes'] ?? null,
            'borrow_scope' => $loan->isAlat() ? ($validated['borrow_scope'] ?? 'lab') : null,
            'borrow_reason' => $loan->isAlat() && ($validated['borrow_scope'] ?? 'lab') === 'lab'
                ? ($validated['borrow_reason'] ?? 'reguler')
                : null,
            'usage_room' => $validated['usage_room'] ?? null,
            'due_at' => $dueAt,
            ...$statusUpdate,
        ]);

        if ($loan->isAlat() && $loan->due_at) {
            $loan->update([
                'due_at' => $this->queueService->clampDueAtToTimeSlice($loan->fresh()),
            ]);
        }

        $this->syncItems($loan, $items);

        if (($statusUpdate['status'] ?? null) === 'antrian') {
            $this->queueService->enqueue($loan->fresh(), $request->user());
        } else {
            $this->workflow->logStatus(
                $loan,
                $loan->fresh()->status,
                'Pengajuan diperbarui oleh siswa.',
                $request->user(),
            );
        }

        $this->collateralWorkflow->syncCollateralForLoan($loan->fresh());

        return redirect()
            ->route('siswa.loans.show', $loan)
            ->with('success', 'Pengajuan peminjaman berhasil diperbarui.');
    }

    public function show(Loan $loan): Response
    {
        $this->authorize('view', $loan);
        $this->workflow->syncOverdue();
        $loan->refresh();

        $loan->load([
            'submission:id,code,borrower_id,supervisor_id,purpose,notes,request_date',
            'supervisor:id,name,nip',
            'schedule:id,code,title,mata_kuliah,tanggal,kelas',
            'items.equipment:id,code,name,item_type,category,unit,image_path',
            'statusLogs.user:id,name',
            'collateral',
            'compensation',
            'inspection',
        ]);

        return Inertia::render('Siswa/Loan/Show', [
            'loan' => $this->formatLoan($loan, true),
        ]);
    }

    public function showSubmission(Submission $submission): Response
    {
        $this->authorize('view', $submission);
        $this->workflow->syncOverdue();

        $submission->load([
            'borrower:id,name,role,class',
            'supervisor:id,name',
            'loans.supervisor:id,name',
            'loans.schedule:id,code,title,mata_kuliah,kelas,tanggal',
            'loans.items.equipment:id,code,name,item_type,unit,image_path',
            'loans.collateral',
        ]);

        return Inertia::render('Siswa/Loan/Submission', [
            'submission' => $this->submissions->detail(
                $submission,
                fn (Loan $loan) => $this->formatLoan($loan, true),
                'siswa.loans.submission',
            ),
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
        $this->workflow->syncOverdue();
        $loan->refresh();

        $this->authorize('requestReturn', $loan);

        $request->validate([
            'note' => ['nullable', 'string', 'max:2000'],
        ]);

        $this->workflow->processReturn($loan, $request->input('note'), $request->user());

        $fresh = $loan->fresh();

        $message = $fresh && $fresh->requiresReturnInspection()
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

    private function formOptions(User $user, ?Loan $loan = null): array
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
            'todaySchedules' => $this->schedulesForToday($user, $loan),
            'labRoomOptions' => config('lab.lab_room_options', []),
        ];
    }

    private function schedulesForToday(User $user, ?Loan $loan = null): array
    {
        $today = $this->scheduleOptions($user, todayOnly: true);

        if (! $loan?->practicum_schedule_id) {
            return $today;
        }

        $exists = collect($today)->contains(
            fn (array $schedule) => (int) $schedule['id'] === (int) $loan->practicum_schedule_id
        );

        if ($exists) {
            return $today;
        }

        $current = PracticumSchedule::query()
            ->with('guru:id,name')
            ->find($loan->practicum_schedule_id);

        if (! $current) {
            return $today;
        }

        return array_merge($today, [$this->formatScheduleOption($current)]);
    }

    private function scheduleOptions(User $user, bool $futureOnly = true, bool $todayOnly = false): array
    {
        $now = now();

        return PracticumSchedule::query()
            ->forStudentSelection($futureOnly)
            ->when($user->class, fn ($q) => $q->where('kelas', $user->class))
            ->with('guru:id,name')
            ->orderByHari()
            ->orderBy('jam_mulai')
            ->orderBy('tanggal')
            ->get(['id', 'code', 'title', 'mata_kuliah', 'kelas', 'type', 'hari', 'tanggal', 'jam_mulai', 'jam_selesai', 'priority', 'guru_id', 'ruangan'])
            ->when($todayOnly, fn ($collection) => $collection->filter(
                fn (PracticumSchedule $schedule) => $schedule->matchesRequestDate($now)
            ))
            ->map(fn (PracticumSchedule $schedule) => $this->formatScheduleOption($schedule))
            ->values()
            ->all();
    }

    private function formatScheduleOption(PracticumSchedule $schedule): array
    {
        return [
            'id' => $schedule->id,
            'code' => $schedule->code,
            'title' => $schedule->title,
            'mata_kuliah' => $schedule->mata_kuliah,
            'kelas' => $schedule->kelas,
            'type' => $schedule->type,
            'hari' => $schedule->hari,
            'hari_label' => $schedule->hariLabel(),
            'jadwal_label' => $schedule->jadwalLabel(),
            'tanggal' => $schedule->tanggal?->format('Y-m-d'),
            'jam_mulai' => $schedule->jam_mulai,
            'jam_selesai' => $schedule->jam_selesai,
            'priority' => $schedule->priority,
            'guru_id' => $schedule->guru_id,
            'guru_name' => $schedule->guru?->name,
            'ruangan' => $schedule->ruangan,
        ];
    }

    private function paginatedCatalog(Request $request, string $itemType, ?Loan $loan = null)
    {
        $search = $request->string('catalog_search')->trim();

        $query = Equipment::query()
            ->where('status', 'tersedia')
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
            ->where('status', 'tersedia');

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
            'item_type' => $equipment->item_type,
            'available' => $equipment->available,
            'stock' => $equipment->stock,
            'unit' => $equipment->unit ?? ($isBahan ? 'pcs' : 'unit'),
            'min_stock' => $equipment->min_stock,
            'image_url' => $equipment->image_url,
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
                'image_url' => $item->equipment?->image_url,
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
            'code' => $loan->displayCode(),
            'loan_code' => $loan->code,
            'submission_id' => $loan->submission_id,
            'submission_code' => $loan->submission?->code ?? $loan->displayCode(),
            'loan_group_id' => $loan->loan_group_id,
            'is_package' => $loan->isPackaged(),
            'package_mates' => $this->formatPackageMates($loan),
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
            'borrow_scope_label' => $loan->borrowLocationLabel(),
            'borrow_reason' => $loan->borrow_reason,
            'borrow_reason_label' => $loan->borrowReasonLabel(),
            'usage_room' => $loan->usage_room,
            'is_catch_up' => $loan->isCatchUp(),
            'items_summary' => $itemsSummary ?: '—',
            'items_count' => $itemsCount,
            'total_quantity' => collect($items)->sum('quantity'),
            'display_title' => collect($items)->first()['equipment_name'] ?? $itemsSummary,
            'created_at_formatted' => $loan->created_at?->translatedFormat('d M Y'),
            'due_at_iso' => $loan->due_at?->toIso8601String(),
            'requires_collateral' => $loan->requiresCollateral(),
            'requires_return_inspection' => $loan->requiresReturnInspection(),
            'collateral_id' => $loan->collateral?->id,
            'collateral_code' => $loan->collateral?->code,
            'collateral_status' => $loan->collateral?->status,
            'can_cancel' => auth()->user()?->can('cancel', $loan) ?? false,
            'can_edit' => auth()->user()?->can('update', $loan) ?? false,
            'can_request_return' => auth()->user()?->can('requestReturn', $loan) ?? false,
            'is_overdue' => $loan->isOverdue(),
            ...($loan->status === 'antrian' ? $this->queueService->queueSummary($loan) : []),
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
            $data['inspection'] = $loan->relationLoaded('inspection') && $loan->inspection
                ? [
                    'result' => $loan->inspection->result,
                    'damage_description' => $loan->inspection->damage_description,
                    'missing_items' => $loan->inspection->missing_items,
                ]
                : null;
        }

        return $data;
    }

    private function overdueLoansFor(User $user): array
    {
        return Loan::query()
            ->where('borrower_id', $user->id)
            ->where('item_type', 'alat')
            ->where(function ($query) {
                $query->where('status', 'terlambat')
                    ->orWhere(function ($inner) {
                        $inner->where('status', 'dipinjam')
                            ->whereNotNull('due_at')
                            ->where('due_at', '<', now());
                    });
            })
            ->with(['items.equipment:id,name'])
            ->latest()
            ->get()
            ->map(fn (Loan $loan) => [
                'id' => $loan->id,
                'code' => $loan->code,
                'status' => $loan->status,
                'items_summary' => $loan->items
                    ->map(fn ($item) => $item->equipment?->name)
                    ->filter()
                    ->join(', '),
                'show_url' => route('siswa.loans.show', $loan),
            ])
            ->values()
            ->all();
    }

    private function applyStudentLoanScope($query, string $scope): void
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

    /**
     * @param  array<string, mixed>  $validated
     */
    public function createStudentLoan(array $validated, User $user, ?string $loanGroupId = null, ?Submission $submission = null): Loan
    {
        $items = $validated['items'];
        unset($validated['items'], $validated['collateral_agreed']);

        $this->queueService->validateItemsForSubmit(
            $items,
            $validated['item_type'],
            $user->id,
        );

        $initialStatus = $this->queueService->resolveInitialStatus(
            $items,
            $validated['item_type'],
        );

        $submission ??= Submission::createForBorrower($user, $validated);

        $loan = Loan::create([
            ...$validated,
            'loan_group_id' => $loanGroupId,
            'submission_id' => $submission->id,
            'borrower_id' => $user->id,
            'code' => Loan::generateCode(),
            'status' => $initialStatus,
            'queued_at' => $initialStatus === 'antrian' ? now() : null,
            'borrow_scope' => $validated['item_type'] === 'alat'
                ? ($validated['borrow_scope'] ?? 'lab')
                : 'lab',
            'borrow_reason' => $validated['item_type'] === 'alat' && ($validated['borrow_scope'] ?? 'lab') === 'lab'
                ? ($validated['borrow_reason'] ?? 'reguler')
                : null,
            'usage_room' => $validated['usage_room'] ?? null,
            'due_at' => $validated['item_type'] === 'alat' ? ($validated['due_at'] ?? null) : null,
        ]);
        $loan->setRelation('submission', $submission);

        $this->syncItems($loan, $items);

        if ($loan->isAlat() && $loan->due_at) {
            $loan->load('schedule');
            $loan->update([
                'due_at' => $this->queueService->clampDueAtToTimeSlice($loan),
            ]);
        }

        if ($initialStatus === 'antrian') {
            $this->queueService->enqueue($loan->fresh(), $user);
        } else {
            $this->workflow->logStatus($loan, 'diminta', 'Pengajuan peminjaman dibuat oleh siswa.', $user);
        }

        if ($loan->requiresCollateral()) {
            $this->collateralWorkflow->registerPendingCollateral($loan->fresh());
        }

        app(LabNotificationService::class)->loanSubmitted($loan->fresh(['borrower', 'supervisor', 'items.equipment', 'submission']));

        return $loan->fresh();
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function validateNestedStudentLoan(array $payload): array
    {
        // Jangan salin server/body request induk — body JSON-nya berisi {alat, bahan},
        // sehingga FormRequest nested tidak menemukan supervisor_id/items di root.
        $subRequest = \Illuminate\Http\Request::create(
            '/siswa/loans/__nested_validation__',
            'POST',
            $payload,
        );
        $subRequest->headers->set('Accept', 'application/json');

        $form = StoreStudentLoanRequest::createFromBase($subRequest);
        $form->setContainer(app());
        $form->setRedirector(app('redirect'));
        $form->setUserResolver(fn () => request()->user());
        $form->validateResolved();

        return $form->validated();
    }

    private function successMessageFor(Loan $loan): string
    {
        if ($loan->status === 'antrian') {
            $position = $this->queueService->getQueuePosition($loan);
            $base = 'Pengajuan berhasil dikirim. Stok saat ini belum mencukupi sehingga pengajuan Anda masuk antrean Round Robin.';

            return $position
                ? "{$base} Posisi antrean: #{$position} (berdasarkan waktu pengajuan)."
                : $base;
        }

        if ($loan->item_type === 'bahan') {
            return 'Pengajuan berhasil dikirim dan menunggu persetujuan admin.';
        }

        if ($loan->borrow_scope === 'bawa_pulang') {
            return 'Pengajuan berhasil dikirim dan menunggu persetujuan admin. Siapkan kartu pelajar saat pengambilan alat.';
        }

        return 'Pengajuan berhasil dikirim dan menunggu persetujuan admin.';
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function formatPackageMates(Loan $loan): array
    {
        if (! $loan->isPackaged()) {
            return [];
        }

        return $loan->packageSiblings()
            ->map(fn (Loan $mate) => [
                'id' => $mate->id,
                'code' => $mate->code,
                'item_type' => $mate->item_type,
                'item_type_label' => $mate->item_type === 'alat' ? 'Alat' : 'Bahan',
                'status' => $mate->status,
                'queue_position' => $mate->status === 'antrian'
                    ? $this->queueService->getQueuePosition($mate)
                    : null,
            ])
            ->values()
            ->all();
    }
}
