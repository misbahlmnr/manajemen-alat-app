<?php

namespace App\Services\Report;

use App\Models\Equipment;
use App\Models\Loan;
use App\Models\LoanCollateral;
use App\Models\LoanCompensation;
use App\Models\PracticumSchedule;
use App\Models\Supply;
use App\Models\User;
use App\Services\Loan\LoanWorkflowService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AdminReportDataService
{
    public function __construct(
        private LoanWorkflowService $workflow,
    ) {}

    public function forRequest(Request $request): array
    {
        $this->workflow->syncOverdue();

        $type = $request->string('type')->toString() ?: 'ringkasan';
        $filters = [
            'type' => $type,
            'item_type' => $request->string('item_type')->toString() ?: 'all',
            'status' => $request->string('status')->toString() ?: 'all',
            'role' => $request->string('role')->toString() ?: 'all',
            'date_from' => $request->string('date_from')->toString(),
            'date_to' => $request->string('date_to')->toString(),
        ];

        $payload = match ($type) {
            'inventaris' => $this->inventarisReport($filters),
            'peminjaman' => $this->peminjamanReport($filters),
            'pengguna' => $this->penggunaReport($filters),
            default => $this->ringkasanReport($filters),
        };

        return [
            ...$payload,
            'reportType' => $type,
            'filters' => $filters,
            'meta' => [
                'school_name' => config('lab.school_name'),
                'lab_name' => config('lab.lab_name'),
                'generated_at' => now()->translatedFormat('d F Y H:i'),
                'generated_at_short' => now()->format('Y-m-d'),
            ],
            'statusOptions' => config('lab.loan_statuses'),
            'collateralStatusOptions' => config('lab.collateral_statuses'),
        ];
    }

    private function inventarisReport(array $filters): array
    {
        $itemType = $filters['item_type'];

        $rows = collect();

        if ($itemType !== 'bahan') {
            $rows = $rows->merge(
                Equipment::query()
                    ->alat()
                    ->orderBy('category')
                    ->orderBy('name')
                    ->get()
                    ->map(fn (Equipment $item) => $this->formatInventarisRow($item, 'alat'))
            );
        }

        if ($itemType !== 'alat') {
            $rows = $rows->merge(
                Supply::query()
                    ->orderBy('category')
                    ->orderBy('name')
                    ->get()
                    ->map(fn (Supply $item) => $this->formatInventarisRow($item, 'bahan'))
            );
        }

        $collection = $rows->values();

        return [
            'rows' => $collection->all(),
            'stats' => [
                'total' => $collection->count(),
                'alat' => $collection->where('item_type', 'alat')->count(),
                'bahan' => $collection->where('item_type', 'bahan')->count(),
                'tersedia' => $collection->sum('available'),
                'baik' => $collection->where('condition', 'baik')->count(),
                'rusak' => $collection->whereIn('condition', ['rusak_ringan', 'rusak_berat'])->count(),
                'low_stock' => $collection->where('is_low_stock', true)->count(),
            ],
        ];
    }

    private function peminjamanReport(array $filters): array
    {
        $rows = $this->loanQuery($filters)
            ->with([
                'borrower:id,name,class',
                'supervisor:id,name',
                'schedule:id,title,mata_kuliah',
                'items.equipment:id,name,code,unit',
                'collateral:id,loan_id,status',
            ])
            ->latest()
            ->get()
            ->map(fn (Loan $loan) => $this->formatLoanRow($loan))
            ->values();

        return [
            'rows' => $rows->all(),
            'stats' => [
                'total' => $rows->count(),
                'alat' => $rows->where('item_type', 'alat')->count(),
                'bahan' => $rows->where('item_type', 'bahan')->count(),
                'aktif' => $rows->whereIn('status', ['dipinjam', 'terlambat'])->count(),
                'terlambat' => $rows->where('status', 'terlambat')->count(),
                'selesai' => $rows->where('status', 'dikembalikan')->count(),
                'pending' => $rows->whereIn('status', ['diminta', 'antrian'])->count(),
            ],
        ];
    }

    private function penggunaReport(array $filters): array
    {
        $role = $filters['role'];

        $rows = User::query()
            ->when($role !== 'all', fn ($q) => $q->where('role', $role))
            ->where('role', '!=', 'admin')
            ->orderBy('role')
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'username' => $user->username,
                'role' => $user->role,
                'role_label' => ucfirst($user->role),
                'status' => $user->status ?? 'active',
                'phone' => $user->phone ?? '—',
                'nisn' => $user->nisn,
                'nip' => $user->nip,
                'identifier' => $user->nisn ?? $user->nip ?? '—',
                'class' => $user->class ?? '—',
                'created_at_formatted' => $user->created_at?->translatedFormat('d M Y'),
            ])
            ->values();

        return [
            'rows' => $rows->all(),
            'stats' => [
                'total' => $rows->count(),
                'siswa' => $rows->where('role', 'siswa')->count(),
                'guru' => $rows->where('role', 'guru')->count(),
                'aktif' => $rows->where('status', 'active')->count(),
            ],
        ];
    }

    private function ringkasanReport(array $filters): array
    {
        [$from, $to] = $this->resolvePeriod($filters);

        $loanBase = Loan::query()
            ->when($from, fn ($q) => $q->whereDate('request_date', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('request_date', '<=', $to));

        $periodLabel = $from && $to
            ? Carbon::parse($from)->translatedFormat('d M Y').' – '.Carbon::parse($to)->translatedFormat('d M Y')
            : 'Semua periode';

        $overdueLoans = (clone $loanBase)
            ->where('item_type', 'alat')
            ->where('status', 'terlambat')
            ->with(['borrower:id,name,class', 'items.equipment:id,name'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (Loan $loan) => $this->formatLoanRow($loan))
            ->values()
            ->all();

        $lowStock = Supply::query()
            ->where('status', 'active')
            ->whereNotNull('min_stock')
            ->whereColumn('available', '<=', 'min_stock')
            ->orderBy('available')
            ->limit(5)
            ->get()
            ->map(fn (Supply $item) => $this->formatInventarisRow($item, 'bahan'))
            ->values()
            ->all();

        return [
            'rows' => [],
            'stats' => [
                'period_label' => $periodLabel,
                'total_loans' => (clone $loanBase)->count(),
                'loans_alat' => (clone $loanBase)->where('item_type', 'alat')->count(),
                'loans_bahan' => (clone $loanBase)->where('item_type', 'bahan')->count(),
                'pending' => (clone $loanBase)->whereIn('status', ['diminta', 'antrian'])->count(),
                'approved' => (clone $loanBase)->where('status', 'disetujui')->count(),
                'active_borrows' => (clone $loanBase)->whereIn('status', ['dipinjam', 'terlambat'])->count(),
                'overdue' => (clone $loanBase)->where('status', 'terlambat')->count(),
                'returned' => (clone $loanBase)->where('status', 'dikembalikan')->count(),
                'rejected' => (clone $loanBase)->where('status', 'ditolak')->count(),
                'total_alat' => Equipment::alat()->count(),
                'total_bahan' => Supply::count(),
                'alat_available' => Equipment::alat()->sum('available'),
                'low_stock_bahan' => Supply::query()
                    ->where('status', 'active')
                    ->whereNotNull('min_stock')
                    ->whereColumn('available', '<=', 'min_stock')
                    ->count(),
                'schedules_period' => PracticumSchedule::query()
                    ->when($from, fn ($q) => $q->whereDate('tanggal', '>=', $from))
                    ->when($to, fn ($q) => $q->whereDate('tanggal', '<=', $to))
                    ->where('status', 'aktif')
                    ->count(),
                'collateral_held' => LoanCollateral::query()
                    ->whereIn('status', ['ditahan', 'menunggu_kompensasi'])
                    ->count(),
                'compensation_pending' => LoanCompensation::query()
                    ->where('required', true)
                    ->where('status', 'pending')
                    ->count(),
                'total_siswa' => User::where('role', 'siswa')->count(),
                'total_guru' => User::where('role', 'guru')->count(),
            ],
            'highlights' => [
                'overdue_loans' => $overdueLoans,
                'low_stock' => $lowStock,
            ],
        ];
    }

    private function loanQuery(array $filters)
    {
        [$from, $to] = $this->resolvePeriod($filters);

        return Loan::query()
            ->when($filters['status'] !== 'all', fn ($q) => $q->where('status', $filters['status']))
            ->when($filters['item_type'] !== 'all', fn ($q) => $q->where('item_type', $filters['item_type']))
            ->when($from, fn ($q) => $q->whereDate('request_date', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('request_date', '<=', $to));
    }

    private function resolvePeriod(array $filters): array
    {
        $from = $filters['date_from'] !== '' ? $filters['date_from'] : null;
        $to = $filters['date_to'] !== '' ? $filters['date_to'] : null;

        return [$from, $to];
    }

    private function formatInventarisRow(Equipment $item, string $itemType): array
    {
        return [
            'id' => $item->id,
            'code' => $item->code,
            'name' => $item->name,
            'category' => $item->category,
            'item_type' => $itemType,
            'item_type_label' => $itemType === 'alat' ? 'Alat' : 'Bahan',
            'stock' => $item->stock,
            'available' => $item->available,
            'borrowed' => max(0, $item->stock - $item->available),
            'unit' => $item->unit ?? ($itemType === 'alat' ? 'unit' : 'pcs'),
            'condition' => $item->condition,
            'condition_label' => $this->conditionLabel($item->condition),
            'location' => $item->location ?? '—',
            'status' => $item->status,
            'availability_label' => $item->availability_label,
            'stock_label' => $item->stock_label ?? '',
            'is_low_stock' => $item->is_low_stock,
            'min_stock' => $item->min_stock,
            'description' => $item->description,
        ];
    }

    private function formatLoanRow(Loan $loan): array
    {
        $items = $loan->relationLoaded('items')
            ? $loan->items->map(fn ($item) => [
                'equipment_name' => $item->equipment?->name,
                'equipment_code' => $item->equipment?->code,
                'quantity' => $item->quantity,
                'unit' => $item->equipment?->unit,
            ])->values()->all()
            : [];

        $itemsSummary = collect($items)
            ->map(fn ($i) => ($i['equipment_name'] ?? 'Item').' ×'.$i['quantity'])
            ->join(', ') ?: '—';

        $totalQty = (int) collect($items)->sum('quantity');

        return [
            'id' => $loan->id,
            'code' => $loan->code,
            'borrower_name' => $loan->borrower?->name ?? '—',
            'borrower_class' => $loan->borrower?->class ?? '—',
            'supervisor_name' => $loan->supervisor?->name ?? '—',
            'schedule_title' => $loan->schedule?->title,
            'items_summary' => $itemsSummary,
            'total_quantity' => $totalQty,
            'item_type' => $loan->item_type,
            'item_type_label' => $loan->item_type === 'alat' ? 'Alat' : 'Bahan',
            'status' => $loan->status,
            'borrow_scope' => $loan->borrow_scope,
            'borrow_scope_label' => $loan->borrow_scope === 'bawa_pulang' ? 'Bawa Pulang' : 'Pakai di Lab',
            'request_date_formatted' => $loan->request_date?->translatedFormat('d M Y') ?? '—',
            'borrowed_at_formatted' => $loan->borrowed_at?->translatedFormat('d M Y H:i') ?? '—',
            'due_at_formatted' => $loan->due_at?->translatedFormat('d M Y H:i') ?? '—',
            'returned_at_formatted' => $loan->returned_at?->translatedFormat('d M Y H:i') ?? '—',
            'purpose' => $loan->purpose,
            'notes' => $loan->notes,
            'collateral_status' => $loan->collateral?->status,
            'collateral_status_label' => $loan->collateral?->status
                ? (config('lab.collateral_statuses')[$loan->collateral->status] ?? $loan->collateral->status)
                : '—',
        ];
    }

    private function conditionLabel(?string $condition): string
    {
        return match ($condition) {
            'baik' => 'Baik',
            'rusak_ringan' => 'Rusak Ringan',
            'rusak_berat' => 'Rusak Berat',
            default => $condition ?? '—',
        };
    }
}
