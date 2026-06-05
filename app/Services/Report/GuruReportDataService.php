<?php

namespace App\Services\Report;

use App\Models\Equipment;
use App\Models\Loan;
use App\Models\LoanCompensation;
use App\Models\PracticumSchedule;
use App\Models\Supply;
use App\Models\User;
use App\Services\Loan\LoanWorkflowService;
use App\Services\Report\Concerns\FormatsReportData;
use Carbon\Carbon;
use Illuminate\Http\Request;

class GuruReportDataService
{
    use FormatsReportData;

    public function __construct(
        private LoanWorkflowService $workflow,
    ) {}

    public function forRequest(Request $request): array
    {
        $this->workflow->syncOverdue();

        $user = $request->user();
        $type = $request->string('type')->toString() ?: 'ringkasan';
        $filters = [
            'type' => $type,
            'item_type' => $request->string('item_type')->toString() ?: 'all',
            'status' => $request->string('status')->toString() ?: 'all',
            'date_from' => $request->string('date_from')->toString(),
            'date_to' => $request->string('date_to')->toString(),
        ];

        $payload = match ($type) {
            'inventaris' => $this->buildInventarisReport($filters),
            'peminjaman' => $this->peminjamanReport($user, $filters),
            default => $this->ringkasanReport($user, $filters),
        };

        return [
            ...$payload,
            'reportType' => $type,
            'filters' => $filters,
            'meta' => [
                'school_name' => config('lab.school_name'),
                'lab_name' => config('lab.lab_name'),
                'report_scope' => 'guru',
                'guru_name' => $user->name,
                'generated_at' => now()->translatedFormat('d F Y H:i'),
                'generated_at_short' => now()->format('Y-m-d'),
            ],
            'statusOptions' => config('lab.loan_statuses'),
            'showUsersTab' => false,
        ];
    }

    private function supervisedLoanQuery(User $user, array $filters)
    {
        [$from, $to] = $this->resolvePeriod($filters);

        return Loan::query()
            ->where('supervisor_id', $user->id)
            ->when($filters['status'] !== 'all', fn ($q) => $q->where('status', $filters['status']))
            ->when($filters['item_type'] !== 'all', fn ($q) => $q->where('item_type', $filters['item_type']))
            ->when($from, fn ($q) => $q->whereDate('request_date', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('request_date', '<=', $to));
    }

    private function peminjamanReport(User $user, array $filters): array
    {
        $rows = $this->supervisedLoanQuery($user, $filters)
            ->with([
                'borrower:id,name,class',
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

    private function ringkasanReport(User $user, array $filters): array
    {
        [$from, $to] = $this->resolvePeriod($filters);

        $loanBase = Loan::query()
            ->where('supervisor_id', $user->id)
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

        $siswaBimbingan = (clone $loanBase)->distinct('borrower_id')->count('borrower_id');

        $compensationPending = LoanCompensation::query()
            ->where('required', true)
            ->where('status', 'pending')
            ->whereHas('loan', fn ($q) => $q->where('supervisor_id', $user->id))
            ->count();

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
                    ->where('guru_id', $user->id)
                    ->when($from, fn ($q) => $q->whereDate('tanggal', '>=', $from))
                    ->when($to, fn ($q) => $q->whereDate('tanggal', '<=', $to))
                    ->whereIn('status', ['aktif', 'draft', 'selesai'])
                    ->count(),
                'siswa_bimbingan' => $siswaBimbingan,
                'compensation_pending' => $compensationPending,
                'bahan_diambil' => (clone $loanBase)
                    ->where('item_type', 'bahan')
                    ->where('status', 'dipinjam')
                    ->count(),
            ],
            'highlights' => [
                'overdue_loans' => $overdueLoans,
                'low_stock' => $lowStock,
            ],
        ];
    }
}
