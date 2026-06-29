<?php

namespace Database\Seeders;

use App\Models\PracticumSchedule;
use App\Models\User;
use Illuminate\Database\Seeder;

class PracticumScheduleSeeder extends Seeder
{
    public function run(): void
    {
        $guruByUsername = User::query()
            ->where('role', 'guru')
            ->get()
            ->keyBy('username');

        if ($guruByUsername->isEmpty()) {
            return;
        }

        // Daftar mata pelajaran beserta guru pengampunya.
        $subjects = [
            'DTE' => [
                'title' => 'Dasar Teknik Elektronika',
                'mata_kuliah' => 'DTE (Dasar Teknik Elektronika)',
                'guru' => 'istia',
            ],
            'TPMM' => [
                'title' => 'Teknik Pemrograman Mikroprosessor dan Mikrokontroller',
                'mata_kuliah' => 'TPMM (Teknik Pemrograman Mikroprosessor dan Mikrokontroller)',
                'guru' => 'ruswan',
            ],
            'PMM' => [
                'title' => 'Pemrograman Mikroprosessor dan Mikrokontroller',
                'mata_kuliah' => 'PMM (Pemrograman Mikroprosessor dan Mikrokontroller)',
                'guru' => 'ibnu',
            ],
            'PRE' => [
                'title' => 'Penerapan Rangkaian Elektronika',
                'mata_kuliah' => 'PRE (Penerapan Rangkaian Elektronika)',
                'guru' => 'maryadi',
            ],
            'PSRT' => [
                'title' => 'Penerapan Sistem Radio Televisi',
                'mata_kuliah' => 'PSRT (Penerapan Sistem Radio Televisi)',
                'guru' => 'maryadi',
            ],
            'PISAV' => [
                'title' => 'Penerapan dan Instalasi Sistem Audio Video',
                'mata_kuliah' => 'PISAV (Penerapan dan Instalasi Sistem Audio Video)',
                'guru' => 'ruswan',
            ],
            'PPPAV' => [
                'title' => 'Perawatan dan Perbaikan Peralatan Audio dan Video',
                'mata_kuliah' => 'PPPAV (Perawatan dan Perbaikan Peralatan Audio dan Video)',
                'guru' => 'ruswan',
            ],
            'PKK' => [
                'title' => 'Produk Kreatif dan Kewirausahaan',
                'mata_kuliah' => 'PKK (Produk Kreatif dan Kewirausahaan)',
                'guru' => 'annisa',
            ],
        ];

        // Mata pelajaran per kelas.
        $kelasSubjects = [
            'X TE 1' => ['DTE', 'TPMM'],
            'X TE 2' => ['DTE', 'TPMM'],
            'X TE 3' => ['DTE', 'TPMM'],
            'X TE 4' => ['DTE', 'TPMM'],
            'XI TAV 1' => ['PMM', 'PRE', 'PSRT', 'PISAV'],
            'XI TAV 2' => ['PMM', 'PRE', 'PSRT', 'PISAV'],
            'XI TAV 3' => ['PMM', 'PRE', 'PSRT', 'PISAV'],
            'XII TAV 1' => ['PRE', 'PSRT', 'PISAV', 'PPPAV', 'PKK'],
            'XII TAV 2' => ['PRE', 'PSRT', 'PISAV', 'PPPAV', 'PKK'],
            'XII TAV 3' => ['PRE', 'PSRT', 'PISAV', 'PPPAV', 'PKK'],
        ];

        $days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
        $timeSlots = [
            ['07:00', '09:30'],
            ['09:30', '12:00'],
            ['13:00', '15:30'],
        ];
        $rooms = ['Lab AV-1', 'Lab AV-2', 'Lab Elektronika'];

        // Bangun seluruh kombinasi (hari, slot) untuk penempatan jadwal.
        $allSlots = [];
        foreach ($days as $day) {
            foreach ($timeSlots as $slot) {
                $allSlots[] = ['hari' => $day, 'jam_mulai' => $slot[0], 'jam_selesai' => $slot[1]];
            }
        }

        $guruBusy = [];   // guru_id|hari|jam_mulai => true
        $roomBusy = [];   // ruangan|hari|jam_mulai => true
        $kelasBusy = [];  // kelas|hari|jam_mulai => true

        foreach ($kelasSubjects as $kelas => $codes) {
            foreach ($codes as $code) {
                $subject = $subjects[$code];
                $guru = $guruByUsername->get($subject['guru']);

                if (! $guru) {
                    continue;
                }

                foreach ($allSlots as $slot) {
                    $guruKey = $guru->id.'|'.$slot['hari'].'|'.$slot['jam_mulai'];
                    $kelasKey = $kelas.'|'.$slot['hari'].'|'.$slot['jam_mulai'];

                    if (isset($guruBusy[$guruKey]) || isset($kelasBusy[$kelasKey])) {
                        continue;
                    }

                    $ruangan = null;
                    foreach ($rooms as $room) {
                        $roomKey = $room.'|'.$slot['hari'].'|'.$slot['jam_mulai'];
                        if (! isset($roomBusy[$roomKey])) {
                            $ruangan = $room;
                            $roomBusy[$roomKey] = true;
                            break;
                        }
                    }

                    if ($ruangan === null) {
                        continue;
                    }

                    $guruBusy[$guruKey] = true;
                    $kelasBusy[$kelasKey] = true;

                    PracticumSchedule::create([
                        'code' => PracticumSchedule::generateCode(),
                        'title' => 'Praktik '.$subject['title'],
                        'mata_kuliah' => $subject['mata_kuliah'],
                        'jurusan' => 'Audio Video',
                        'kelas' => $kelas,
                        'type' => 'mingguan',
                        'hari' => $slot['hari'],
                        'jam_mulai' => $slot['jam_mulai'],
                        'jam_selesai' => $slot['jam_selesai'],
                        'ruangan' => $ruangan,
                        'guru_id' => $guru->id,
                        'priority' => 'normal',
                    ]);

                    break;
                }
            }
        }
    }
}
