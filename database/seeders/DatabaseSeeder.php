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

        User::create([
            'name' => 'Guru Lab AV',
            'username' => 'guru',
            'email' => 'guru@lab.local',
            'password' => 'password',
            'role' => 'guru',
            'status' => 'active',
            'nip' => 'GRU001',
        ]);

        User::create([
            'name' => 'Siswa Contoh',
            'username' => 'siswa',
            'email' => 'siswa@lab.local',
            'password' => 'password',
            'role' => 'siswa',
            'status' => 'active',
            'nisn' => '0012345678',
            'class' => 'XII TAV 1',
        ]);

        $this->call([
            EquipmentSeeder::class,
            SupplySeeder::class,
            PracticumScheduleSeeder::class,
            LoanSeeder::class,
            CollateralSeeder::class,
        ]);
    }
}
