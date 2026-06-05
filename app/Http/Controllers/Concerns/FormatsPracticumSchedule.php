<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Equipment;
use App\Models\PracticumSchedule;

trait FormatsPracticumSchedule
{
    protected function formatSchedule(PracticumSchedule $schedule, bool $detailed = false): array
    {
        $jamMulai = $this->formatScheduleTime($schedule->jam_mulai);
        $jamSelesai = $this->formatScheduleTime($schedule->jam_selesai);

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

    protected function formatScheduleTime(?string $time): string
    {
        if (! $time) {
            return '';
        }

        return substr($time, 0, 5);
    }
}
