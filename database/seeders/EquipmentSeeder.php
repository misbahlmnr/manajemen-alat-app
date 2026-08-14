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
            'category' => 'Mesin & Perkakas',
            'item_type' => 'alat',
            'stock' => 20,
            'available' => 20,
            'qty_baik' => 20,
            'qty_rusak_ringan' => 0,
            'qty_rusak_berat' => 0,
            'unit' => 'unit',
            'location' => 'Asembly',
            'status' => 'tersedia',
        ]);
    }
}
