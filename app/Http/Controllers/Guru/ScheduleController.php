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
        $type = $request->string('type')->toString() ?: 'all';
        $kelas = $request->string('kelas')->toString() ?: 'all';
        $mataKuliah = $request->string('mata_kuliah')->toString() ?: 'all';
        $hari = $request->string('hari')->toString() ?: 'all';

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
            ->when($type !== 'all', fn ($q) => $q->where('type', $type))
            ->when($kelas !== 'all', fn ($q) => $q->where('kelas', $kelas))
            ->when($mataKuliah !== 'all', fn ($q) => $q->where('mata_kuliah', $mataKuliah))
            ->when($hari !== 'all', fn ($q) => $q->where('hari', $hari))
            ->orderByHari()
            ->orderBy('jam_mulai')
            ->orderByDesc('tanggal')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (PracticumSchedule $item) => $this->formatSchedule($item));

        $weekStart = Carbon::now()->startOfWeek(Carbon::MONDAY);
        $weekEnd = $weekStart->copy()->endOfWeek(Carbon::SUNDAY);

        $weekSchedules = (clone $baseQuery)
            ->with('guru:id,name')
            ->visibleInWeek($weekStart, $weekEnd)
            ->orderByHari()
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
                'type' => $type,
                'kelas' => $kelas,
                'mata_kuliah' => $mataKuliah,
                'hari' => $hari,
            ],
            'kelasOptions' => config('lab.class_options'),
            'subjectOptions' => $subjectOptions,
            'dayOptions' => config('lab.schedule_days'),
            'typeOptions' => config('lab.schedule_types'),
        ]);
    }

    public function show(PracticumSchedule $schedule): Response
    {
        $this->authorize('view', $schedule);

        $schedule->load(['guru:id,name,nip']);

        return Inertia::render('Guru/Schedule/Show', [
            'schedule' => $this->formatSchedule($schedule),
        ]);
    }
}
