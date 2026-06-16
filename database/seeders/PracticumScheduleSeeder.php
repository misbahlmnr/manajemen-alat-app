<?php

namespace Database\Seeders;

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

        $items = [
            [
                'title' => 'Praktik Rangkaian Elektronika Dasar',
                'mata_kuliah' => 'PRE (Penerapan Rangkaian Elektronika)',
                'kelas' => 'X TE 1',
                'type' => 'mingguan',
                'hari' => 'senin',
                'jam_mulai' => '08:00',
                'jam_selesai' => '11:00',
                'ruangan' => 'Lab AV-1',
                'priority' => 'normal',
            ],
            [
                'title' => 'Praktik Mikrokontroler Arduino',
                'mata_kuliah' => 'PAM (Pembelajaran Alat Mikrokontroler)',
                'kelas' => 'XI TAV 1',
                'type' => 'mingguan',
                'hari' => 'selasa',
                'jam_mulai' => '10:00',
                'jam_selesai' => '12:00',
                'ruangan' => 'Lab AV-2',
                'priority' => 'normal',
            ],
            [
                'title' => 'Praktik Sistem Radio TV',
                'mata_kuliah' => 'PSRT (Penerapan Sistem Radio Televisi)',
                'kelas' => 'XI TAV 2',
                'type' => 'mingguan',
                'hari' => 'rabu',
                'jam_mulai' => '13:00',
                'jam_selesai' => '15:00',
                'ruangan' => 'Lab AV-1',
                'priority' => 'normal',
            ],
            [
                'title' => 'Praktik Instalasi Audio Video',
                'mata_kuliah' => 'PISAV (Perancangan Instalasi Audio Video)',
                'kelas' => 'XII TAV 1',
                'type' => 'mingguan',
                'hari' => 'kamis',
                'jam_mulai' => '08:00',
                'jam_selesai' => '10:00',
                'ruangan' => 'Lab AV-1',
                'priority' => 'tinggi',
            ],
            [
                'title' => 'Lomba Instalasi AV',
                'mata_kuliah' => 'PISAV (Perancangan Instalasi Audio Video)',
                'kelas' => 'XII TAV 2',
                'type' => 'khusus',
                'tanggal' => Carbon::today()->addDays(5),
                'jam_mulai' => '08:00',
                'jam_selesai' => '16:00',
                'ruangan' => 'Lab AV-1',
                'priority' => 'lomba',
            ],
            [
                'title' => 'Ujian Praktik Dasar Elektronika',
                'mata_kuliah' => 'Dasar Elektronika',
                'kelas' => 'X TE 2',
                'type' => 'khusus',
                'tanggal' => Carbon::today()->addDays(7),
                'jam_mulai' => '09:00',
                'jam_selesai' => '12:00',
                'ruangan' => 'Lab AV-2',
                'priority' => 'lomba',
            ],
        ];

        foreach ($items as $item) {
            PracticumSchedule::create([
                ...$item,
                'code' => PracticumSchedule::generateCode(),
                'jurusan' => 'Audio Video',
                'guru_id' => $guru->id,
            ]);
        }
    }
}
