<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePracticumScheduleRequest;
use App\Http\Requests\Admin\UpdatePracticumScheduleRequest;
use App\Models\Equipment;
use App\Models\PracticumSchedule;
use App\Models\User;
use App\Services\Loan\LombaEventLoanService;
use App\Support\ClassOptions;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PracticumScheduleController extends Controller
{
    public function __construct(
        private LombaEventLoanService $lombaEvents,
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', PracticumSchedule::class);

        $search = $request->string('search')->trim();
        $type = $request->string('type')->toString() ?: 'all';
        $kind = $request->string('schedule_kind')->toString() ?: 'all';
        $kelas = $request->string('kelas')->toString() ?: 'all';
        $guruId = $request->string('guru_id')->toString() ?: 'all';
        $mataKuliah = $request->string('mata_kuliah')->toString() ?: 'all';
        $hari = $request->string('hari')->toString() ?: 'all';

        $schedules = PracticumSchedule::query()
            ->with(['guru:id,name', 'penanggungJawab:id,name,class'])
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
            ->when($kind !== 'all', fn ($q) => $q->where('schedule_kind', $kind))
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
                'schedule_kind' => $kind,
                'kelas' => $kelas,
                'guru_id' => $guruId,
                'mata_kuliah' => $mataKuliah,
                'hari' => $hari,
            ],
            'guruOptions' => $this->guruOptions(),
            'kelasOptions' => ClassOptions::names(),
            'subjectOptions' => config('lab.practicum_subjects'),
            'dayOptions' => config('lab.schedule_days'),
            'typeOptions' => config('lab.schedule_types'),
            'kindOptions' => config('lab.schedule_kinds'),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', PracticumSchedule::class);

        return Inertia::render('Admin/Schedule/Create', $this->formPayload());
    }

    public function store(StorePracticumScheduleRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $items = $validated['items'] ?? [];
        $participantIds = $validated['participant_ids'] ?? [];
        unset($validated['items'], $validated['participant_ids']);

        $schedule = DB::transaction(function () use ($validated, $items, $participantIds, $request) {
            $schedule = PracticumSchedule::create([
                ...$validated,
                'code' => PracticumSchedule::generateCode(),
                'jurusan' => config('lab.jurusan_default'),
                'schedule_kind' => $validated['schedule_kind'] ?? 'praktikum',
            ]);

            if ($schedule->isLombaEvent()) {
                $this->lombaEvents->syncEquipmentAndParticipants($schedule, $items, $participantIds);
                $this->lombaEvents->createLoanForEvent($schedule->fresh(), $request->user());
            }

            return $schedule;
        });

        return redirect()
            ->route('admin.schedules.show', $schedule)
            ->with('success', $schedule->isLombaEvent()
                ? 'Event lomba berhasil dibuat beserta pengajuan Ketua Tim.'
                : 'Jadwal praktikum berhasil ditambahkan.');
    }

    public function show(PracticumSchedule $schedule): Response
    {
        $this->authorize('view', $schedule);

        $schedule->load([
            'guru:id,name,nip',
            'penanggungJawab:id,name,class',
            'participants:id,name,class',
            'equipmentItems:id,code,name',
        ]);

        return Inertia::render('Admin/Schedule/Show', [
            'schedule' => $this->formatSchedule($schedule, detailed: true),
        ]);
    }

    public function edit(PracticumSchedule $schedule): Response
    {
        $this->authorize('update', $schedule);

        $schedule->load([
            'penanggungJawab:id,name,class',
            'participants:id,name,class',
            'equipmentItems:id,code,name',
        ]);

        return Inertia::render('Admin/Schedule/Edit', [
            'schedule' => $this->formatSchedule($schedule, detailed: true),
            ...$this->formPayload(),
        ]);
    }

    public function update(UpdatePracticumScheduleRequest $request, PracticumSchedule $schedule): RedirectResponse
    {
        $validated = $request->validated();
        $items = $validated['items'] ?? [];
        $participantIds = $validated['participant_ids'] ?? [];
        unset($validated['items'], $validated['participant_ids']);

        DB::transaction(function () use ($schedule, $validated, $items, $participantIds, $request) {
            $schedule->update([
                ...$validated,
                'jurusan' => config('lab.jurusan_default'),
                'schedule_kind' => $validated['schedule_kind'] ?? $schedule->schedule_kind ?? 'praktikum',
            ]);

            if ($schedule->fresh()->isLombaEvent()) {
                $this->lombaEvents->updateEvent(
                    $schedule->fresh(),
                    $items,
                    $participantIds,
                    $request->user(),
                );
            } else {
                $schedule->equipmentItems()->sync([]);
                $schedule->participants()->sync([]);
                $schedule->update(['penanggung_jawab_id' => null]);
            }
        });

        return redirect()
            ->route('admin.schedules.show', $schedule)
            ->with('success', 'Jadwal berhasil diperbarui.');
    }

    public function destroy(PracticumSchedule $schedule): RedirectResponse
    {
        $this->authorize('delete', $schedule);

        $schedule->delete();

        return redirect()
            ->route('admin.schedules.index')
            ->with('success', 'Jadwal berhasil dihapus.');
    }

    private function formPayload(): array
    {
        return [
            'guruOptions' => $this->guruOptions(),
            'siswaOptions' => $this->siswaOptions(),
            'equipmentOptions' => $this->equipmentOptions(),
            'kelasOptions' => ClassOptions::names(),
            'subjectOptions' => config('lab.practicum_subjects'),
            'dayOptions' => config('lab.schedule_days'),
            'typeOptions' => config('lab.schedule_types'),
            'kindOptions' => config('lab.schedule_kinds'),
            'labRoomOptions' => config('lab.lab_room_options'),
        ];
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

    private function siswaOptions(): array
    {
        return User::query()
            ->where('role', 'siswa')
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'class'])
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'class' => $user->class,
                'label' => trim($user->name.($user->class ? " ({$user->class})" : '')),
            ])
            ->values()
            ->all();
    }

    private function equipmentOptions(): array
    {
        return Equipment::query()
            ->alat()
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'available', 'qty_baik'])
            ->map(fn (Equipment $item) => [
                'id' => $item->id,
                'code' => $item->code,
                'name' => $item->name,
                'available' => $item->available,
                'label' => "{$item->code} — {$item->name}",
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
            'schedule_kind' => $schedule->schedule_kind ?? 'praktikum',
            'schedule_kind_label' => $schedule->scheduleKindLabel(),
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
            'penanggung_jawab_id' => $schedule->penanggung_jawab_id,
            'penanggung_jawab_name' => $schedule->penanggungJawab?->name,
            'ketua_tim_id' => $schedule->penanggung_jawab_id,
            'ketua_tim_name' => $schedule->penanggungJawab?->name,
            'priority' => $schedule->priority,
            'notes' => $schedule->notes,
            'created_at_formatted' => $schedule->created_at?->translatedFormat('d M Y'),
            'updated_at_formatted' => $schedule->updated_at?->translatedFormat('d M Y H:i'),
        ];

        if ($detailed) {
            $data['participant_ids'] = $schedule->relationLoaded('participants')
                ? $schedule->participants->pluck('id')->all()
                : [];
            $data['participants'] = $schedule->relationLoaded('participants')
                ? $schedule->participants->map(fn (User $u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'class' => $u->class,
                ])->values()->all()
                : [];
            $data['items'] = $schedule->relationLoaded('equipmentItems')
                ? $schedule->equipmentItems->map(fn (Equipment $e) => [
                    'equipment_id' => $e->id,
                    'equipment_name' => $e->name,
                    'equipment_code' => $e->code,
                    'quantity' => (int) ($e->pivot->quantity ?? 1),
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
