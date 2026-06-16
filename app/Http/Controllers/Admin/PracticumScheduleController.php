<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePracticumScheduleRequest;
use App\Http\Requests\Admin\UpdatePracticumScheduleRequest;
use App\Models\PracticumSchedule;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PracticumScheduleController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', PracticumSchedule::class);

        $search = $request->string('search')->trim();
        $type = $request->string('type')->toString() ?: 'all';
        $kelas = $request->string('kelas')->toString() ?: 'all';
        $guruId = $request->string('guru_id')->toString() ?: 'all';
        $mataKuliah = $request->string('mata_kuliah')->toString() ?: 'all';
        $hari = $request->string('hari')->toString() ?: 'all';

        $schedules = PracticumSchedule::query()
            ->with('guru:id,name')
            ->when($search->isNotEmpty(), function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                        ->orWhere('mata_kuliah', 'like', "%{$search}%")
                        ->orWhere('kelas', 'like', "%{$search}%")
                        ->orWhere('ruangan', 'like', "%{$search}%")
                        ->orWhere('notes', 'like', "%{$search}%")
                        ->orWhereHas('guru', fn ($g) => $g->where('name', 'like', "%{$search}%"));
                });
            })
            ->when($type !== 'all', fn ($q) => $q->where('type', $type))
            ->when($kelas !== 'all', fn ($q) => $q->where('kelas', $kelas))
            ->when($guruId !== 'all', fn ($q) => $q->where('guru_id', $guruId))
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

        $weekSchedules = PracticumSchedule::query()
            ->with('guru:id,name')
            ->visibleInWeek($weekStart, $weekEnd)
            ->orderByHari()
            ->orderBy('jam_mulai')
            ->get()
            ->map(fn (PracticumSchedule $item) => $this->formatSchedule($item));

        return Inertia::render('Admin/Schedule/Index', [
            'schedules' => $schedules,
            'weekSchedules' => $weekSchedules,
            'filters' => [
                'search' => $search->toString(),
                'type' => $type,
                'kelas' => $kelas,
                'guru_id' => $guruId,
                'mata_kuliah' => $mataKuliah,
                'hari' => $hari,
            ],
            'guruOptions' => $this->guruOptions(),
            'kelasOptions' => config('lab.class_options'),
            'subjectOptions' => config('lab.practicum_subjects'),
            'dayOptions' => config('lab.schedule_days'),
            'typeOptions' => config('lab.schedule_types'),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', PracticumSchedule::class);

        return Inertia::render('Admin/Schedule/Create', [
            'guruOptions' => $this->guruOptions(),
            'kelasOptions' => config('lab.class_options'),
            'subjectOptions' => config('lab.practicum_subjects'),
            'dayOptions' => config('lab.schedule_days'),
            'typeOptions' => config('lab.schedule_types'),
        ]);
    }

    public function store(StorePracticumScheduleRequest $request): RedirectResponse
    {
        PracticumSchedule::create([
            ...$request->validated(),
            'code' => PracticumSchedule::generateCode(),
            'jurusan' => config('lab.jurusan_default'),
        ]);

        return redirect()
            ->route('admin.schedules.index')
            ->with('success', 'Jadwal praktikum berhasil ditambahkan.');
    }

    public function show(PracticumSchedule $schedule): Response
    {
        $this->authorize('view', $schedule);

        $schedule->load('guru:id,name,nip');

        return Inertia::render('Admin/Schedule/Show', [
            'schedule' => $this->formatSchedule($schedule),
        ]);
    }

    public function edit(PracticumSchedule $schedule): Response
    {
        $this->authorize('update', $schedule);

        return Inertia::render('Admin/Schedule/Edit', [
            'schedule' => $this->formatSchedule($schedule),
            'guruOptions' => $this->guruOptions(),
            'kelasOptions' => config('lab.class_options'),
            'subjectOptions' => config('lab.practicum_subjects'),
            'dayOptions' => config('lab.schedule_days'),
            'typeOptions' => config('lab.schedule_types'),
        ]);
    }

    public function update(UpdatePracticumScheduleRequest $request, PracticumSchedule $schedule): RedirectResponse
    {
        $schedule->update([
            ...$request->validated(),
            'jurusan' => config('lab.jurusan_default'),
        ]);

        return redirect()
            ->route('admin.schedules.show', $schedule)
            ->with('success', 'Jadwal praktikum berhasil diperbarui.');
    }

    public function destroy(PracticumSchedule $schedule): RedirectResponse
    {
        $this->authorize('delete', $schedule);

        $schedule->delete();

        return redirect()
            ->route('admin.schedules.index')
            ->with('success', 'Jadwal praktikum berhasil dihapus.');
    }

    private function guruOptions(): array
    {
        return User::query()
            ->where('role', 'guru')
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
            ])
            ->values()
            ->all();
    }

    private function formatSchedule(PracticumSchedule $schedule): array
    {
        $jamMulai = $this->formatTimeForDisplay($schedule->jam_mulai);
        $jamSelesai = $this->formatTimeForDisplay($schedule->jam_selesai);

        return [
            'id' => $schedule->id,
            'code' => $schedule->code,
            'title' => $schedule->title,
            'mata_kuliah' => $schedule->mata_kuliah,
            'jurusan' => $schedule->jurusan,
            'kelas' => $schedule->kelas,
            'type' => $schedule->type,
            'type_label' => config("lab.schedule_types.{$schedule->type}"),
            'hari' => $schedule->hari,
            'hari_label' => $schedule->hariLabel(),
            'tanggal' => $schedule->tanggal?->format('Y-m-d'),
            'tanggal_formatted' => $schedule->tanggal?->translatedFormat('d M Y'),
            'jadwal_label' => $schedule->jadwalLabel(),
            'jam_mulai' => $jamMulai,
            'jam_selesai' => $jamSelesai,
            'waktu_label' => "{$jamMulai} – {$jamSelesai}",
            'ruangan' => $schedule->ruangan,
            'guru_id' => $schedule->guru_id,
            'guru_name' => $schedule->guru?->name,
            'priority' => $schedule->priority,
            'notes' => $schedule->notes,
            'created_at_formatted' => $schedule->created_at?->translatedFormat('d M Y'),
            'updated_at_formatted' => $schedule->updated_at?->translatedFormat('d M Y H:i'),
        ];
    }

    private function formatTimeForDisplay(?string $time): string
    {
        if (! $time) {
            return '';
        }

        return substr($time, 0, 5);
    }
}
