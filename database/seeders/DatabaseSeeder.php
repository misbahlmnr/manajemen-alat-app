<?php

namespace Database\Seeders;

use App\Models\User;
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
            ['name' => 'Patmawati', 'username' => 'patmawati', 'class' => 'X TE 1'],
            ['name' => 'Santi', 'username' => 'santi', 'class' => 'X TE 2'],
            ['name' => 'Misbah', 'username' => 'misbah', 'class' => 'X TE 3'],
            ['name' => 'Azka', 'username' => 'azka', 'class' => 'X TE 4'],
            ['name' => 'Azki', 'username' => 'azki', 'class' => 'XI TAV 1'],
            ['name' => 'Dika', 'username' => 'dika', 'class' => 'XI TAV 2'],
            ['name' => 'Dennal', 'username' => 'dennal', 'class' => 'XI TAV 3'],
            ['name' => 'Della', 'username' => 'della', 'class' => 'XII TAV 1'],
            ['name' => 'Udin', 'username' => 'udin', 'class' => 'XII TAV 2'],
            ['name' => 'Farhan', 'username' => 'farhan', 'class' => 'XII TAV 3'],
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
            ]);
        }

        $this->call([
            EquipmentSeeder::class,
            SupplySeeder::class,
            PracticumScheduleSeeder::class,
            LoanSeeder::class,
            CollateralSeeder::class,
        ]);
    }
}
