<?php

namespace Database\Seeders;

use App\Models\Equipment;
use Illuminate\Database\Seeder;

class EquipmentSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['name' => 'Audio Function Generator (AFG)', 'category' => 'Alat Ukur & Pengujian', 'stock' => 10, 'available' => 10, 'unit' => 'unit', 'qty_baik' => 10, 'qty_rusak_ringan' => 0, 'qty_rusak_berat' => 0, 'description' => '6 analog dan 4 digital.'],
            ['name' => 'AVO Meter Analog', 'category' => 'Alat Ukur & Pengujian', 'stock' => 35, 'available' => 25, 'unit' => 'unit', 'qty_baik' => 25, 'qty_rusak_ringan' => 10, 'qty_rusak_berat' => 0, 'description' => '25 unit baik, 10 rusak ringan.'],
            ['name' => 'AVO Meter Digital', 'category' => 'Alat Ukur & Pengujian', 'stock' => 8, 'available' => 6, 'unit' => 'unit', 'qty_baik' => 6, 'qty_rusak_ringan' => 1, 'qty_rusak_berat' => 1, 'description' => 'Sebagian unit rusak berat.'],
            ['name' => 'Osciloscop Analog', 'category' => 'Alat Ukur & Pengujian', 'stock' => 5, 'available' => 3, 'unit' => 'unit', 'qty_baik' => 3, 'qty_rusak_ringan' => 2, 'qty_rusak_berat' => 0, 'description' => 'Perlu perbaikan/maintenance.'],
            ['name' => 'Osciloscop Digital', 'category' => 'Alat Ukur & Pengujian', 'stock' => 7, 'available' => 7, 'unit' => 'unit', 'qty_baik' => 7, 'qty_rusak_ringan' => 0, 'qty_rusak_berat' => 0],
            ['name' => 'Power Supply Portable', 'category' => 'Alat Ukur & Pengujian', 'stock' => 3, 'available' => 3, 'unit' => 'unit', 'qty_baik' => 3, 'qty_rusak_ringan' => 0, 'qty_rusak_berat' => 0],
            ['name' => 'Bor Duduk', 'category' => 'Mesin & Perkakas', 'stock' => 9, 'available' => 7, 'unit' => 'unit', 'qty_baik' => 7, 'qty_rusak_ringan' => 1, 'qty_rusak_berat' => 1, 'description' => 'Terdiri dari bor kecil dan besar; sebagian rusak berat.'],
            ['name' => 'Bor Tangan', 'category' => 'Mesin & Perkakas', 'stock' => 2, 'available' => 2, 'unit' => 'unit', 'qty_baik' => 2, 'qty_rusak_ringan' => 0, 'qty_rusak_berat' => 0],
            ['name' => 'Gerinda', 'category' => 'Mesin & Perkakas', 'stock' => 4, 'available' => 4, 'unit' => 'unit', 'qty_baik' => 4, 'qty_rusak_ringan' => 0, 'qty_rusak_berat' => 0, 'description' => '2 gerinda duduk, 2 gerinda tangan.'],
            ['name' => 'Jigsaw', 'category' => 'Mesin & Perkakas', 'stock' => 3, 'available' => 3, 'unit' => 'unit', 'qty_baik' => 3, 'qty_rusak_ringan' => 0, 'qty_rusak_berat' => 0],
            ['name' => 'Mini Rotary Tool', 'category' => 'Mesin & Perkakas', 'stock' => 8, 'available' => 8, 'unit' => 'unit', 'qty_baik' => 8, 'qty_rusak_ringan' => 0, 'qty_rusak_berat' => 0],
            ['name' => 'Gergaji Manual', 'category' => 'Mesin & Perkakas', 'stock' => 1, 'available' => 1, 'unit' => 'unit', 'qty_baik' => 1, 'qty_rusak_ringan' => 0, 'qty_rusak_berat' => 0],
            ['name' => 'PCB Holder', 'category' => 'Mesin & Perkakas', 'stock' => 10, 'available' => 10, 'unit' => 'unit', 'qty_baik' => 10, 'qty_rusak_ringan' => 0, 'qty_rusak_berat' => 0],
            ['name' => 'Solder Tangan', 'category' => 'Solder & Perakitan', 'stock' => 13, 'available' => 13, 'unit' => 'unit', 'qty_baik' => 13, 'qty_rusak_ringan' => 0, 'qty_rusak_berat' => 0],
            ['name' => 'Solder Uap (Rework Station)', 'category' => 'Solder & Perakitan', 'stock' => 7, 'available' => 7, 'unit' => 'unit', 'qty_baik' => 7, 'qty_rusak_ringan' => 0, 'qty_rusak_berat' => 0],
            ['name' => 'Solder Pot', 'category' => 'Solder & Perakitan', 'stock' => 4, 'available' => 4, 'unit' => 'unit', 'qty_baik' => 4, 'qty_rusak_ringan' => 0, 'qty_rusak_berat' => 0],
            ['name' => 'Penyangga Solder', 'category' => 'Solder & Perakitan', 'stock' => 32, 'available' => 32, 'unit' => 'unit', 'qty_baik' => 32, 'qty_rusak_ringan' => 0, 'qty_rusak_berat' => 0],
            ['name' => 'Welding Head Cleaner', 'category' => 'Solder & Perakitan', 'stock' => 25, 'available' => 25, 'unit' => 'unit', 'qty_baik' => 25, 'qty_rusak_ringan' => 0, 'qty_rusak_berat' => 0],
            ['name' => 'Trainer Mikrokontroler', 'category' => 'Trainer Pembelajaran', 'stock' => 6, 'available' => 6, 'unit' => 'unit', 'qty_baik' => 6, 'qty_rusak_ringan' => 0, 'qty_rusak_berat' => 0],
            ['name' => 'Trainer Pre-Amp', 'category' => 'Trainer Pembelajaran', 'stock' => 10, 'available' => 10, 'unit' => 'unit', 'qty_baik' => 10, 'qty_rusak_ringan' => 0, 'qty_rusak_berat' => 0],
            ['name' => 'Trainer Arduino', 'category' => 'Trainer Pembelajaran', 'stock' => 10, 'available' => 10, 'unit' => 'unit', 'qty_baik' => 10, 'qty_rusak_ringan' => 0, 'qty_rusak_berat' => 0],
            ['name' => 'CCTV Outdoor', 'category' => 'Sistem Keamanan', 'stock' => 27, 'available' => 27, 'unit' => 'unit', 'qty_baik' => 27, 'qty_rusak_ringan' => 0, 'qty_rusak_berat' => 0],
            ['name' => 'CCTV Indoor', 'category' => 'Sistem Keamanan', 'stock' => 17, 'available' => 17, 'unit' => 'unit', 'qty_baik' => 17, 'qty_rusak_ringan' => 0, 'qty_rusak_berat' => 0],
            ['name' => 'Infocus (Proyektor)', 'category' => 'Multimedia', 'stock' => 2, 'available' => 2, 'unit' => 'unit', 'qty_baik' => 2, 'qty_rusak_ringan' => 0, 'qty_rusak_berat' => 0],
            ['name' => 'Printer', 'category' => 'Multimedia', 'stock' => 11, 'available' => 9, 'unit' => 'unit', 'qty_baik' => 9, 'qty_rusak_ringan' => 2, 'qty_rusak_berat' => 0, 'description' => 'Termasuk 1 printer 3D; sebagian unit rusak ringan.'],
            ['name' => 'Toolset (Kotak Perkakas)', 'category' => 'Multimedia', 'stock' => 30, 'available' => 30, 'unit' => 'paket', 'qty_baik' => 30, 'qty_rusak_ringan' => 0, 'qty_rusak_berat' => 0],
            ['name' => 'Rompi Safety', 'category' => 'Multimedia', 'stock' => 10, 'available' => 10, 'unit' => 'pcs', 'qty_baik' => 10, 'qty_rusak_ringan' => 0, 'qty_rusak_berat' => 0],
            ['name' => 'Box Komponen', 'category' => 'Multimedia', 'stock' => 27, 'available' => 27, 'unit' => 'unit', 'qty_baik' => 27, 'qty_rusak_ringan' => 0, 'qty_rusak_berat' => 0, 'description' => 'Penyimpanan resistor, LED, IC, dan komponen kecil lain.'],
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
                'status' => 'tersedia',
            ]);
        }
    }
}
