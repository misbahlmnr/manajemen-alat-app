<?php

namespace Database\Seeders;

use App\Models\Equipment;
use Illuminate\Database\Seeder;

class EquipmentSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['name' => 'Audio Function Generator (AFG)', 'category' => 'Alat Ukur & Pengujian', 'stock' => 10, 'available' => 10, 'unit' => 'unit', 'condition' => 'baik', 'description' => '6 analog dan 4 digital.'],
            ['name' => 'AVO Meter Analog', 'category' => 'Alat Ukur & Pengujian', 'stock' => 35, 'available' => 35, 'unit' => 'unit', 'condition' => 'baik', 'description' => 'Sebagian unit kondisi rusak ringan.'],
            ['name' => 'AVO Meter Digital', 'category' => 'Alat Ukur & Pengujian', 'stock' => 8, 'available' => 8, 'unit' => 'unit', 'condition' => 'rusak_ringan', 'description' => 'Sebagian unit rusak berat.'],
            ['name' => 'Osciloscop Analog', 'category' => 'Alat Ukur & Pengujian', 'stock' => 5, 'available' => 5, 'unit' => 'unit', 'condition' => 'rusak_ringan', 'description' => 'Perlu perbaikan/maintenance.'],
            ['name' => 'Osciloscop Digital', 'category' => 'Alat Ukur & Pengujian', 'stock' => 7, 'available' => 7, 'unit' => 'unit', 'condition' => 'baik'],
            ['name' => 'Power Supply Portable', 'category' => 'Alat Ukur & Pengujian', 'stock' => 3, 'available' => 3, 'unit' => 'unit', 'condition' => 'baik'],
            ['name' => 'Bor Duduk', 'category' => 'Mesin & Perkakas', 'stock' => 9, 'available' => 9, 'unit' => 'unit', 'condition' => 'baik', 'description' => 'Terdiri dari bor kecil dan besar; sebagian rusak berat.'],
            ['name' => 'Bor Tangan', 'category' => 'Mesin & Perkakas', 'stock' => 2, 'available' => 2, 'unit' => 'unit', 'condition' => 'baik'],
            ['name' => 'Gerinda', 'category' => 'Mesin & Perkakas', 'stock' => 4, 'available' => 4, 'unit' => 'unit', 'condition' => 'baik', 'description' => '2 gerinda duduk, 2 gerinda tangan.'],
            ['name' => 'Jigsaw', 'category' => 'Mesin & Perkakas', 'stock' => 3, 'available' => 3, 'unit' => 'unit', 'condition' => 'baik'],
            ['name' => 'Mini Rotary Tool', 'category' => 'Mesin & Perkakas', 'stock' => 8, 'available' => 8, 'unit' => 'unit', 'condition' => 'baik'],
            ['name' => 'Gergaji Manual', 'category' => 'Mesin & Perkakas', 'stock' => 1, 'available' => 1, 'unit' => 'unit', 'condition' => 'baik'],
            ['name' => 'PCB Holder', 'category' => 'Mesin & Perkakas', 'stock' => 10, 'available' => 10, 'unit' => 'unit', 'condition' => 'baik'],
            ['name' => 'Solder Tangan', 'category' => 'Solder & Perakitan', 'stock' => 13, 'available' => 13, 'unit' => 'unit', 'condition' => 'baik'],
            ['name' => 'Solder Uap (Rework Station)', 'category' => 'Solder & Perakitan', 'stock' => 7, 'available' => 7, 'unit' => 'unit', 'condition' => 'baik'],
            ['name' => 'Solder Pot', 'category' => 'Solder & Perakitan', 'stock' => 4, 'available' => 4, 'unit' => 'unit', 'condition' => 'baik'],
            ['name' => 'Penyangga Solder', 'category' => 'Solder & Perakitan', 'stock' => 32, 'available' => 32, 'unit' => 'unit', 'condition' => 'baik'],
            ['name' => 'Welding Head Cleaner', 'category' => 'Solder & Perakitan', 'stock' => 25, 'available' => 25, 'unit' => 'unit', 'condition' => 'baik'],
            ['name' => 'Trainer Mikrokontroler', 'category' => 'Trainer Pembelajaran', 'stock' => 6, 'available' => 6, 'unit' => 'unit', 'condition' => 'baik'],
            ['name' => 'Trainer Pre-Amp', 'category' => 'Trainer Pembelajaran', 'stock' => 10, 'available' => 10, 'unit' => 'unit', 'condition' => 'baik'],
            ['name' => 'Trainer Arduino', 'category' => 'Trainer Pembelajaran', 'stock' => 10, 'available' => 10, 'unit' => 'unit', 'condition' => 'baik'],
            ['name' => 'CCTV Outdoor', 'category' => 'Sistem Keamanan', 'stock' => 27, 'available' => 27, 'unit' => 'unit', 'condition' => 'baik'],
            ['name' => 'CCTV Indoor', 'category' => 'Sistem Keamanan', 'stock' => 17, 'available' => 17, 'unit' => 'unit', 'condition' => 'baik'],
            ['name' => 'Infocus (Proyektor)', 'category' => 'Multimedia', 'stock' => 2, 'available' => 2, 'unit' => 'unit', 'condition' => 'baik'],
            ['name' => 'Printer', 'category' => 'Multimedia', 'stock' => 11, 'available' => 11, 'unit' => 'unit', 'condition' => 'baik', 'description' => 'Termasuk 1 printer 3D; sebagian unit rusak ringan.'],
            ['name' => 'Toolset (Kotak Perkakas)', 'category' => 'Multimedia', 'stock' => 30, 'available' => 30, 'unit' => 'paket', 'condition' => 'baik'],
            ['name' => 'Rompi Safety', 'category' => 'Multimedia', 'stock' => 10, 'available' => 10, 'unit' => 'pcs', 'condition' => 'baik'],
            ['name' => 'Box Komponen', 'category' => 'Multimedia', 'stock' => 27, 'available' => 27, 'unit' => 'unit', 'condition' => 'baik', 'description' => 'Penyimpanan resistor, LED, IC, dan komponen kecil lain.'],
        ];

        foreach ($items as $item) {
            Equipment::updateOrCreate([
                'name' => $item['name'],
                'item_type' => 'alat',
            ], [
                ...$item,
                'code' => Equipment::query()
                    ->where('name', $item['name'])
                    ->where('item_type', 'alat')
                    ->value('code') ?? Equipment::generateCode('alat'),
                'item_type' => 'alat',
                'status' => 'active',
            ]);
        }
    }
}
