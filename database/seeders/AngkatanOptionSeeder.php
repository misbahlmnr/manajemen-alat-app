<?php

namespace Database\Seeders;

use App\Models\AngkatanOption;
use App\Support\AcademicYear;
use Illuminate\Database\Seeder;

class AngkatanOptionSeeder extends Seeder
{
    public function run(): void
    {
        foreach (AcademicYear::generated() as $name) {
            AngkatanOption::query()->updateOrCreate(
                ['name' => $name],
                ['sort_order' => (int) substr($name, 0, 4)],
            );
        }
    }
}
