<?php

return [
    'school_name' => env('LAB_SCHOOL_NAME', 'SMK Negeri 7 Bekasi'),
    'lab_name' => env('LAB_NAME', 'Laboratorium Audio Video'),

    'equipment_categories' => [
        'Alat ukur & uji elektronika',
        'Peralatan kerja bangku dan perakitan (assembly)',
        'Peralatan perangkat pengolah suara',
        'Peralatan sistem video dan dokumentasi',
    ],

    'supply_categories' => [
        'Komponen elektronika pasif',
        'Komponen elektronika aktif',
        'Pembuatan jalur rangkaian (PCB making)',
        'Penyambung dan perekat (soldering material)',
        'Kabel dan konektor audio video',
        'Modul sistem audio video',
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
        // Seed/fallback saja. Opsi aktif dikelola admin di Siswa → Opsi kelas & angkatan.
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

    'academic_year' => [
        'current_start' => (int) env('LAB_ACADEMIC_YEAR_START', 2026),
    ],

    'jurusan_default' => 'Audio Video',

    'collateral_statuses' => [
        'dititipkan' => 'Belum diterima',
        'ditahan' => 'Ditahan',
        'menunggu_kompensasi' => 'Menunggu Kompensasi',
        'dikembalikan' => 'Sudah dikembalikan',
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

    'submission_statuses' => [
        'diminta' => 'Menunggu Persetujuan',
        'antrian' => 'Antrian',
        'diproses' => 'Diproses',
        'selesai' => 'Selesai',
        'dibatalkan' => 'Dibatalkan',
    ],

    'practicum_subjects' => [
        'DTE (Dasar Teknik Elektronika)',
        'TPMM (Teknik Pemrograman Mikroprosessor dan Mikrokontroller)',
        'PMM (Pemrograman Mikroprosessor dan Mikrokontroller)',
        'PRE (Penerapan Rangkaian Elektronika)',
        'PSRT (Penerapan Sistem Radio Televisi)',
        'PISAV (Penerapan dan Instalasi Sistem Audio Video)',
        'PPPAV (Perawatan dan Perbaikan Peralatan Audio dan Video)',
        'PKK (Produk Kreatif dan Kewirausahaan)',
    ],

    'borrow_reasons' => [
        'reguler' => 'Praktek Lab',
        'lanjutan' => 'Pribadi',
        'lomba' => 'Lomba',
    ],

    'bawa_pulang_categories' => [
        'lomba' => 'Lomba',
        'lanjutan' => 'Bawa pulang',
    ],

    'lab_room_options' => [
        'Ruang Assembly',
        'Ruang Komputer',
        'Ruang Instalasi',
        'Ruang Terbuka',
    ],

    'school_timezone' => env('LAB_TIMEZONE', 'Asia/Jakarta'),

    // Testing only. Set LAB_FAKE_NOW=2026-09-14 09:00:00 to pretend that datetime.
    // Empty / unset = jam nyata. Restart PHP (and config:clear if cached) after changing.
    'fake_now' => env('LAB_FAKE_NOW'),

    'queue' => [
        'lab_open_time' => env('LAB_OPEN_TIME', '07:00'),
        'school_close_time' => env('LAB_SCHOOL_CLOSE_TIME', '17:00'),
        'bawa_pulang_max_days' => (int) env('LAB_BAWA_PULANG_MAX_DAYS', 1),
        'booking_horizon_days' => (int) env('LAB_BOOKING_HORIZON_DAYS', 7),
        'type_scores' => [
            'bawa_pulang_lomba' => 400,
            'praktikum' => 300,
            'pribadi' => 200,
            'bawa_pulang_project' => 100,
        ],
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

    'inventory_statuses' => [
        'tersedia' => 'Tersedia',
        'tidak_tersedia' => 'Tidak Tersedia',
    ],

    'equipment_conditions' => [
        'baik' => 'Baik',
        'rusak_ringan' => 'Rusak Ringan',
        'rusak_berat' => 'Rusak Berat',
    ],

    'user_import' => [
        'default_password' => env('LAB_USER_IMPORT_DEFAULT_PASSWORD', 'Password123'),
        'max_rows' => (int) env('LAB_USER_IMPORT_MAX_ROWS', 500),
        'allowed_extensions' => ['xlsx', 'xls', 'csv'],
    ],
];
