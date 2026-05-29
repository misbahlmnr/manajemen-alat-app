# Prompt Lovable — Perbaikan Sistem Peminjaman Lab AV

> **Repo:** `misbahlmnr/patmawati-peminjaman-alat`  
> **Cara pakai:** Copy seluruh isi section **PROMPT** di bawah ini, paste ke Lovable.  
> **Tips:** Jika terlalu besar, pecah per **Bagian A → B → C** (penanda ada di akhir file).

---

## PROMPT (copy dari sini ↓)

```
Perbarui aplikasi Sistem Peminjaman Peralatan Lab Audio Video (SMK Negeri 7 Bekasi) dengan perubahan berikut. Pertahankan branding, bahasa Indonesia, dan stack yang ada (React + Vite + TypeScript + shadcn/ui + Tailwind). Jangan hapus fitur yang sudah ada kecuali perlu disesuaikan.

---

## 1. DUA JENIS BARANG: ALAT vs BAHAN (semua role)

Saat ini inventaris masih dicampur (kamera, mikrofon, tripod, dll). Ubah model data dan UI agar ada 2 jenis barang:

### A. Alat (dapat dipinjam & harus dikembalikan)

Contoh: tang, obeng, palu kecil, kamera, mikrofon, tripod, mixer, kabel, lighting, gimbal, headphone, dll.

- Memiliki stok total dan stok tersedia
- Status kondisi: baik / rusak ringan / rusak berat
- Lokasi rak
- Setelah dipinjam harus dikembalikan

### B. Bahan (sekali pakai / consumable)

Contoh: resistor, dioda, relay, timah solder, kabel jumper, IC, kapasitor, LED, dll.

- Tidak dikembalikan setelah dipakai
- Stok diukur per unit/pack (misal: 100 pcs, 1 roll, 1 pack)
- Info tersedia = sisa stok yang masih bisa diajukan
- Tidak perlu field "kondisi" atau "lokasi rak" (opsional: lokasi gudang)

### Perubahan data model

Tambahkan field di entitas Equipment/Item:

- `itemType: 'alat' | 'bahan'`
- Untuk bahan: `unit` (pcs, pack, roll, meter) dan `stockRemaining`
- Untuk alat: tetap `stock`, `available`, `condition`, `location`

Update mock data agar realistis untuk lab praktik AV + elektronika (campuran alat dan bahan).

### Dampak di semua role

- **Admin**: CRUD peralatan dengan pilihan jenis (Alat/Bahan), form berbeda per jenis
- **Guru**: lihat inventaris terpisah/tab Alat vs Bahan
- **Siswa**: katalog terpisah, badge jenis barang jelas
- **Dashboard semua role**: statistik pisah (total alat, total bahan, stok menipis bahan, alat sedang dipinjam)
- **Laporan**: filter & export per jenis barang
- **Sidebar/label**: gunakan istilah "Alat" dan "Bahan", bukan hanya "Peralatan" generik

---

## 2. PROSES PEMINJAMAN TERPISAH: ALAT vs BAHAN (role Siswa)

Halaman "Ajukan Peminjaman" harus dipisah menjadi 2 alur berbeda (tab atau 2 sub-menu):

### Tab/Alur 1: Pinjam Alat

- Keranjang multi-item alat
- Wajib: guru pembimbing, tanggal & waktu pinjam, tanggal & waktu batas pengembalian, catatan keperluan
- Validasi: qty tidak melebihi stok tersedia
- Setelah submit → status `diminta`, menunggu verifikasi admin
- Tampilkan info: "Alat harus dikembalikan sebelum batas waktu"

### Tab/Alur 2: Ambil Bahan

- Keranjang bahan sekali pakai
- Wajib: guru pembimbing, jumlah per item, catatan keperluan/praktikum
- TIDAK perlu tanggal pengembalian (karena tidak dikembalikan)
- Validasi: qty tidak melebihi stok tersisa
- Setelah submit → status langsung `disetujui` atau `diambil` (sesuaikan workflow), stok bahan berkurang
- Tampilkan info: "Bahan sekali pakai, tidak perlu dikembalikan"

### Info ketersediaan (penting)

- **Alat**: tampilkan "Tersedia: X dari Y unit" + indikator hijau/kuning/merah
- **Bahan**: tampilkan "Stok: X pcs/pack" + peringatan jika stok < 10 atau habis (disabled tombol tambah)

### Setelah submit HARUS benar-benar menyimpan data

- Jangan hanya `console.log` atau modal sukses palsu
- Tambahkan state global (Context atau Zustand) atau localStorage agar data pinjaman persist saat navigasi
- Update stok tersedia alat/bahan setelah pengajuan disetujui

---

## 3. MENU "PEMINJAMAN SAYA" (Siswa) — tambah DETAIL

Saat ini daftar kurang jelas. Perbaiki:

- Filter hanya peminjaman milik user yang login (`borrowerId === user.id`)
- Pisah tab: **Alat** | **Bahan** | **Semua**
- Setiap item punya tombol **"Lihat Detail"** → modal atau halaman detail berisi:
  - Jenis barang (Alat/Bahan)
  - Nama, qty, status (badge)
  - Guru pembimbing
  - Tanggal & waktu pinjam
  - Batas pengembalian (hanya alat)
  - Catatan keperluan
  - Timeline status: diminta → disetujui → dipinjam → dikembalikan
  - Untuk alat aktif/terlambat: tombol **"Ajukan Pengembalian"** yang benar-benar mengubah status
- Hitung sisa waktu sampai deadline (jam/hari) dengan indikator warna

---

## 4. MENU RIWAYAT — tambah DETAIL (Guru & Siswa)

Jangan hanya card ringkas. Tambahkan:

- Tabel atau list dengan kolom: tanggal, jenis (Alat/Bahan), nama barang, qty, status, guru pembimbing
- Klik baris / tombol Detail → modal/halaman detail lengkap (sama seperti Peminjaman Saya)
- Filter: rentang tanggal, jenis barang, status
- Guru: lihat riwayat semua siswa; Siswa: hanya riwayat sendiri

---

## 5. FUNGSI HARUS JALAN (bukan demo kosong)

Perbaiki semua aksi yang saat ini hanya `console.log`:

### A. Pinjam (Siswa)

- Tombol pinjam di halaman Peralatan → arahkan ke Ajukan Peminjaman dengan item pre-selected, ATAU tambah langsung ke keranjang
- Submit pengajuan alat/bahan → data masuk ke state global + muncul di Peminjaman Saya
- Stok berkurang setelah admin menyetujui

### B. Notifikasi (semua role yang punya menu Notifikasi)

- Buat halaman `/notifications` yang benar-benar menampilkan daftar notifikasi
- Contoh notifikasi otomatis (generate dari logic, bukan hanya mock statis):
  - Pengingat deadline pengembalian alat (H-1, hari H, terlambat)
  - Permintaan pinjaman disetujui/ditolak
  - Stok bahan menipis (untuk admin)
  - Permintaan pengembalian dari siswa (untuk admin)
- Badge unread di header/sidebar
- Klik notifikasi → mark as read + navigasi ke detail peminjaman terkait
- Tombol "Tandai semua sudah dibaca"

### C. Admin — setujui/tolak peminjaman

- Approve/reject di halaman Peminjaman harus mengubah status loan di state
- Tolak wajib isi alasan
- Setelah approve alat → status `disetujui` atau `dipinjam`, kurangi stok tersedia

### D. Admin — kelola pengguna & peralatan

- CRUD yang sudah ada di state lokal pertahankan, pastikan sinkron dengan data lain

---

## 6. DASHBOARD — desain lebih sederhana & ramah pengguna

Redesign dashboard per role agar tidak terlalu padat:

### Prinsip UX

- Maksimal 4 kartu statistik utama di atas (angka besar, label jelas, ikon sederhana)
- Satu section fokus utama di bawah (bukan 3-4 section sekaligus)
- Gunakan whitespace lebih banyak, kurangi teks berulang
- CTA utama jelas per role:
  - Siswa: "Ajukan Pinjam Alat" + "Ambil Bahan"
  - Admin: "Verifikasi Permintaan" (dengan badge jumlah pending)
  - Guru: "Lihat Peminjaman Siswa"

### Statistik per role (contoh)

- **Admin**: permintaan pending | alat dipinjam | keterlambatan | stok bahan menipis
- **Guru**: siswa pinjam aktif | keterlambatan | bahan diambil minggu ini
- **Siswa**: pinjaman alat aktif | pengajuan pending | notifikasi belum dibaca

Hapus atau ringkas section yang redundan (misalnya duplikasi tabel peminjaman di dashboard siswa jika sudah ada di menu terpisah).

---

## 7. FORM FIELD — gunakan shadcn/ui modern

Ganti semua input native `<input type="date">` dan `<input type="time">` dengan komponen shadcn:

- **Date**: `Popover` + `Calendar` (react-day-picker) — label Indonesia
- **Time**: `Select` jam:menit atau time picker shadcn
- **Select**: `Select` shadcn untuk kategori, guru pembimbing, kelas, jenis barang
- **Textarea**: `Textarea` shadcn
- **Number qty**: `Input` type number dengan tombol +/-
- Konsisten di: Ajukan Peminjaman, Filter Laporan, Filter Riwayat, Form Tambah Alat/Bahan, Form User

Pastikan semua form punya:

- Label jelas
- Pesan error validasi (zod + react-hook-form)
- Disabled state saat loading submit

---

## 8. ROUTING & NAVIGASI (update)

### Siswa sidebar

- Dashboard
- Alat Lab (katalog alat)
- Bahan Lab (katalog bahan) — atau satu menu "Inventaris" dengan tab Alat/Bahan
- Ajukan Pinjam Alat
- Ambil Bahan — atau gabung dalam "Ajukan Peminjaman" dengan 2 tab
- Peminjaman Saya
- Riwayat
- Notifikasi

### Admin sidebar

- Dashboard
- Kelola Alat
- Kelola Bahan — atau satu halaman dengan tab
- Peminjaman (gabung alat pending + pengembalian)
- Pengguna
- Laporan
- Notifikasi

### Guru sidebar

- Dashboard
- Inventaris (lihat)
- Peminjaman Siswa
- Riwayat
- Laporan

---

## 9. TEKNIS & KUALITAS

- Gunakan Context API atau Zustand untuk: `auth`, `loans`, `equipment`, `notifications` — hindari data terisolasi per halaman
- Semua perubahan status harus reflect di UI secara real-time
- Mock data minimal: 10 alat, 10 bahan, 5 user, 8 transaksi campuran alat+bahan
- Responsif mobile
- Jangan breaking change pada export PDF/Excel — sesuaikan kolom dengan field `itemType`
- TypeScript strict untuk semua type baru

---

## Prioritas implementasi

1. Model data Alat vs Bahan + mock data baru
2. State management global + fungsi pinjam/notifikasi jalan
3. Halaman Ajukan Peminjaman terpisah (alat vs bahan)
4. Detail di Peminjaman Saya & Riwayat
5. Dashboard simplified
6. shadcn date/time picker di semua form

Setelah selesai, pastikan bisa diuji end-to-end: login siswa → pinjam alat → lihat di Peminjaman Saya → terima notifikasi deadline → ajukan pengembalian → admin approve → muncul di riwayat.
```

---

## PROMPT (copy sampai sini ↑)

---

## Opsi: Pecah 3 sesi (jika Lovable timeout)

### Bagian A — Data & inventaris

Copy isi **PROMPT** section **1**, **8** (routing), dan **9** (teknis) saja. Tambahkan kalimat pembuka:

> "Implementasikan dulu model Alat vs Bahan, mock data, sidebar, dan CRUD admin. Jangan ubah dashboard dulu."

### Bagian B — Alur peminjaman & fungsi

Copy section **2**, **3**, **4**, **5** dari PROMPT.

> "Lanjutkan dari perubahan sebelumnya. Fokus alur pinjam siswa, detail Peminjaman Saya & Riwayat, dan semua fungsi harus jalan (bukan console.log)."

### Bagian C — UX & form

Copy section **6** dan **7** dari PROMPT.

> "Lanjutkan. Sederhanakan dashboard dan ganti semua date/time field ke shadcn/ui."

---

## Checklist setelah Lovable selesai

- [ ] Inventaris punya 2 jenis: Alat & Bahan di semua role
- [ ] Ajukan pinjam: alur alat terpisah dari bahan
- [ ] Info stok/tersedia berbeda (alat vs bahan)
- [ ] Peminjaman Saya: filter user sendiri + tab + modal detail
- [ ] Riwayat: tabel + detail lengkap
- [ ] Tombol pinjam siswa benar-benar menyimpan data
- [ ] Halaman Notifikasi + badge unread + logic deadline
- [ ] Admin approve/reject mengubah status & stok
- [ ] Dashboard lebih ringkas per role
- [ ] Date/time pakai shadcn (bukan input native)
- [ ] Export laporan include kolom jenis barang

---

## Catatan konteks (untuk Anda, tidak perlu paste ke Lovable)

Aplikasi saat ini masih **frontend prototype** dengan `mockData.ts` dan auth demo. Prompt di atas meminta Lovable menambahkan **state global / localStorage** agar fitur terasa hidup sebelum backend ada.

Jika nanti migrasi ke Laravel (`manajemen-alat-app`), mapping konsep:

| Lovable | Laravel |
|---------|---------|
| `itemType: 'alat'` | tabel/tools atau flag `is_consumable = false` |
| `itemType: 'bahan'` | consumables / bahan sekali pakai |
| Loan alat | peminjaman + tanggal kembali |
| Loan bahan | pengambilan bahan (tanpa return) |
