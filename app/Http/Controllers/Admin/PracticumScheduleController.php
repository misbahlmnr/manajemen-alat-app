<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePracticumScheduleRequest;
use App\Http\Requests\Admin\UpdatePracticumScheduleRequest;
use App\Models\Equipment;
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
        $status = $request->string('status')->toString() ?: 'all';
        $kelas = $request->string('kelas')->toString() ?: 'all';
        $guruId = $request->string('guru_id')->toString() ?: 'all';
        $mataKuliah = $request->string('mata_kuliah')->toString() ?: 'all';
        $dateFrom = $request->string('date_from')->toString();
        $dateTo = $request->string('date_to')->toString();

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
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->when($kelas !== 'all', fn ($q) => $q->where('kelas', $kelas))
            ->when($guruId !== 'all', fn ($q) => $q->where('guru_id', $guruId))
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

        $weekSchedules = PracticumSchedule::query()
            ->with('guru:id,name')
            ->whereBetween('tanggal', [$weekStart->toDateString(), $weekEnd->toDateString()])
            ->whereIn('status', ['aktif', 'draft'])
            ->orderBy('tanggal')
            ->orderBy('jam_mulai')
            ->get()
            ->map(fn (PracticumSchedule $item) => $this->formatSchedule($item));

        return Inertia::render('Admin/Schedule/Index', [
            'schedules' => $schedules,
            'weekSchedules' => $weekSchedules,
            'filters' => [
                'search' => $search->toString(),
                'status' => $status,
                'kelas' => $kelas,
                'guru_id' => $guruId,
                'mata_kuliah' => $mataKuliah,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'guruOptions' => $this->guruOptions(),
            'kelasOptions' => config('lab.class_options'),
            'subjectOptions' => config('lab.practicum_subjects'),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', PracticumSchedule::class);

        return Inertia::render('Admin/Schedule/Create', [
            'guruOptions' => $this->guruOptions(),
            'kelasOptions' => config('lab.class_options'),
            'subjectOptions' => config('lab.practicum_subjects'),
            'equipmentOptions' => $this->equipmentOptions(),
        ]);
    }

    public function store(StorePracticumScheduleRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $equipment = $validated['required_equipment'] ?? [];
        unset($validated['required_equipment']);

        $schedule = PracticumSchedule::create([
            ...$validated,
            'code' => PracticumSchedule::generateCode(),
            'jurusan' => config('lab.jurusan_default'),
        ]);

        $this->syncEquipment($schedule, $equipment);

        return redirect()
            ->route('admin.schedules.index')
            ->with('success', 'Jadwal praktikum berhasil ditambahkan.');
    }

    public function show(PracticumSchedule $schedule): Response
    {
        $this->authorize('view', $schedule);

        $schedule->load(['guru:id,name,nip', 'equipment']);

        return Inertia::render('Admin/Schedule/Show', [
            'schedule' => $this->formatSchedule($schedule, true),
        ]);
    }

    public function edit(PracticumSchedule $schedule): Response
    {
        $this->authorize('update', $schedule);

        $schedule->load('equipment');

        return Inertia::render('Admin/Schedule/Edit', [
            'schedule' => $this->formatSchedule($schedule, true),
            'guruOptions' => $this->guruOptions(),
            'kelasOptions' => config('lab.class_options'),
            'subjectOptions' => config('lab.practicum_subjects'),
            'equipmentOptions' => $this->equipmentOptions(),
        ]);
    }

    public function update(UpdatePracticumScheduleRequest $request, PracticumSchedule $schedule): RedirectResponse
    {
        $validated = $request->validated();
        $equipment = $validated['required_equipment'] ?? [];
        unset($validated['required_equipment']);

        $schedule->update([
            ...$validated,
            'jurusan' => config('lab.jurusan_default'),
        ]);
        $this->syncEquipment($schedule, $equipment);

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

    private function syncEquipment(PracticumSchedule $schedule, array $rows): void
    {
        $sync = [];
        foreach ($rows as $row) {
            $sync[$row['equipment_id']] = ['quantity' => (int) $row['quantity']];
        }

        $schedule->equipment()->sync($sync);
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

    private function equipmentOptions(): array
    {
        return Equipment::query()
            ->alat()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'available'])
            ->map(fn (Equipment $item) => [
                'id' => $item->id,
                'label' => "{$item->code} — {$item->name} (tersedia: {$item->available})",
            ])
            ->values()
            ->all();
    }

    private function formatSchedule(PracticumSchedule $schedule, bool $detailed = false): array
    {
        $jamMulai = $this->formatTimeForDisplay($schedule->jam_mulai);
        $jamSelesai = $this->formatTimeForDisplay($schedule->jam_selesai);

        $data = [
            'id' => $schedule->id,
            'code' => $schedule->code,
            'title' => $schedule->title,
            'mata_kuliah' => $schedule->mata_kuliah,
            'jurusan' => $schedule->jurusan,
            'kelas' => $schedule->kelas,
            'tanggal' => $schedule->tanggal?->format('Y-m-d'),
            'tanggal_formatted' => $schedule->tanggal?->translatedFormat('d M Y'),
            'jam_mulai' => $jamMulai,
            'jam_selesai' => $jamSelesai,
            'waktu_label' => "{$jamMulai} – {$jamSelesai}",
            'ruangan' => $schedule->ruangan,
            'guru_id' => $schedule->guru_id,
            'guru_name' => $schedule->guru?->name,
            'priority' => $schedule->priority,
            'status' => $schedule->status,
            'display_status' => $schedule->resolveDisplayStatus(),
            'notes' => $schedule->notes,
            'created_at_formatted' => $schedule->created_at?->translatedFormat('d M Y'),
            'updated_at_formatted' => $schedule->updated_at?->translatedFormat('d M Y H:i'),
        ];

        if ($detailed) {
            $data['required_equipment'] = $schedule->relationLoaded('equipment')
                ? $schedule->equipment->map(fn (Equipment $item) => [
                    'equipment_id' => $item->id,
                    'equipment_name' => $item->name,
                    'equipment_code' => $item->code,
                    'quantity' => $item->pivot->quantity,
                ])->values()->all()
                : [];
        }

        return $data;
    }

    private function formatTimeForDisplay(?string $time): string
    {
        if (! $time) {
            return '';
        }

        return substr($time, 0, 5);
    }
}
