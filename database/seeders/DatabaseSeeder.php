<?php

namespace Database\Seeders;

use App\Models\User;
use App\Support\AcademicYear;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'Admin Lab',
            'username' => 'admin',
            'email' => 'admin@lab.local',
            'password' => 'password',
            'role' => 'admin',
            'status' => 'active',
            'nip' => 'ADM001',
        ]);

        $gurus = [
            ['name' => 'Maryadi Sosiawan', 'username' => 'maryadi', 'nip' => 'GRU001'],
            ['name' => 'Istia Waryani', 'username' => 'istia', 'nip' => 'GRU002'],
            ['name' => 'Ibnu Hari Wahyudi', 'username' => 'ibnu', 'nip' => 'GRU003'],
            ['name' => 'Ruswan Haryandi', 'username' => 'ruswan', 'nip' => 'GRU004'],
            ['name' => 'Annisa Fitri', 'username' => 'annisa', 'nip' => 'GRU005'],
        ];

        foreach ($gurus as $guru) {
            User::create([
                'name' => $guru['name'],
                'username' => $guru['username'],
                'email' => $guru['username'].'@lab.local',
                'password' => 'password',
                'role' => 'guru',
                'status' => 'active',
                'nip' => $guru['nip'],
            ]);
        }

        // XI TAV 1: 3 ketua + 15 anggota (cukup untuk 3 kelompok × 5 orang).
        $siswa = [
            ['name' => 'Patmawati', 'username' => 'patmawati', 'class' => 'XI TAV 1'],
            ['name' => 'Misbah', 'username' => 'misbah', 'class' => 'XI TAV 1'],
            ['name' => 'Santi', 'username' => 'santi', 'class' => 'XI TAV 1'],
            ['name' => 'Andi', 'username' => 'andi', 'class' => 'XI TAV 1'],
            ['name' => 'Budi', 'username' => 'budi', 'class' => 'XI TAV 1'],
            ['name' => 'Candra', 'username' => 'candra', 'class' => 'XI TAV 1'],
            ['name' => 'Dina', 'username' => 'dina', 'class' => 'XI TAV 1'],
            ['name' => 'Eko', 'username' => 'eko', 'class' => 'XI TAV 1'],
            ['name' => 'Fajar', 'username' => 'fajar', 'class' => 'XI TAV 1'],
            ['name' => 'Gita', 'username' => 'gita', 'class' => 'XI TAV 1'],
            ['name' => 'Hadi', 'username' => 'hadi', 'class' => 'XI TAV 1'],
            ['name' => 'Indra', 'username' => 'indra', 'class' => 'XI TAV 1'],
            ['name' => 'Joko', 'username' => 'joko', 'class' => 'XI TAV 1'],
            ['name' => 'Kartika', 'username' => 'kartika', 'class' => 'XI TAV 1'],
            ['name' => 'Lina', 'username' => 'lina', 'class' => 'XI TAV 1'],
            ['name' => 'Maya', 'username' => 'maya', 'class' => 'XI TAV 1'],
            ['name' => 'Nanda', 'username' => 'nanda', 'class' => 'XI TAV 1'],
            ['name' => 'Omar', 'username' => 'omar', 'class' => 'XI TAV 1'],
            ['name' => 'Azka', 'username' => 'azka', 'class' => 'XII TAV 3'],
            ['name' => 'Azki', 'username' => 'azki', 'class' => 'XII TAV 3'],
            ['name' => 'Eka', 'username' => 'eka', 'class' => 'X TE 1'],
        ];

        foreach ($siswa as $index => $murid) {
            User::create([
                'name' => $murid['name'],
                'username' => $murid['username'],
                'email' => $murid['username'].'@lab.local',
                'password' => 'password',
                'role' => 'siswa',
                'status' => 'active',
                'nisn' => sprintf('00100000%02d', $index + 1),
                'class' => $murid['class'],
                'angkatan' => AcademicYear::fromClass($murid['class']),
            ]);
        }

        $this->call([
            ClassOptionSeeder::class,
            AngkatanOptionSeeder::class,
            EquipmentSeeder::class,
            SupplySeeder::class,
            ScheduleSeeder::class,
            // LoanSeeder::class,
        ]);
    }
}
