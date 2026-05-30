<?php

namespace Database\Seeders;

use App\Models\Equipment;
use App\Models\Supply;
use Illuminate\Database\Seeder;

class SupplySeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            [
                'name' => 'Resistor 1/4W (Mix Pack)',
                'category' => 'Komponen Elektro',
                'stock' => 500,
                'available' => 320,
                'unit' => 'pcs',
                'min_stock' => 100,
                'description' => 'Resistor karbon berbagai nilai',
            ],
            [
                'name' => 'Kabel Jumper Male-Male 20cm',
                'category' => 'Konsumabel',
                'stock' => 30,
                'available' => 8,
                'unit' => 'pack',
                'min_stock' => 10,
                'description' => 'Kabel jumper breadboard, 40 pcs per pack',
            ],
            [
                'name' => 'Relay 5V SPDT',
                'category' => 'Komponen Elektro',
                'stock' => 40,
                'available' => 18,
                'unit' => 'pcs',
                'min_stock' => 10,
                'description' => 'Relay 5V single pole double throw',
            ],
            [
                'name' => 'Timah Solder 60/40 100g',
                'category' => 'Solder & Flux',
                'stock' => 25,
                'available' => 12,
                'unit' => 'roll',
                'min_stock' => 5,
                'location' => 'Rak Gudang B2',
                'description' => 'Timah solder untuk praktik elektronika',
            ],
            [
                'name' => 'Header Pin Male 40-pin',
                'category' => 'PCB & Prototyping',
                'stock' => 60,
                'available' => 45,
                'unit' => 'pcs',
                'min_stock' => 15,
                'description' => 'Header pin untuk PCB prototyping',
            ],
        ];

        foreach ($items as $item) {
            Supply::create([
                ...$item,
                'code' => Equipment::generateCode('bahan'),
                'status' => 'active',
            ]);
        }
    }
}
