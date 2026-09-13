<?php

namespace Database\Seeders;

use App\Models\ClassOption;
use Illuminate\Database\Seeder;

class ClassOptionSeeder extends Seeder
{
    public function run(): void
    {
        foreach (config('lab.class_options', []) as $index => $name) {
            ClassOption::query()->updateOrCreate(
                ['name' => $name],
                ['sort_order' => $index + 1],
            );
        }
    }
}
