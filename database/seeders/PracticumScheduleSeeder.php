<?php

namespace Database\Seeders;

use App\Models\Equipment;
use App\Models\PracticumSchedule;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class PracticumScheduleSeeder extends Seeder
{
    public function run(): void
    {
        $guru = User::query()->where('role', 'guru')->first();
        if (! $guru) {
            return;
        }

        $camera = Equipment::query()->alat()->where('name', 'like', '%Kamera%')->first();

        $items = [
            [
                'title' => 'Praktik Shooting Video Dokumenter',
                'mata_kuliah' => 'Produksi Video',
                'kelas' => 'XII TAV 1',
                'tanggal' => Carbon::today()->addDays(1),
                'jam_mulai' => '08:00',
                'jam_selesai' => '11:00',
                'ruangan' => 'Lab AV-1',
                'priority' => 'normal',
                'status' => 'aktif',
            ],
            [
                'title' => 'Praktik Rekaman Podcast',
                'mata_kuliah' => 'Produksi Audio',
                'kelas' => 'XII TAV 1',
                'tanggal' => Carbon::today()->addDays(2),
                'jam_mulai' => '10:00',
                'jam_selesai' => '12:00',
                'ruangan' => 'Lab AV-2',
                'priority' => 'tinggi',
                'status' => 'aktif',
            ],
            [
                'title' => 'Praktik Lighting Studio',
                'mata_kuliah' => 'Produksi Video',
                'kelas' => 'XI TAV 2',
                'tanggal' => Carbon::today()->addDays(3),
                'jam_mulai' => '13:00',
                'jam_selesai' => '15:00',
                'ruangan' => 'Lab AV-1',
                'priority' => 'normal',
                'status' => 'aktif',
            ],
            [
                'title' => 'Persiapan Lomba Film Pendek',
                'mata_kuliah' => 'Produksi Video',
                'kelas' => 'XII TAV 1',
                'tanggal' => Carbon::today()->addDays(5),
                'jam_mulai' => '08:00',
                'jam_selesai' => '16:00',
                'ruangan' => 'Lab AV-1',
                'priority' => 'lomba',
                'status' => 'aktif',
                'equipment' => $camera ? [['id' => $camera->id, 'qty' => 3]] : [],
            ],
            [
                'title' => 'Ujian Praktik Penyiaran',
                'mata_kuliah' => 'Penyiaran',
                'kelas' => 'XI TAV 1',
                'tanggal' => Carbon::today()->addDays(7),
                'jam_mulai' => '09:00',
                'jam_selesai' => '12:00',
                'ruangan' => 'Studio Siaran',
                'priority' => 'lomba',
                'status' => 'aktif',
            ],
            [
                'title' => 'Praktik Dasar Kamera (Selesai)',
                'mata_kuliah' => 'Dasar AV',
                'kelas' => 'X TAV 1',
                'tanggal' => Carbon::today()->subDays(7),
                'jam_mulai' => '08:00',
                'jam_selesai' => '10:00',
                'ruangan' => 'Lab AV-1',
                'priority' => 'normal',
                'status' => 'selesai',
            ],
        ];

        foreach ($items as $item) {
            $equipment = $item['equipment'] ?? [];
            unset($item['equipment']);

            $schedule = PracticumSchedule::create([
                ...$item,
                'code' => PracticumSchedule::generateCode(),
                'jurusan' => 'Audio Video',
                'guru_id' => $guru->id,
            ]);

            if ($equipment) {
                $sync = [];
                foreach ($equipment as $row) {
                    $sync[$row['id']] = ['quantity' => $row['qty']];
                }
                $schedule->equipment()->sync($sync);
            }
        }
    }
}
