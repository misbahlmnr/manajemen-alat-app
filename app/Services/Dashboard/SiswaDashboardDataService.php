<?php

namespace App\Services\Dashboard;

use App\Models\Equipment;
use App\Models\Loan;
use App\Models\PracticumSchedule;
use App\Models\User;
use App\Services\Dashboard\Concerns\FormatsDashboardLoan;
use App\Services\Loan\LoanWorkflowService;
use Carbon\Carbon;

class SiswaDashboardDataService
{
    use FormatsDashboardLoan;

    public function __construct(
        private LoanWorkflowService $workflow,
    ) {}

    public function forUser(User $user): array
    {
        $this->workflow->syncOverdue();

        $loans = Loan::query()
            ->where('borrower_id', $user->id)
            ->with([
                'borrower:id,name,class',
                'items.equipment:id,name,category,unit',
                'collateral:id,loan_id,status',
                'compensation',
            ])
            ->latest()
            ->limit(30)
            ->get()
            ->map(fn (Loan $loan) => $this->formatDashboardLoan($loan))
            ->values()
            ->all();

        $availableEquipment = Equipment::query()
            ->alat()
            ->where('status', 'active')
            ->where('available', '>', 0)
            ->where('condition', '!=', 'rusak_berat')
            ->orderByDesc('available')
            ->limit(8)
            ->get()
            ->map(fn (Equipment $item) => [
                'id' => $item->id,
                'code' => $item->code,
                'name' => $item->name,
                'category' => $item->category,
                'itemType' => 'alat',
                'stock' => $item->stock,
                'available' => $item->available,
                'condition' => $item->condition,
                'location' => $item->location ?? '—',
                'description' => $item->description,
                'availability_label' => $item->availability_label,
                'show_url' => route('siswa.equipment.show', $item),
                'borrow_url' => route('siswa.loans.create', [
                    'type' => 'alat',
                    'equipment_id' => $item->id,
                ]),
                'can_borrow' => true,
            ])
            ->values()
            ->all();

        $today = Carbon::today()->toDateString();
        $class = $user->class;

        $upcomingSchedules = PracticumSchedule::query()
            ->when($class, fn ($q) => $q->where('kelas', $class))
            ->where('status', 'aktif')
            ->whereDate('tanggal', '>=', $today)
            ->orderBy('tanggal')
            ->orderBy('jam_mulai')
            ->limit(5)
            ->get()
            ->map(fn (PracticumSchedule $schedule) => [
                'id' => $schedule->id,
                'title' => $schedule->title,
                'mata_kuliah' => $schedule->mata_kuliah,
                'kelas' => $schedule->kelas,
                'tanggal' => $schedule->tanggal?->format('Y-m-d'),
                'jamMulai' => substr((string) $schedule->jam_mulai, 0, 5),
                'jamSelesai' => substr((string) $schedule->jam_selesai, 0, 5),
                'ruangan' => $schedule->ruangan,
                'priority' => $schedule->priority,
            ])
            ->values()
            ->all();

        $notifications = $this->buildNotifications($user, $loans);
        $compensationLoan = collect($loans)->first(
            fn ($loan) => ($loan['compensation']['status'] ?? null) === 'pending'
        );

        return [
            'loans' => $loans,
            'equipment' => $availableEquipment,
            'upcomingSchedules' => $upcomingSchedules,
            'notifications' => $notifications,
            'unreadNotifications' => collect($notifications)->where('read', false)->count(),
            'hasPendingCompensation' => $compensationLoan !== null,
            'compensationLoanId' => $compensationLoan['id'] ?? null,
        ];
    }

    private function buildNotifications(User $user, array $loans): array
    {
        $notifications = [];
        $userId = (string) $user->id;

        foreach ($loans as $loan) {
            $label = $loan['equipmentName'] ?? $loan['code'];

            if ($loan['status'] === 'terlambat') {
                $notifications[] = [
                    'id' => "overdue-{$loan['id']}",
                    'userId' => $userId,
                    'title' => 'Peminjaman Terlambat',
                    'message' => "{$label} sudah melewati batas pengembalian. Segera ajukan pengembalian.",
                    'type' => 'error',
                    'read' => false,
                ];
            }

            if (($loan['compensation']['status'] ?? null) === 'pending') {
                $notifications[] = [
                    'id' => "compensation-{$loan['id']}",
                    'userId' => $userId,
                    'title' => 'Kompensasi Pending',
                    'message' => "Selesaikan kompensasi untuk {$label} agar kartu pelajar dapat diambil.",
                    'type' => 'warning',
                    'read' => false,
                ];
            }

            if (in_array($loan['status'], ['diminta', 'antrian'], true)) {
                $notifications[] = [
                    'id' => "pending-{$loan['id']}",
                    'userId' => $userId,
                    'title' => 'Pengajuan Menunggu',
                    'message' => "Pengajuan {$label} sedang menunggu persetujuan admin.",
                    'type' => 'info',
                    'read' => false,
                ];
            }

            if ($loan['status'] === 'disetujui') {
                $notifications[] = [
                    'id' => "approved-{$loan['id']}",
                    'userId' => $userId,
                    'title' => 'Pengajuan Disetujui',
                    'message' => "{$label} telah disetujui. Silakan ambil di laboratorium.",
                    'type' => 'success',
                    'read' => false,
                ];
            }
        }

        return array_slice($notifications, 0, 8);
    }
}
