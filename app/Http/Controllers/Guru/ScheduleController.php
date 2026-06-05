<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Concerns\FormatsPracticumSchedule;
use App\Http\Controllers\Controller;
use App\Models\PracticumSchedule;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    use FormatsPracticumSchedule;

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', PracticumSchedule::class);

        $user = $request->user();
        $search = $request->string('search')->trim();
        $status = $request->string('status')->toString() ?: 'all';
        $kelas = $request->string('kelas')->toString() ?: 'all';
        $mataKuliah = $request->string('mata_kuliah')->toString() ?: 'all';
        $dateFrom = $request->string('date_from')->toString();
        $dateTo = $request->string('date_to')->toString();

        $baseQuery = PracticumSchedule::query()->where('guru_id', $user->id);

        $schedules = (clone $baseQuery)
            ->with('guru:id,name')
            ->when($search->isNotEmpty(), function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                        ->orWhere('mata_kuliah', 'like', "%{$search}%")
                        ->orWhere('kelas', 'like', "%{$search}%")
                        ->orWhere('ruangan', 'like', "%{$search}%");
                });
            })
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->when($kelas !== 'all', fn ($q) => $q->where('kelas', $kelas))
            ->when($mataKuliah !== 'all', fn ($q) => $q->where('mata_kuliah', $mataKuliah))
            ->when($dateFrom !== '', fn ($q) => $q->whereDate('tanggal', '>=', $dateFrom))
            ->when($dateTo !== '', fn ($q) => $q->whereDate('tanggal', '<=', $dateTo))
            ->orderByDesc('tanggal')
            ->orderBy('jam_mulai')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (PracticumSchedule $item) => $this->formatSchedule($item));

        $weekStart = Carbon::now()->startOfWeek(Carbon::MONDAY);
        $weekEnd = $weekStart->copy()->endOfWeek(Carbon::SUNDAY);

        $weekSchedules = (clone $baseQuery)
            ->with('guru:id,name')
            ->whereBetween('tanggal', [$weekStart->toDateString(), $weekEnd->toDateString()])
            ->whereIn('status', ['aktif', 'draft'])
            ->orderBy('tanggal')
            ->orderBy('jam_mulai')
            ->get()
            ->map(fn (PracticumSchedule $item) => $this->formatSchedule($item));

        $subjectOptions = (clone $baseQuery)
            ->select('mata_kuliah')
            ->distinct()
            ->orderBy('mata_kuliah')
            ->pluck('mata_kuliah');

        return Inertia::render('Guru/Schedule/Index', [
            'schedules' => $schedules,
            'weekSchedules' => $weekSchedules,
            'filters' => [
                'search' => $search->toString(),
                'status' => $status,
                'kelas' => $kelas,
                'mata_kuliah' => $mataKuliah,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'kelasOptions' => config('lab.class_options'),
            'subjectOptions' => $subjectOptions,
        ]);
    }

    public function show(PracticumSchedule $schedule): Response
    {
        $this->authorize('view', $schedule);

        $schedule->load(['guru:id,name,nip', 'equipment:id,code,name,available']);

        return Inertia::render('Guru/Schedule/Show', [
            'schedule' => $this->formatSchedule($schedule, true),
        ]);
    }
}
