<?php

namespace Database\Seeders;

use App\Models\Equipment;
use Illuminate\Database\Seeder;

class EquipmentSeeder extends Seeder
{
    public function run(): void
    {
        Equipment::updateOrCreate([
            'name' => 'Toolset',
            'item_type' => 'alat',
        ], [
            'code' => Equipment::query()
                ->where('name', 'Toolset')
                ->where('item_type', 'alat')
                ->value('code') ?? Equipment::generateCode('alat'),
            'category' => 'Peralatan kerja bangku dan perakitan (assembly)',
            'item_type' => 'alat',
            'stock' => 10,
            'available' => 10,
            'qty_baik' => 10,
            'qty_rusak_ringan' => 0,
            'qty_rusak_berat' => 0,
            'unit' => 'unit',
            'location' => 'Asembly',
            'status' => 'tersedia',
        ]);
    }
}
