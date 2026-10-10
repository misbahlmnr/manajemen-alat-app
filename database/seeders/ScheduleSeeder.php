<?php

namespace Database\Seeders;

use App\Models\Equipment;
use App\Models\PracticumSchedule;
use App\Models\User;
use Illuminate\Database\Seeder;

class ScheduleSeeder extends Seeder
{
    public function run(): void
    {
        $maryadi = User::query()->where('username', 'maryadi')->first();
        $misbah = User::query()->where('username', 'misbah')->first();
        $patmawati = User::query()->where('username', 'patmawati')->first();
        $toolset = Equipment::query()->alat()->where('name', 'Toolset')->first();

        if (! $maryadi) {
            return;
        }

        $praktik = PracticumSchedule::query()->updateOrCreate(
            ['code' => 'JADWAL-0001'],
            [
                'schedule_kind' => 'praktikum',
                'title' => 'Pembuatan Sound',
                'mata_kuliah' => 'Pembuatan Sound',
                'jurusan' => config('lab.jurusan_default', 'Audio Video'),
                'kelas' => 'XI TAV 1',
                'type' => 'khusus',
                'hari' => null,
                'tanggal' => '2026-09-21',
                'jam_mulai' => '08:00:00',
                'jam_selesai' => '10:00:00',
                'ruangan' => 'Assembly',
                'guru_id' => $maryadi->id,
                'penanggung_jawab_id' => null,
                'priority' => 'normal',
                'notes' => 'Praktik lab pembuatan sound.',
            ],
        );

        if ($misbah && $patmawati) {
            $lomba = PracticumSchedule::query()->updateOrCreate(
                ['code' => 'JADWAL-0002'],
                [
                    'schedule_kind' => 'lomba',
                    'title' => 'Lomba LKS',
                    'mata_kuliah' => 'Lomba LKS',
                    'jurusan' => config('lab.jurusan_default', 'Audio Video'),
                    'kelas' => 'XI TAV 1',
                    'type' => 'khusus',
                    'hari' => null,
                    'tanggal' => '2026-09-22',
                    'jam_mulai' => '08:00:00',
                    'jam_selesai' => '15:00:00',
                    'ruangan' => null,
                    'guru_id' => $maryadi->id,
                    'penanggung_jawab_id' => $misbah->id,
                    'priority' => 'lomba',
                    'notes' => 'Peserta: Misbah (Ketua Tim) dan Patmawati.',
                ],
            );

            $lomba->participants()->sync([$misbah->id, $patmawati->id]);

            if ($toolset) {
                $lomba->equipmentItems()->sync([
                    $toolset->id => ['quantity' => 2],
                ]);
            }
        }

        // Pastikan jadwal praktik tidak membawa data peserta/alat lomba.
        $praktik->participants()->sync([]);
        $praktik->equipmentItems()->sync([]);
    }
}
