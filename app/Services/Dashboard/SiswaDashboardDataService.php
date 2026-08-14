<?php

namespace App\Services\Dashboard;

use App\Models\Equipment;
use App\Models\Loan;
use App\Models\PracticumSchedule;
use App\Models\User;
use App\Services\Dashboard\Concerns\FormatsDashboardLoan;
use App\Services\Loan\LoanWorkflowService;

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
                'inspection',
            ])
            ->latest()
            ->limit(30)
            ->get()
            ->map(fn (Loan $loan) => $this->formatDashboardLoan($loan))
            ->values()
            ->all();

        $inventoryQuery = Equipment::query()
            ->alat()
            ->where('status', 'tersedia');

        $tersediaCount = (clone $inventoryQuery)->where('available', '>', 0)->count();
        $sedangDipinjamCount = (clone $inventoryQuery)->where('available', '<=', 0)->count();
        $antreanAktifCount = Loan::query()
            ->where('borrower_id', $user->id)
            ->where('status', 'antrian')
            ->count();

        $availableEquipment = $inventoryQuery
            ->orderByDesc('available')
            ->orderBy('name')
            ->limit(8)
            ->get()
            ->map(function (Equipment $item) {
                $queueOpen = $item->available <= 0;

                return [
                    'id' => $item->id,
                    'code' => $item->code,
                    'name' => $item->name,
                    'category' => $item->category,
                    'itemType' => 'alat',
                    'stock' => $item->stock,
                    'available' => $item->available,
                    'condition_breakdown' => $item->condition_breakdown,
                    'image_url' => $item->image_url,
                    'location' => $item->location ?? '—',
                    'description' => $item->description,
                    'availability_label' => $item->availability_label,
                    'show_url' => route('siswa.equipment.show', $item),
                    'borrow_url' => route('siswa.loans.create', [
                        'type' => 'alat',
                        'equipment_id' => $item->id,
                    ]),
                    'can_borrow' => true,
                    'queue_open' => $queueOpen,
                    'cta_label' => $queueOpen ? 'Ajukan' : 'Pinjam',
                ];
            })
            ->values()
            ->all();

        $class = $user->class;
        $now = now();

        $todaySchedules = PracticumSchedule::query()
            ->when($class, fn ($q) => $q->where('kelas', $class))
            ->forStudentSelection(futureOnly: true)
            ->get()
            ->filter(fn (PracticumSchedule $schedule) => $schedule->matchesRequestDate($now))
            ->sortBy(fn (PracticumSchedule $schedule) => substr((string) $schedule->jam_mulai, 0, 5))
            ->map(function (PracticumSchedule $schedule) use ($now) {
                $endAt = $schedule->occurrenceEndAt($now);
                $isFinished = $endAt !== null && $endAt->lt($now);

                return [
                    'id' => $schedule->id,
                    'title' => $schedule->title,
                    'mata_kuliah' => $schedule->mata_kuliah,
                    'kelas' => $schedule->kelas,
                    'type' => $schedule->type,
                    'jadwal_label' => $schedule->jadwalLabel(),
                    'is_finished' => $isFinished,
                    'tanggal' => $schedule->tanggal?->format('Y-m-d'),
                    'jamMulai' => substr((string) $schedule->jam_mulai, 0, 5),
                    'jamSelesai' => substr((string) $schedule->jam_selesai, 0, 5),
                    'ruangan' => $schedule->ruangan,
                    'priority' => $schedule->priority,
                ];
            })
            ->values()
            ->all();

        $compensationLoan = collect($loans)->first(
            fn ($loan) => ($loan['compensation']['status'] ?? null) === 'pending'
        );

        return [
            'loans' => $loans,
            'equipment' => $availableEquipment,
            'inventorySummary' => [
                'tersedia' => $tersediaCount,
                'sedang_dipinjam' => $sedangDipinjamCount,
                'antrean_aktif' => $antreanAktifCount,
            ],
            'todaySchedules' => $todaySchedules,
            'hasPendingCompensation' => $compensationLoan !== null,
            'compensationLoanId' => $compensationLoan['id'] ?? null,
            'pendingCompensation' => $compensationLoan
                ? [
                    'loan_id' => $compensationLoan['id'],
                    'loan_code' => $compensationLoan['code'],
                    'damage_description' => $compensationLoan['inspection']['damage_description'] ?? null,
                    'student_instruction' => $compensationLoan['compensation']['description'] ?? null,
                    'has_collateral' => isset($compensationLoan['collateral']),
                ]
                : null,
        ];
    }
}
