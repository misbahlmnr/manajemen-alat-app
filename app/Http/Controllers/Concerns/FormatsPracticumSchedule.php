<?php

namespace App\Http\Controllers\Concerns;

use App\Models\PracticumSchedule;

trait FormatsPracticumSchedule
{
    protected function formatSchedule(PracticumSchedule $schedule): array
    {
        $jamMulai = $this->formatScheduleTime($schedule->jam_mulai);
        $jamSelesai = $this->formatScheduleTime($schedule->jam_selesai);

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

    protected function formatScheduleTime(?string $time): string
    {
        if (! $time) {
            return '';
        }

        return substr($time, 0, 5);
    }
}
