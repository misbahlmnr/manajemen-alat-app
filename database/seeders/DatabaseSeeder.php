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

        $siswa = [
            ['name' => 'Patmawati', 'username' => 'patmawati', 'class' => 'XI TAV 1'],
            ['name' => 'Santi', 'username' => 'santi', 'class' => 'XII TAV 1'],
            ['name' => 'Misbah', 'username' => 'misbah', 'class' => 'XII TAV 1'],
            ['name' => 'Azka', 'username' => 'azka', 'class' => 'XII TAV 3'],
            ['name' => 'Azki', 'username' => 'azki', 'class' => 'XII TAV 3'],
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
        ]);
    }
}
