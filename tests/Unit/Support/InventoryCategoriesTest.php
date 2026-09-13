<?php

namespace Tests\Unit\Support;

use App\Support\InventoryCategories;
use Tests\TestCase;

class InventoryCategoriesTest extends TestCase
{
    public function test_alat_and_bahan_lists_match_tav_inventory(): void
    {
        $this->assertSame([
            'Alat ukur & uji elektronika',
            'Peralatan kerja bangku dan perakitan (assembly)',
            'Peralatan perangkat pengolah suara',
            'Peralatan sistem video dan dokumentasi',
        ], config('lab.equipment_categories'));

        $this->assertSame([
            'Komponen elektronika pasif',
            'Komponen elektronika aktif',
            'Pembuatan jalur rangkaian (PCB making)',
            'Penyambung dan perekat (soldering material)',
            'Kabel dan konektor audio video',
            'Modul sistem audio video',
        ], config('lab.supply_categories'));
    }

    public function test_old_alat_categories_are_remapped(): void
    {
        $this->assertSame(
            'Alat ukur & uji elektronika',
            InventoryCategories::remapAlat('Alat Ukur & Pengujian')
        );
        $this->assertSame(
            'Peralatan kerja bangku dan perakitan (assembly)',
            InventoryCategories::remapAlat('Mesin & Perkakas')
        );
        $this->assertSame(
            'Peralatan kerja bangku dan perakitan (assembly)',
            InventoryCategories::remapAlat('Solder & Perakitan')
        );
        $this->assertSame(
            'Peralatan perangkat pengolah suara',
            InventoryCategories::remapAlat('Trainer Pembelajaran')
        );
        $this->assertSame(
            'Peralatan sistem video dan dokumentasi',
            InventoryCategories::remapAlat('Sistem Keamanan')
        );
        $this->assertSame(
            'Peralatan sistem video dan dokumentasi',
            InventoryCategories::remapAlat('Multimedia')
        );
        $this->assertSame(
            'Alat ukur & uji elektronika',
            InventoryCategories::remapAlat('Alat ukur & uji elektronika')
        );
    }

    public function test_old_bahan_categories_are_remapped(): void
    {
        $this->assertSame(
            'Komponen elektronika aktif',
            InventoryCategories::remapBahan('Komponen Aktif', 'Transistor TIP 31C')
        );
        $this->assertSame(
            'Komponen elektronika pasif',
            InventoryCategories::remapBahan('Komponen Pasif', 'Resistor 10K')
        );
        $this->assertSame(
            'Pembuatan jalur rangkaian (PCB making)',
            InventoryCategories::remapBahan('PCB & Konektor', 'PCB Polos 20x10')
        );
        $this->assertSame(
            'Kabel dan konektor audio video',
            InventoryCategories::remapBahan('PCB & Konektor', 'Terminal DC 3 Pin')
        );
        $this->assertSame(
            'Penyambung dan perekat (soldering material)',
            InventoryCategories::remapBahan('Kabel & Solder', 'Timah Solder 0.8mm')
        );
        $this->assertSame(
            'Kabel dan konektor audio video',
            InventoryCategories::remapBahan('Kabel & Solder', 'Kabel Speaker')
        );
    }
}
