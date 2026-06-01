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
                'name' => 'Transistor D400',
                'category' => 'Komponen Aktif',
                'stock' => 450,
                'available' => 450,
                'unit' => 'pcs',
                'min_stock' => 100,
                'description' => 'Semikonduktor transistor untuk praktik elektronika.',
            ],
            [
                'name' => 'Transistor TIP 32C',
                'category' => 'Komponen Aktif',
                'stock' => 150,
                'available' => 150,
                'unit' => 'pcs',
                'min_stock' => 30,
            ],
            [
                'name' => 'Transistor TIP 3055',
                'category' => 'Komponen Aktif',
                'stock' => 146,
                'available' => 146,
                'unit' => 'pcs',
                'min_stock' => 30,
            ],
            [
                'name' => 'Transistor A564',
                'category' => 'Komponen Aktif',
                'stock' => 120,
                'available' => 120,
                'unit' => 'pcs',
                'min_stock' => 25,
            ],
            [
                'name' => 'Transistor TIP 2955',
                'category' => 'Komponen Aktif',
                'stock' => 100,
                'available' => 100,
                'unit' => 'pcs',
                'min_stock' => 20,
            ],
            [
                'name' => 'Transistor TIP 31C',
                'category' => 'Komponen Aktif',
                'stock' => 100,
                'available' => 100,
                'unit' => 'pcs',
                'min_stock' => 20,
            ],
            [
                'name' => 'Dioda 1N4007',
                'category' => 'Komponen Aktif',
                'stock' => 300,
                'available' => 300,
                'unit' => 'pcs',
                'min_stock' => 60,
            ],
            [
                'name' => 'Kapasitor Elco 47MF/50V',
                'category' => 'Komponen Pasif',
                'stock' => 1400,
                'available' => 1400,
                'unit' => 'pcs',
                'min_stock' => 250,
            ],
            [
                'name' => 'Kapasitor Elco 10MF/50V',
                'category' => 'Komponen Pasif',
                'stock' => 1000,
                'available' => 1000,
                'unit' => 'pcs',
                'min_stock' => 200,
            ],
            [
                'name' => 'Kapasitor Non-Polar 2A104J',
                'category' => 'Komponen Pasif',
                'stock' => 1250,
                'available' => 1250,
                'unit' => 'pcs',
                'min_stock' => 250,
            ],
            [
                'name' => 'Kapasitor Keramik 10PF',
                'category' => 'Komponen Pasif',
                'stock' => 0,
                'available' => 0,
                'unit' => 'pcs',
                'min_stock' => 100,
                'description' => 'Stok habis (urgent restock).',
            ],
            [
                'name' => 'Resistor Kapur 5W',
                'category' => 'Komponen Pasif',
                'stock' => 750,
                'available' => 750,
                'unit' => 'pcs',
                'min_stock' => 150,
            ],
            [
                'name' => 'Resistor Karbon Mix (100 Ohm - 100K Ohm)',
                'category' => 'Komponen Pasif',
                'stock' => 1000,
                'available' => 1000,
                'unit' => 'pcs',
                'min_stock' => 200,
                'description' => 'Stok bervariasi per ukuran, dominan 4K7 dan 10K.',
            ],
            [
                'name' => 'PCB Polos 20x10 cm',
                'category' => 'PCB & Konektor',
                'stock' => 1000,
                'available' => 1000,
                'unit' => 'pcs',
                'min_stock' => 200,
            ],
            [
                'name' => 'PCB Lubang IC 7x15.5 cm',
                'category' => 'PCB & Konektor',
                'stock' => 250,
                'available' => 250,
                'unit' => 'pcs',
                'min_stock' => 50,
            ],
            [
                'name' => 'PCB Lubang Transistor 8.5x16.5 cm',
                'category' => 'PCB & Konektor',
                'stock' => 150,
                'available' => 150,
                'unit' => 'pcs',
                'min_stock' => 30,
            ],
            [
                'name' => 'Terminal DC 3 Pin',
                'category' => 'PCB & Konektor',
                'stock' => 1000,
                'available' => 1000,
                'unit' => 'pcs',
                'min_stock' => 200,
            ],
            [
                'name' => 'Terminal DC 2 Pin',
                'category' => 'PCB & Konektor',
                'stock' => 700,
                'available' => 700,
                'unit' => 'pcs',
                'min_stock' => 140,
            ],
            [
                'name' => 'Trafo 3A',
                'category' => 'PCB & Konektor',
                'stock' => 5,
                'available' => 5,
                'unit' => 'pcs',
                'min_stock' => 2,
            ],
            [
                'name' => 'Kabel Tunggal 1x1.5',
                'category' => 'Kabel & Solder',
                'stock' => 15,
                'available' => 15,
                'unit' => 'roll',
                'min_stock' => 3,
                'description' => '8 biru dan 7 hitam.',
            ],
            [
                'name' => 'Kabel Speaker & Kabel AWG',
                'category' => 'Kabel & Solder',
                'stock' => 4,
                'available' => 4,
                'unit' => 'roll',
                'min_stock' => 1,
            ],
            [
                'name' => 'Kabel Electric',
                'category' => 'Kabel & Solder',
                'stock' => 1,
                'available' => 1,
                'unit' => 'roll',
                'min_stock' => 1,
            ],
            [
                'name' => 'Kabel RG 59',
                'category' => 'Kabel & Solder',
                'stock' => 1,
                'available' => 1,
                'unit' => 'roll',
                'min_stock' => 1,
            ],
            [
                'name' => 'Kit RCA',
                'category' => 'Kabel & Solder',
                'stock' => 1,
                'available' => 1,
                'unit' => 'roll',
                'min_stock' => 1,
            ],
            [
                'name' => 'Timah Solder 0.8mm',
                'category' => 'Kabel & Solder',
                'stock' => 10,
                'available' => 10,
                'unit' => 'roll',
                'min_stock' => 2,
            ],
            [
                'name' => 'Pasta Soldering 50G',
                'category' => 'Kabel & Solder',
                'stock' => 6,
                'available' => 6,
                'unit' => 'gram',
                'min_stock' => 2,
            ],
            [
                'name' => 'Amplas Kasar',
                'category' => 'Kabel & Solder',
                'stock' => 30,
                'available' => 30,
                'unit' => 'lembar',
                'min_stock' => 6,
            ],
            [
                'name' => 'Cutter Potong',
                'category' => 'Alat Bantu Habis Pakai',
                'stock' => 11,
                'available' => 11,
                'unit' => 'pcs',
                'min_stock' => 3,
                'description' => 'Isi cutter tercatat 15 pcs.',
            ],
            [
                'name' => 'Cutter PCB',
                'category' => 'Alat Bantu Habis Pakai',
                'stock' => 0,
                'available' => 0,
                'unit' => 'pcs',
                'min_stock' => 5,
                'description' => 'Stok habis, sisa isi cutter PCB 6 pcs.',
            ],
            [
                'name' => 'Sikat Kawat',
                'category' => 'Alat Bantu Habis Pakai',
                'stock' => 15,
                'available' => 15,
                'unit' => 'pcs',
                'min_stock' => 3,
            ],
            [
                'name' => 'LED Strip',
                'category' => 'Alat Bantu Habis Pakai',
                'stock' => 2,
                'available' => 2,
                'unit' => 'roll',
                'min_stock' => 1,
            ],
        ];

        foreach ($items as $item) {
            Supply::updateOrCreate([
                'name' => $item['name'],
            ], [
                ...$item,
                'code' => Supply::query()
                    ->withoutGlobalScopes()
                    ->where('name', $item['name'])
                    ->where('item_type', 'bahan')
                    ->value('code') ?? Equipment::generateCode('bahan'),
                'status' => 'active',
            ]);
        }
    }
}
