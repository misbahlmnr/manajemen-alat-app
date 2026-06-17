<?php

return [
    'school_name' => env('LAB_SCHOOL_NAME', 'SMK Negeri 7 Bekasi'),
    'lab_name' => env('LAB_NAME', 'Laboratorium Audio Video'),

    'equipment_categories' => [
        'Kamera',
        'Mikrofon',
        'Tripod',
        'Mixer',
        'Lighting',
        'Headphone',
        'Stabilizer',
        'Alat Elektro',
        'Tools',
        'Kabel',
    ],

    'supply_categories' => [
        'Komponen Elektro',
        'Konsumabel',
        'Kabel & Konektor',
        'Solder & Flux',
        'PCB & Prototyping',
        'Bahan AV',
    ],

    'supply_units' => [
        'pcs',
        'pack',
        'roll',
        'meter',
        'set',
        'botol',
    ],

    'class_options' => [
        'X TE 1',
        'X TE 2',
        'X TE 3',
        'X TE 4',
        'XI TAV 1',
        'XI TAV 2',
        'XI TAV 3',
        'XII TAV 1',
        'XII TAV 2',
        'XII TAV 3',
    ],

    'jurusan_default' => 'Audio Video',

    'collateral_statuses' => [
        'dititipkan' => 'Dititipkan',
        'ditahan' => 'Digunakan Sebagai Jaminan',
        'menunggu_kompensasi' => 'Menunggu Kompensasi',
        'dikembalikan' => 'Sudah Diambil',
        'dibatalkan' => 'Dibatalkan',
    ],

    'collateral_card_types' => [
        'kartu_pelajar' => 'Kartu Pelajar',
        'kartu_siswa' => 'Kartu Siswa',
        'lainnya' => 'Lainnya',
    ],

    'loan_statuses' => [
        'diminta' => 'Menunggu Persetujuan',
        'antrian' => 'Antrian',
        'disetujui' => 'Disetujui',
        'ditolak' => 'Ditolak',
        'dipinjam' => 'Dipinjam',
        'terlambat' => 'Terlambat',
        'menunggu_inspeksi' => 'Menunggu Inspeksi',
        'dikembalikan' => 'Dikembalikan',
        'dibatalkan' => 'Dibatalkan',
    ],

    'practicum_subjects' => [
        'PRE (Penerapan Rangkaian Elektronika)',
        'PAM (Pembelajaran Alat Mikrokontroler)',
        'PSRT (Penerapan Sistem Radio Televisi)',
        'PISAV (Perancangan Instalasi Audio Video)',
        'Dasar Elektronika',
    ],

    'borrow_reasons' => [
        'reguler' => 'Sesuai jadwal mapel',
        'lanjutan' => 'Lanjutan praktikum di lab',
    ],

    'schedule_types' => [
        'mingguan' => 'Jadwal Mingguan',
        'khusus' => 'Acara Khusus',
    ],

    'schedule_days' => [
        'senin' => 'Senin',
        'selasa' => 'Selasa',
        'rabu' => 'Rabu',
        'kamis' => 'Kamis',
        'jumat' => 'Jumat',
        'sabtu' => 'Sabtu',
    ],

    'user_import' => [
        'default_password' => env('LAB_USER_IMPORT_DEFAULT_PASSWORD', 'Password123'),
        'max_rows' => (int) env('LAB_USER_IMPORT_MAX_ROWS', 500),
        'allowed_extensions' => ['xlsx', 'xls', 'csv'],
    ],
];
