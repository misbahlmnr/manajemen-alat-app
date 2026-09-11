<?php

namespace Database\Seeders;

use App\Models\PracticumSchedule;
use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

class PracticumScheduleSeeder extends Seeder
{
    /**
     * Jadwal produktif lab TE/TAV Senin–Sabtu (blok ~3 JP).
     * Setiap kelas dapat satu sesi lab per hari; guru/kelas/ruang tidak bentrok.
     */
    public function run(): void
    {
        $guruByUsername = User::query()
            ->where('role', 'guru')
            ->get()
            ->keyBy('username');

        if ($guruByUsername->isEmpty()) {
            return;
        }

        PracticumSchedule::query()->delete();

        $subjects = [
            'DTE' => [
                'title' => 'Dasar Teknik Elektronika',
                'mata_kuliah' => 'DTE (Dasar Teknik Elektronika)',
                'guru' => 'istia',
                'rooms' => ['Ruang Assembly', 'Ruang Terbuka', 'Ruang Instalasi', 'Ruang Komputer'],
            ],
            'TPMM' => [
                'title' => 'Teknik Pemrograman Mikroprosessor dan Mikrokontroller',
                'mata_kuliah' => 'TPMM (Teknik Pemrograman Mikroprosessor dan Mikrokontroller)',
                'guru' => 'ruswan',
                'rooms' => ['Ruang Komputer', 'Ruang Terbuka', 'Ruang Assembly', 'Ruang Instalasi'],
            ],
            'PMM' => [
                'title' => 'Pemrograman Mikroprosessor dan Mikrokontroller',
                'mata_kuliah' => 'PMM (Pemrograman Mikroprosessor dan Mikrokontroller)',
                'guru' => 'ibnu',
                'rooms' => ['Ruang Komputer', 'Ruang Terbuka', 'Ruang Assembly', 'Ruang Instalasi'],
            ],
            'PRE' => [
                'title' => 'Penerapan Rangkaian Elektronika',
                'mata_kuliah' => 'PRE (Penerapan Rangkaian Elektronika)',
                'guru' => 'maryadi',
                'rooms' => ['Ruang Assembly', 'Ruang Terbuka', 'Ruang Instalasi', 'Ruang Komputer'],
            ],
            'PSRT' => [
                'title' => 'Penerapan Sistem Radio Televisi',
                'mata_kuliah' => 'PSRT (Penerapan Sistem Radio Televisi)',
                'guru' => 'maryadi',
                'rooms' => ['Ruang Instalasi', 'Ruang Terbuka', 'Ruang Assembly', 'Ruang Komputer'],
            ],
            'PISAV' => [
                'title' => 'Penerapan dan Instalasi Sistem Audio Video',
                'mata_kuliah' => 'PISAV (Penerapan dan Instalasi Sistem Audio Video)',
                'guru' => 'ruswan',
                'rooms' => ['Ruang Instalasi', 'Ruang Terbuka', 'Ruang Assembly', 'Ruang Komputer'],
            ],
            'PPPAV' => [
                'title' => 'Perawatan dan Perbaikan Peralatan Audio dan Video',
                'mata_kuliah' => 'PPPAV (Perawatan dan Perbaikan Peralatan Audio dan Video)',
                'guru' => 'ruswan',
                'rooms' => ['Ruang Assembly', 'Ruang Terbuka', 'Ruang Instalasi', 'Ruang Komputer'],
            ],
            'PKK' => [
                'title' => 'Produk Kreatif dan Kewirausahaan',
                'mata_kuliah' => 'PKK (Produk Kreatif dan Kewirausahaan)',
                'guru' => 'annisa',
                'rooms' => ['Ruang Terbuka', 'Ruang Komputer', 'Ruang Assembly', 'Ruang Instalasi'],
            ],
        ];

        $weekdaySlots = [
            'A' => ['07:00', '09:30'],
            'B' => ['09:45', '12:15'],
            'C' => ['13:00', '15:30'],
        ];

        $fridaySlots = [
            'A' => ['07:00', '09:00'],
            'B' => ['09:20', '11:20'],
            'C' => ['13:00', '14:30'],
        ];

        $slotsByDay = [
            'senin' => $weekdaySlots,
            'selasa' => $weekdaySlots,
            'rabu' => $weekdaySlots,
            'kamis' => $weekdaySlots,
            'jumat' => $fridaySlots,
            'sabtu' => $weekdaySlots,
        ];

        // [hari, slot, kelas, kode mapel]
        $lessons = [
            // Senin
            ['senin', 'A', 'X TE 1', 'DTE'],
            ['senin', 'A', 'XI TAV 1', 'PMM'],
            ['senin', 'A', 'XI TAV 2', 'PRE'],
            ['senin', 'A', 'XI TAV 3', 'PISAV'],
            ['senin', 'B', 'X TE 2', 'TPMM'],
            ['senin', 'B', 'X TE 3', 'DTE'],
            ['senin', 'B', 'XII TAV 1', 'PKK'],
            ['senin', 'B', 'XII TAV 2', 'PRE'],
            ['senin', 'C', 'X TE 4', 'TPMM'],
            ['senin', 'C', 'XII TAV 3', 'PRE'],

            // Selasa
            ['selasa', 'A', 'X TE 2', 'DTE'],
            ['selasa', 'A', 'XI TAV 1', 'PSRT'],
            ['selasa', 'A', 'XI TAV 2', 'PISAV'],
            ['selasa', 'A', 'XII TAV 2', 'PKK'],
            ['selasa', 'B', 'X TE 1', 'TPMM'],
            ['selasa', 'B', 'X TE 4', 'DTE'],
            ['selasa', 'B', 'XII TAV 1', 'PRE'],
            ['selasa', 'C', 'X TE 3', 'TPMM'],
            ['selasa', 'C', 'XI TAV 3', 'PRE'],
            ['selasa', 'C', 'XII TAV 3', 'PKK'],

            // Rabu
            ['rabu', 'A', 'X TE 3', 'DTE'],
            ['rabu', 'A', 'XI TAV 1', 'PRE'],
            ['rabu', 'A', 'XI TAV 3', 'PMM'],
            ['rabu', 'A', 'XII TAV 1', 'PISAV'],
            ['rabu', 'B', 'X TE 1', 'DTE'],
            ['rabu', 'B', 'X TE 2', 'TPMM'],
            ['rabu', 'B', 'XI TAV 2', 'PMM'],
            ['rabu', 'C', 'X TE 4', 'TPMM'],
            ['rabu', 'C', 'XII TAV 2', 'PSRT'],
            ['rabu', 'C', 'XII TAV 3', 'PKK'],

            // Kamis
            ['kamis', 'A', 'X TE 4', 'DTE'],
            ['kamis', 'A', 'XI TAV 1', 'PISAV'],
            ['kamis', 'A', 'XI TAV 2', 'PRE'],
            ['kamis', 'A', 'XI TAV 3', 'PMM'],
            ['kamis', 'B', 'X TE 1', 'TPMM'],
            ['kamis', 'B', 'X TE 2', 'DTE'],
            ['kamis', 'B', 'XII TAV 2', 'PKK'],
            ['kamis', 'B', 'XII TAV 3', 'PRE'],
            ['kamis', 'C', 'X TE 3', 'TPMM'],
            ['kamis', 'C', 'XII TAV 1', 'PKK'],

            // Jumat (jam lebih pendek)
            ['jumat', 'A', 'X TE 1', 'DTE'],
            ['jumat', 'A', 'XI TAV 2', 'PSRT'],
            ['jumat', 'A', 'XI TAV 3', 'PISAV'],
            ['jumat', 'A', 'XII TAV 3', 'PKK'],
            ['jumat', 'B', 'X TE 2', 'TPMM'],
            ['jumat', 'B', 'X TE 3', 'DTE'],
            ['jumat', 'B', 'XI TAV 1', 'PMM'],
            ['jumat', 'B', 'XII TAV 2', 'PSRT'],
            ['jumat', 'C', 'X TE 4', 'TPMM'],
            ['jumat', 'C', 'XII TAV 1', 'PRE'],

            // Sabtu
            ['sabtu', 'A', 'X TE 2', 'DTE'],
            ['sabtu', 'A', 'XI TAV 1', 'PMM'],
            ['sabtu', 'A', 'XI TAV 3', 'PSRT'],
            ['sabtu', 'A', 'XII TAV 2', 'PPPAV'],
            ['sabtu', 'B', 'X TE 1', 'TPMM'],
            ['sabtu', 'B', 'X TE 4', 'DTE'],
            ['sabtu', 'B', 'XI TAV 2', 'PMM'],
            ['sabtu', 'B', 'XII TAV 1', 'PSRT'],
            ['sabtu', 'C', 'X TE 3', 'TPMM'],
            ['sabtu', 'C', 'XII TAV 3', 'PKK'],
        ];

        $guruBusy = [];
        $kelasBusy = [];
        $roomBusy = [];

        foreach ($lessons as [$hari, $slotKey, $kelas, $code]) {
            $subject = $subjects[$code] ?? null;
            $times = $slotsByDay[$hari][$slotKey] ?? null;

            if (! $subject || ! $times) {
                throw new RuntimeException("Jadwal tidak valid: {$kelas} {$hari} {$slotKey} {$code}");
            }

            $guru = $guruByUsername->get($subject['guru']);

            if (! $guru) {
                throw new RuntimeException("Guru pengampu '{$subject['guru']}' untuk {$code} belum ada.");
            }

            $jamMulai = $times[0];
            $jamSelesai = $times[1];
            $guruKey = $guru->id.'|'.$hari.'|'.$jamMulai;
            $kelasKey = $kelas.'|'.$hari.'|'.$jamMulai;

            if (isset($guruBusy[$guruKey])) {
                throw new RuntimeException("Guru bentrok: {$subject['guru']} {$hari} {$jamMulai} ({$kelas} {$code}).");
            }

            if (isset($kelasBusy[$kelasKey])) {
                throw new RuntimeException("Kelas bentrok: {$kelas} {$hari} {$jamMulai}.");
            }

            $ruangan = null;
            foreach ($subject['rooms'] as $room) {
                $roomKey = $room.'|'.$hari.'|'.$jamMulai;
                if (! isset($roomBusy[$roomKey])) {
                    $ruangan = $room;
                    $roomBusy[$roomKey] = true;
                    break;
                }
            }

            if ($ruangan === null) {
                throw new RuntimeException("Tidak ada ruang kosong: {$kelas} {$hari} {$jamMulai}.");
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
                'hari' => $hari,
                'jam_mulai' => $jamMulai,
                'jam_selesai' => $jamSelesai,
                'ruangan' => $ruangan,
                'guru_id' => $guru->id,
                'priority' => $code === 'PKK' ? 'tinggi' : 'normal',
                'notes' => $hari === 'jumat'
                    ? 'Blok produktif Jumat (jam lebih pendek).'
                    : 'Blok produktif 3 JP sesuai jadwal lab.',
            ]);
        }
    }
}
