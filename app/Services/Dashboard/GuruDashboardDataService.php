<?php

namespace App\Services\Dashboard;

use App\Models\Equipment;
use App\Models\Loan;
use App\Models\PracticumSchedule;
use App\Models\Submission;
use App\Models\User;
use App\Services\Dashboard\Concerns\FormatsDashboardLoan;
use Carbon\Carbon;

class GuruDashboardDataService
{
    use FormatsDashboardLoan;

    public function forUser(User $user): array
    {
        $supervised = Loan::query()->where('supervisor_id', $user->id);

        $activeAlat = (clone $supervised)
            ->where('item_type', 'alat')
            ->whereIn('status', ['dipinjam', 'terlambat'])
            ->count();

        $overdue = (clone $supervised)
            ->where('item_type', 'alat')
            ->where('status', 'terlambat')
            ->count();

        $recentLoans = (clone $supervised)
            ->with([
                'borrower:id,name,class',
                'items.equipment:id,name',
            ])
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn (Loan $loan) => $this->formatDashboardLoan($loan))
            ->values()
            ->all();

        $now = Carbon::now();
        $today = $now->toDateString();

        $weekStart = $now->copy()->startOfWeek(Carbon::MONDAY);
        $weekEnd = $weekStart->copy()->endOfWeek(Carbon::SUNDAY);

        $weekSchedules = PracticumSchedule::query()
            ->where('guru_id', $user->id)
            ->visibleInWeek($weekStart, $weekEnd)
            ->orderByHari()
            ->orderBy('jam_mulai')
            ->get();

        $todayScheduleModels = PracticumSchedule::query()
            ->where('guru_id', $user->id)
            ->orderBy('jam_mulai')
            ->get()
            ->filter(fn (PracticumSchedule $schedule) => $schedule->matchesRequestDate($now))
            ->sortBy(fn (PracticumSchedule $s) => substr((string) $s->jam_mulai, 0, 5))
            ->values();

        $todaySchedules = $todayScheduleModels
            ->map(fn (PracticumSchedule $schedule) => $this->formatSchedule($schedule, $now))
            ->values()
            ->all();

        $classes = $todayScheduleModels
            ->pluck('kelas')
            ->filter()
            ->unique()
            ->sort()
            ->values()
            ->all();

        $submissionCount = Submission::query()
            ->where('supervisor_id', $user->id)
            ->whereDate('request_date', $today)
            ->whereHas('loans', fn ($q) => $q->where('loan_type', 'praktikum'))
            ->count();

        $studentCount = $classes === []
            ? 0
            : User::query()
                ->where('role', 'siswa')
                ->where('status', 'active')
                ->whereIn('class', $classes)
                ->count();

        $praktikumToday = [
            'schedule_count' => $todayScheduleModels->count(),
            'class_count' => count($classes),
            'classes' => $classes,
            'submission_count' => $submissionCount,
            'student_count' => $studentCount,
        ];

        $inventorySummary = [
            'total_alat' => (int) Equipment::query()->alat()->count(),
            'sedang_dipinjam' => (int) Equipment::query()
                ->alat()
                ->selectRaw('COALESCE(SUM(GREATEST(qty_baik - available, 0)), 0) as total')
                ->value('total'),
            'rusak_ringan' => (int) Equipment::query()->alat()->sum('qty_rusak_ringan'),
            'rusak_berat' => (int) Equipment::query()->alat()->sum('qty_rusak_berat'),
            'bahan_menipis' => (int) Equipment::query()
                ->bahan()
                ->whereNotNull('min_stock')
                ->whereColumn('available', '<=', 'min_stock')
                ->count(),
        ];

        $equipment = Equipment::query()
            ->alat()
            ->where('status', 'tersedia')
            ->whereColumn('available', '<', 'qty_baik')
            ->orderBy('name')
            ->limit(5)
            ->get()
            ->map(fn (Equipment $item) => [
                'id' => $item->id,
                'code' => $item->code,
                'name' => $item->name,
                'category' => $item->category,
                'stock' => $item->stock,
                'qty_baik' => $item->qty_baik,
                'available' => $item->available,
                'borrowed' => max(0, $item->qty_baik - $item->available),
                'unit' => $item->unit ?? 'unit',
                'condition_breakdown' => $item->condition_breakdown,
                'image_url' => $item->image_url,
                'location' => $item->location ?? '—',
                'description' => $item->description,
                'status' => $item->status,
                'availability_label' => $item->availability_label,
            ])
            ->values()
            ->all();

        return [
            'loans' => $recentLoans,
            'equipment' => $equipment,
            'stats' => [
                'activeBorrows' => $activeAlat,
                'overdue' => $overdue,
            ],
            'praktikumToday' => $praktikumToday,
            'inventorySummary' => $inventorySummary,
            'todaySchedules' => $todaySchedules,
            'upcomingSchedules' => $todaySchedules,
            'weekScheduleCount' => $weekSchedules->count(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function formatSchedule(PracticumSchedule $schedule, Carbon $now): array
    {
        $endAt = $schedule->occurrenceEndAt($now);
        $isFinished = $endAt !== null && $endAt->lt($now);

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
            'tanggal_formatted' => $schedule->tanggal?->translatedFormat('d M Y'),
            'jam_mulai' => substr((string) $schedule->jam_mulai, 0, 5),
            'jam_selesai' => substr((string) $schedule->jam_selesai, 0, 5),
            'jamMulai' => substr((string) $schedule->jam_mulai, 0, 5),
            'jamSelesai' => substr((string) $schedule->jam_selesai, 0, 5),
            'ruangan' => $schedule->ruangan,
            'priority' => $schedule->priority,
            'is_finished' => $isFinished,
        ];
    }
}
