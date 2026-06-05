<?php

namespace App\Services\Dashboard;

use App\Models\Equipment;
use App\Models\Loan;
use App\Models\PracticumSchedule;
use App\Models\User;
use Carbon\Carbon;

class GuruDashboardDataService
{
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

        $bahanThisWeek = (clone $supervised)
            ->where('item_type', 'bahan')
            ->where('status', 'dipinjam')
            ->where('borrowed_at', '>=', Carbon::now()->subDays(7))
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

        $weekStart = Carbon::now()->startOfWeek(Carbon::MONDAY);
        $weekEnd = $weekStart->copy()->endOfWeek(Carbon::SUNDAY);

        $upcomingSchedules = PracticumSchedule::query()
            ->where('guru_id', $user->id)
            ->whereBetween('tanggal', [$weekStart->toDateString(), $weekEnd->toDateString()])
            ->whereIn('status', ['aktif', 'draft'])
            ->orderBy('tanggal')
            ->orderBy('jam_mulai')
            ->get()
            ->map(fn (PracticumSchedule $schedule) => [
                'id' => $schedule->id,
                'code' => $schedule->code,
                'title' => $schedule->title,
                'mata_kuliah' => $schedule->mata_kuliah,
                'kelas' => $schedule->kelas,
                'tanggal' => $schedule->tanggal?->format('Y-m-d'),
                'tanggal_formatted' => $schedule->tanggal?->translatedFormat('d M Y'),
                'jam_mulai' => substr((string) $schedule->jam_mulai, 0, 5),
                'jam_selesai' => substr((string) $schedule->jam_selesai, 0, 5),
                'jamMulai' => substr((string) $schedule->jam_mulai, 0, 5),
                'jamSelesai' => substr((string) $schedule->jam_selesai, 0, 5),
                'ruangan' => $schedule->ruangan,
                'priority' => $schedule->priority,
                'display_status' => $schedule->resolveDisplayStatus(),
            ])
            ->values()
            ->all();

        $equipment = Equipment::query()
            ->alat()
            ->where('status', 'active')
            ->whereColumn('available', '<', 'stock')
            ->orderBy('name')
            ->limit(6)
            ->get()
            ->map(fn (Equipment $item) => [
                'id' => $item->id,
                'code' => $item->code,
                'name' => $item->name,
                'category' => $item->category,
                'stock' => $item->stock,
                'available' => $item->available,
                'borrowed' => max(0, $item->stock - $item->available),
                'condition' => $item->condition,
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
                'bahanThisWeek' => $bahanThisWeek,
            ],
            'upcomingSchedules' => $upcomingSchedules,
            'notifications' => [],
        ];
    }

    private function formatDashboardLoan(Loan $loan): array
    {
        $itemsSummary = $loan->relationLoaded('items')
            ? $loan->items
                ->map(fn ($item) => ($item->equipment?->name ?? 'Item').' ×'.$item->quantity)
                ->join(', ')
            : '—';

        $firstItem = $loan->relationLoaded('items') ? $loan->items->first() : null;
        $totalQty = $loan->relationLoaded('items')
            ? (int) $loan->items->sum('quantity')
            : 0;

        return [
            'id' => $loan->id,
            'code' => $loan->code,
            'borrower_name' => $loan->borrower?->name,
            'borrower_class' => $loan->borrower?->class,
            'borrowerName' => $loan->borrower?->name,
            'borrowerClass' => $loan->borrower?->class,
            'item_type' => $loan->item_type,
            'items_summary' => $itemsSummary,
            'equipmentName' => $firstItem?->equipment?->name ?? $itemsSummary,
            'quantity' => $totalQty,
            'status' => $loan->status,
            'request_date' => $loan->request_date?->format('Y-m-d'),
            'request_date_formatted' => $loan->request_date?->translatedFormat('d M Y'),
            'borrowed_at' => $loan->borrowed_at?->format('Y-m-d'),
            'borrowDate' => $loan->borrowed_at?->format('Y-m-d') ?? $loan->request_date?->format('Y-m-d'),
            'due_at' => $loan->due_at?->format('Y-m-d'),
            'dueDate' => $loan->due_at?->format('Y-m-d'),
            'due_at_formatted' => $loan->due_at?->translatedFormat('d M Y H:i') ?: '—',
        ];
    }
}
