<?php

namespace Database\Seeders;

use App\Models\Equipment;
use App\Models\Supply;
use Illuminate\Database\Seeder;

class SupplySeeder extends Seeder
{
    public function run(): void
    {
        Supply::updateOrCreate([
            'name' => 'Transistor TIP 31C',
        ], [
            'code' => Supply::query()
                ->withoutGlobalScopes()
                ->where('name', 'Transistor TIP 31C')
                ->where('item_type', 'bahan')
                ->value('code') ?? Equipment::generateCode('bahan'),
            'category' => 'Komponen Aktif',
            'stock' => 100,
            'available' => 100,
            'unit' => 'pcs',
            'min_stock' => 20,
            'location' => 'Lemari Bahan',
            'status' => 'tersedia',
        ]);
    }
}
