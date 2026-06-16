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

        $class = $user->class;

        $upcomingSchedules = PracticumSchedule::query()
            ->when($class, fn ($q) => $q->where('kelas', $class))
            ->forStudentSelection(futureOnly: true)
            ->orderByHari()
            ->orderBy('jam_mulai')
            ->limit(5)
            ->get()
            ->map(fn (PracticumSchedule $schedule) => [
                'id' => $schedule->id,
                'title' => $schedule->title,
                'mata_kuliah' => $schedule->mata_kuliah,
                'kelas' => $schedule->kelas,
                'type' => $schedule->type,
                'jadwal_label' => $schedule->jadwalLabel(),
                'tanggal' => $schedule->tanggal?->format('Y-m-d'),
                'jamMulai' => substr((string) $schedule->jam_mulai, 0, 5),
                'jamSelesai' => substr((string) $schedule->jam_selesai, 0, 5),
                'ruangan' => $schedule->ruangan,
                'priority' => $schedule->priority,
            ])
            ->values()
            ->all();

        $compensationLoan = collect($loans)->first(
            fn ($loan) => ($loan['compensation']['status'] ?? null) === 'pending'
        );

        return [
            'loans' => $loans,
            'equipment' => $availableEquipment,
            'upcomingSchedules' => $upcomingSchedules,
            'hasPendingCompensation' => $compensationLoan !== null,
            'compensationLoanId' => $compensationLoan['id'] ?? null,
        ];
    }
}
