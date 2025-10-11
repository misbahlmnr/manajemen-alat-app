## 🧭 **PROJECT SUMMARY**

**Nama Proyek:** Sistem Informasi Akademik SMP dengan Fitur Adaptive Learning
**Stack Teknologi:**

-   **Backend:** Laravel
-   **Frontend:** React JS + TailwindCSS + ShadcnUI
-   **Database:** PostgreSQL
-   **AI/ML Component:** Algoritma Adaptive Learning berbasis performa siswa
-   **Deployment Target:** Web-based Application

---

## 👥 **User Roles dan Hak Akses**

### 1. **Admin**

-   Mengelola data master:

    -   CRUD **Guru**, **Siswa**, dan **Admin lain**
    -   CRUD **Kelas**, **Mapel (Mata Pelajaran)**, **Tahun Ajaran**, **Semester**

-   Mengelola jadwal pelajaran dan ujian
-   Mengelola aturan rekomendasi adaptif (Adaptive Learning Rules)
-   Melihat dan mengekspor laporan (nilai, absensi, aktivitas siswa, dsb) ke format **Excel**
-   Monitoring performa guru dan siswa
-   Manajemen hak akses & pengaturan sistem

### 2. **Guru**

-   Melihat jadwal mengajar
-   Upload dan kelola **materi pembelajaran**
-   Membuat dan mengelola **tugas / kuis / ujian**
-   Memberikan **penilaian (manual atau otomatis)**
-   Melihat hasil adaptasi sistem (materi yang direkomendasikan untuk siswanya)
-   Melakukan **absensi siswa** pada kelas yang diampu
-   Mengatur tingkat kesulitan dan kategori materi untuk mendukung sistem adaptive learning

### 3. **Siswa**

-   Melihat **jadwal pelajaran & ujian**
-   Mengakses **materi pembelajaran** (hanya materi guru yang tersedia di kelasnya)
-   Mengerjakan **tugas / kuis / ujian online**
-   Melihat **nilai & riwayat tugas**
-   Melihat **materi yang direkomendasikan** berdasarkan hasil belajar (fitur adaptive learning)
-   Melihat riwayat **absensi** dan laporan hasil belajar pribadi

---

## 🧩 **FITUR UTAMA**

### 1. **Manajemen Data Akademik**

-   CRUD data **guru, siswa, kelas, mapel, jadwal**
-   Manajemen **tahun ajaran & semester aktif**
-   Relasi data antar entitas (kelas ↔ mapel ↔ guru ↔ siswa)

### 2. **Manajemen Pembelajaran**

-   Guru upload **materi (pdf, video, link, dokumen, dsb)**
-   Materi dikategorikan berdasarkan **kelas, mapel, dan tingkat kesulitan**
-   Tugas / kuis / ujian berbasis soal objektif dan esai
-   Penilaian otomatis dan manual

### 3. **Absensi**

-   Absensi harian oleh guru berdasarkan jadwal
-   Data absensi terhubung dengan kelas dan mapel
-   Laporan absensi bisa diekspor ke Excel

### 4. **Laporan Akademik**

-   Nilai per siswa, per kelas, per mapel, dan rata-rata umum
-   Laporan absensi siswa dan performa belajar
-   Laporan aktivitas guru
-   Semua laporan bisa **diekspor ke Excel**

### 5. **Adaptive Learning Algorithm**

-   Sistem menganalisis **nilai tugas/kuis siswa**
-   Jika nilai rendah pada topik tertentu, sistem akan **merekomendasikan materi terkait**
-   Rekomendasi berdasarkan:

    -   Kesamaan topik/kategori materi
    -   Aturan yang diatur guru/admin
    -   Riwayat performa siswa

-   Guru dan admin bisa meninjau serta mengatur ulang rekomendasi
-   Siswa dapat melihat daftar rekomendasi materi di dashboard-nya

### 6. **Dashboard**

-   **Admin:** Statistik pengguna, nilai rata-rata, absensi, aktivitas
-   **Guru:** Jadwal, daftar siswa, statistik nilai kelas
-   **Siswa:** Jadwal, nilai, dan rekomendasi adaptif

---

## 🧠 **ALGORITMA ADAPTIVE LEARNING (AI COMPONENT)**

1. **Input Data:**

    - Nilai tugas / kuis per siswa
    - Materi pembelajaran (topik, kategori, tingkat kesulitan)
    - Riwayat belajar siswa

2. **Logika Sistem:**

    - Jika nilai siswa < ambang batas (misal 70), sistem mencari materi dengan kategori/topik yang sama
    - Sistem memberi prioritas materi dengan tingkat kesulitan lebih rendah
    - Guru/Admin dapat memodifikasi aturan ambang batas, topik, atau rekomendasi manual

3. **Output:**

    - Daftar materi yang direkomendasikan muncul di dashboard siswa
    - Sistem mencatat efektivitas (apakah siswa memperbaiki nilai setelah melihat rekomendasi)

---

## 📁 **STRUKTUR ENTITAS DATABASE (Ringkas)**

-   `users` (id, name, email, password, role)
-   `kelas` (id, nama, tingkat, wali_kelas_id)
-   `mapel` (id, nama, guru_id)
-   `jadwal` (id, kelas_id, mapel_id, guru_id, hari, jam_mulai, jam_selesai)
-   `materi` (id, mapel_id, guru_id, kelas_id, judul, deskripsi, tingkat_kesulitan, file_path)
-   `tugas` (id, mapel_id, guru_id, kelas_id, judul, tipe, deadline)
-   `nilai` (id, tugas_id, siswa_id, skor)
-   `absensi` (id, jadwal_id, siswa_id, status, tanggal)
-   `adaptive_rules` (id, mapel_id, min_score, kategori_rekomendasi)
-   `materi_rekomendasi` (id, siswa_id, materi_id, alasan, status)

---

## 🎯 **TUJUAN AKHIR AI AGENT**

AI Agent harus:

-   Memahami hubungan antar role dan modul.
-   Mengotomasi tugas seperti:

    -   Menyusun ERD, endpoint API, dan skema basis data.
    -   Mendesain arsitektur frontend React yang modular (component-based).
    -   Mengimplementasikan algoritma adaptive learning berbasis data nilai dan materi.
    -   Menghasilkan laporan otomatis berbasis data akademik.

-   Menjamin sistem berjalan efisien, terstruktur, dan mudah dikembangkan.

---
