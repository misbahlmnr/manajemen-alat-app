<?php

namespace App\Support;

class InventoryCategories
{
    public static function remapAlat(?string $category, string $name = ''): string
    {
        $category = trim((string) $category);

        if ($category === '' || in_array($category, config('lab.equipment_categories', []), true)) {
            return $category;
        }

        return match ($category) {
            'Alat Ukur & Pengujian',
            'Alat Ukur & Pengujian Elektronika' => 'Alat ukur & uji elektronika',
            'Mesin & Perkakas',
            'Mesin & Perkakas Tangan Bengkel',
            'Solder & Perakitan',
            'Peralatan Solder & Perakitan' => 'Peralatan kerja bangku dan perakitan (assembly)',
            'Trainer Pembelajaran',
            'Modul Praktik / Trainer Pembelajaran' => 'Peralatan perangkat pengolah suara',
            'Sistem Keamanan',
            'Sistem Keamanan & Kamera Pengawas (CCTV)',
            'Multimedia',
            'Peralatan Multimedia & Pendukung',
            'Kamera',
            'Tripod',
            'Lighting' => 'Peralatan sistem video dan dokumentasi',
            'Mikrofon',
            'Mixer',
            'Headphone' => 'Peralatan perangkat pengolah suara',
            default => $category,
        };
    }

    public static function remapBahan(?string $category, string $name = ''): string
    {
        $category = trim((string) $category);

        if ($category === '' || in_array($category, config('lab.supply_categories', []), true)) {
            return $category;
        }

        $hay = mb_strtolower($name);

        return match ($category) {
            'Komponen Aktif',
            'Komponen Aktif (Semikonduktor & Dioda)' => 'Komponen elektronika aktif',
            'Komponen Pasif',
            'Komponen Pasif (Kapasitor & Resistor)',
            'Komponen Elektro' => 'Komponen elektronika pasif',
            'PCB & Konektor',
            'Papan Sirkuit (PCB) & Konektor' => self::containsAny($hay, ['pcb'])
                ? 'Pembuatan jalur rangkaian (PCB making)'
                : 'Kabel dan konektor audio video',
            'Kabel & Solder',
            'Kabel & Bahan Pembantu Solder',
            'Konsumabel' => self::containsAny($hay, ['solder', 'timah', 'pasta', 'amplas'])
                ? 'Penyambung dan perekat (soldering material)'
                : 'Kabel dan konektor audio video',
            'Alat Bantu Habis Pakai',
            'Alat Bantu Potong & Pembersih (Habis Pakai)' => self::containsAny($hay, ['led'])
                ? 'Modul sistem audio video'
                : 'Penyambung dan perekat (soldering material)',
            default => $category,
        };
    }

    /**
     * @param  list<string>  $needles
     */
    private static function containsAny(string $hay, array $needles): bool
    {
        foreach ($needles as $needle) {
            if ($needle !== '' && str_contains($hay, $needle)) {
                return true;
            }
        }

        return false;
    }
}
