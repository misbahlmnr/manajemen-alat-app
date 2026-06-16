<?php

namespace App\Services\Dashboard;

use App\Models\Loan;
use App\Models\LoanCollateral;
use App\Models\PracticumSchedule;
use App\Models\Supply;
use App\Models\User;
use App\Services\Dashboard\Concerns\FormatsDashboardLoan;
use App\Services\Loan\LoanWorkflowService;
use Carbon\Carbon;

class AdminDashboardDataService
{
    use FormatsDashboardLoan;

    public function __construct(
        private LoanWorkflowService $workflow,
    ) {}

    public function forUser(User $user): array
    {
        $this->workflow->syncOverdue();

        $today = Carbon::today();
        $weekEnd = $today->copy()->addDays(7);

        $loans = Loan::query()
            ->with([
                'borrower:id,name,class',
                'items.equipment:id,name',
                'collateral:id,loan_id,status',
                'compensation',
            ])
            ->whereIn('status', ['diminta', 'antrian', 'disetujui', 'dipinjam', 'terlambat'])
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn (Loan $loan) => $this->formatDashboardLoan($loan))
            ->values()
            ->all();

        $lowStockSupplies = Supply::query()
            ->where('status', 'active')
            ->whereNotNull('min_stock')
            ->whereColumn('available', '<=', 'min_stock')
            ->orderBy('available')
            ->limit(12)
            ->get()
            ->map(fn (Supply $item) => [
                'id' => $item->id,
                'name' => $item->name,
                'code' => $item->code,
                'itemType' => 'bahan',
                'stock' => $item->stock,
                'available' => $item->available,
                'stockRemaining' => $item->available,
                'minStock' => $item->min_stock,
                'unit' => $item->unit ?? 'pcs',
            ])
            ->values()
            ->all();

        $stats = [
            'pendingAlat' => Loan::query()
                ->where('item_type', 'alat')
                ->where('status', 'diminta')
                ->count(),
            'queueAlat' => Loan::query()
                ->where('item_type', 'alat')
                ->where('status', 'antrian')
                ->count(),
            'activeSchedulesWeek' => PracticumSchedule::query()
                ->visibleInWeek($today->copy()->startOfWeek(Carbon::MONDAY), $weekEnd)
                ->count(),
            'heldCards' => LoanCollateral::query()
                ->whereIn('status', ['ditahan', 'menunggu_kompensasi'])
                ->count(),
            'alatDipinjam' => Loan::query()
                ->where('item_type', 'alat')
                ->whereIn('status', ['dipinjam', 'terlambat'])
                ->count(),
            'overdue' => Loan::query()
                ->where('item_type', 'alat')
                ->where('status', 'terlambat')
                ->count(),
            'lowStockBahan' => count($lowStockSupplies),
        ];

        return [
            'loans' => $loans,
            'equipment' => $lowStockSupplies,
            'stats' => $stats,
        ];
    }
}
