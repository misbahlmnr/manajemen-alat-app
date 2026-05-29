<?php

namespace Database\Seeders;

use App\Models\Equipment;
use Illuminate\Database\Seeder;

class EquipmentSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['name' => 'Kamera DSLR Canon EOS 80D', 'category' => 'Kamera', 'stock' => 5, 'available' => 3, 'condition' => 'baik', 'location' => 'Rak A1', 'description' => 'Kamera DSLR profesional untuk rekaman video dan fotografi'],
            ['name' => 'Microphone Condenser Rode NT1', 'category' => 'Mikrofon', 'stock' => 8, 'available' => 6, 'condition' => 'baik', 'location' => 'Rak B2', 'description' => 'Mikrofon condenser berkualitas studio'],
            ['name' => 'Tripod Video Manfrotto', 'category' => 'Tripod', 'stock' => 10, 'available' => 7, 'condition' => 'baik', 'location' => 'Rak C1', 'description' => 'Tripod video profesional dengan fluid head'],
            ['name' => 'Audio Mixer Yamaha MG12XU', 'category' => 'Mixer', 'stock' => 3, 'available' => 2, 'condition' => 'baik', 'location' => 'Rak D1', 'description' => 'Mixer audio 12 channel dengan efek built-in'],
            ['name' => 'LED Panel Light YN600', 'category' => 'Lighting', 'stock' => 6, 'available' => 4, 'condition' => 'baik', 'location' => 'Rak F1', 'description' => 'Lampu LED panel untuk video production'],
            ['name' => 'Gimbal DJI Ronin-SC', 'category' => 'Stabilizer', 'stock' => 2, 'available' => 1, 'condition' => 'rusak_ringan', 'location' => 'Rak H1', 'description' => 'Gimbal stabilizer untuk kamera mirrorless'],
        ];

        foreach ($items as $item) {
            Equipment::create([
                ...$item,
                'code' => Equipment::generateCode('alat'),
                'item_type' => 'alat',
                'status' => 'active',
            ]);
        }
    }
}
