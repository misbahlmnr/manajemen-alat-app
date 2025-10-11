<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Kelas;
use App\Models\Mapel;
use App\Models\Jadwal;
use App\Models\Materi;
use App\Models\Tugas;
use App\Models\Nilai;
use App\Models\Absensi;
use App\Models\AdaptiveRule;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create Admin
        $admin = User::create([
            'name' => 'Admin SIAKAD',
            'email' => 'admin@siakad.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        // Create Guru
        $guru = User::create([
            'name' => 'Guru Matematika',
            'email' => 'guru@siakad.com',
            'password' => Hash::make('password'),
            'role' => 'guru',
        ]);

        // Create Kelas
        $kelas = Kelas::create([
            'nama' => 'Kelas 7A',
            'tingkat' => 7,
            'wali_kelas_id' => $guru->id,
        ]);

        // Create Siswa
        $siswa = User::create([
            'name' => 'Siswa Contoh',
            'email' => 'siswa@siakad.com',
            'password' => Hash::make('password'),
            'role' => 'siswa',
            'kelas_id' => $kelas->id,
        ]);

        // Create Mapel
        $mapel = Mapel::create([
            'nama' => 'Matematika',
            'guru_id' => $guru->id,
        ]);

        // Create Jadwal
        Jadwal::create([
            'kelas_id' => $kelas->id,
            'mapel_id' => $mapel->id,
            'guru_id' => $guru->id,
            'hari' => 'Senin',
            'jam_mulai' => '08:00',
            'jam_selesai' => '09:30',
        ]);

        // Create Materi
        $materi = Materi::create([
            'mapel_id' => $mapel->id,
            'guru_id' => $guru->id,
            'kelas_id' => $kelas->id,
            'judul' => 'Aljabar Dasar',
            'deskripsi' => 'Materi tentang aljabar untuk kelas 7',
            'tingkat_kesulitan' => 'mudah',
            'file_path' => null,
        ]);

        // Create Tugas
        $tugas = Tugas::create([
            'mapel_id' => $mapel->id,
            'guru_id' => $guru->id,
            'kelas_id' => $kelas->id,
            'judul' => 'Latihan Aljabar',
            'tipe' => 'tugas',
            'deadline' => now()->addDays(7),
        ]);

        // Create Nilai
        Nilai::create([
            'tugas_id' => $tugas->id,
            'siswa_id' => $siswa->id,
            'skor' => 75.0,
        ]);

        // Create Absensi
        Absensi::create([
            'jadwal_id' => 1,
            'siswa_id' => $siswa->id,
            'status' => 'hadir',
            'tanggal' => now()->toDateString(),
        ]);

        // Create Adaptive Rule
        AdaptiveRule::create([
            'mapel_id' => $mapel->id,
            'min_score' => 70.0,
            'kategori_rekomendasi' => 'materi tambahan',
        ]);
    }
}
