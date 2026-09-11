# Product Requirements Document (PRD)

**Produk:** Sistem Manajemen Alat & Bahan Laboratorium Audio Video  
**Instansi:** SMK Negeri 7 Bekasi — Laboratorium Audio Video (Jurusan Teknik Audio Video)  
**Dokumen:** PRD v1.0  
**Tanggal:** 11 September 2026  
**Status:** Menggambarkan perilaku sistem yang sudah berjalan (as-built)

---

## 1. Ringkasan produk

Aplikasi web untuk mengelola inventaris alat (dipinjam dan dikembalikan) serta bahan habis pakai (diambil, tidak dikembalikan) di laboratorium Audio Video.

Tujuannya: siswa mengajukan pemakaian secara digital, admin lab menyetujui dan menyerahkan barang dengan stok yang akurat, guru memantau peminjaman siswa bimbingannya, dan sekolah punya jejak administrasi (jadwal, jaminan kartu, inspeksi, kompensasi, laporan).

**Masalah yang diselesaikan**

- Pencatatan stok dan peminjaman masih mudah tertukar (unit di lab vs unit rusak vs unit sedang dipinjam).
- Pengajuan overlap antar kelas/jadwal sulit diatur tanpa antrian.
- Bawa pulang alat membutuhkan jaminan kartu pelajar yang tercatat.
- Pengembalian rusak/tidak lengkap perlu inspeksi dan kompensasi, bukan hanya “dikembalikan”.
- Guru dan siswa perlu visibilitas status tanpa harus ke lab.

**Hasil yang diharapkan**

- Stok tersedia di lab berkurang otomatis saat pengajuan disetujui, dan kembali otomatis saat pengembalian (alat) atau tetap terpotong (bahan).
- Satu pengajuan siswa bisa berisi alat dan bahan sekaligus (paket), tetapi diproses terpisah di backend.
- Antrian stok adil (FIFO) dengan opsi prioritas admin.
- Laporan inventaris, peminjaman, dan pengguna siap diekspor.

---

## 2. Stack & konteks teknis

| Lapisan | Teknologi |
|---|---|
| Backend | Laravel 12, PHP 8.2+ |
| Frontend | React 18, Inertia.js 2, Tailwind CSS, komponen gaya shadcn/ui |
| Auth | Laravel Breeze (sesi), role middleware `admin` / `guru` / `siswa` |
| Realtime | Notifikasi in-app + Web Push |
| Import | Excel/CSV (PhpSpreadsheet) untuk pengguna |
| Zona waktu operasional | `Asia/Jakarta` (hari jadwal, jam lab, batas kembali) |

Aplikasi adalah **sistem internal sekolah**, bukan marketplace publik. Pengguna hanya akun yang dibuat/diimpor admin.

---

## 3. Pengguna & peran

### 3.1 Admin laboratorium

Operator harian lab. Mengelola master data, menyetujui pengajuan, menyerahkan/menerima barang, menahan kartu jaminan, inspeksi pengembalian, dan laporan.

### 3.2 Guru

Pembimbing praktikum. Melihat inventaris, jadwal, peminjaman siswa yang dibimbingnya, notifikasi, dan laporan (tanpa mengubah stok atau menyetujui peminjaman).

### 3.3 Siswa

Peminjam. Menjelajah katalog, mengajukan alat/bahan, memantau status, meminta pengembalian, dan menerima notifikasi.

### 3.4 Identitas akun

| Peran | Identitas | Atribut khas |
|---|---|---|
| Siswa | NISN, username, kelas | Kelas wajib untuk filter jadwal mapel |
| Guru | NIP | Tampil sebagai pembimbing di jadwal & pengajuan |
| Admin | NIP | Akses penuh operasional lab |

Status akun: `active` / nonaktif. Hanya akun aktif yang boleh masuk.

Kelas siswa mengikuti opsi: X TE 1–4, XI TAV 1–3, XII TAV 1–3.

---

## 4. Prinsip produk

1. **Stok mengikuti transaksi, bukan input manual harian.** Admin tidak menyesuaikan “stok tersedia” setiap ada peminjaman.
2. **Kondisi fisik ≠ ketersediaan di lab.** Unit baik yang sedang dipinjam tetap “baik”, tetapi tidak tersedia di rak.
3. **Jadwal sekolah memakai hari Indonesia.** “Hari ini” = kalender `Asia/Jakarta`, termasuk Jumat dini hari.
4. **Bawa pulang selalu berjaminan.** Kartu pelajar ditahan sebelum alat diserahkan.
5. **Alat dikembalikan, bahan tidak.** Bahan habis pakai langsung berstatus diambil setelah disetujui.
6. **Antrian adil, kecuali admin menaikkan prioritas.** Default FIFO per barang.

---

## 5. Lingkup

### 5.1 In scope (sudah ada)

- Autentikasi, profil, reset password (admin ke pengguna lain)
- CRUD pengguna + import Excel/CSV
- CRUD alat dan bahan (stok, kondisi, foto, lokasi)
- Jadwal praktikum mingguan & khusus
- Pengajuan siswa (alat, bahan, atau paket)
- Tiga tipe penggunaan alat: Pakai di lab, Pribadi, Bawa pulang
- Workflow admin: setujui / tolak / tandai dipinjam / pengembalian / batalkan
- Antrian stok + prioritas admin
- Jaminan kartu, inspeksi, kompensasi
- Dashboard per peran
- Notifikasi in-app dan Web Push
- Laporan ringkasan, inventaris, peminjaman, pengguna (admin)

### 5.2 Out of scope (bukan bagian rilis ini)

- Pembayaran denda otomatis / gateway
- Aplikasi mobile native
- Integrasi Dapodik / SSO sekolah
- Multi-lab / multi-sekolah
- Siswa/guru membuat jadwal sendiri
- Guru menyetujui peminjaman (hanya admin)

---

## 6. Arsitektur informasi (entitas utama)

```
User (admin | guru | siswa)
PracticumSchedule ── guru_id → User
Equipment / Supply (item_type: alat | bahan)
Submission (satu keranjang pengajuan siswa)
  └── Loan (alat ATAU bahan)
        ├── LoanItem[] → Equipment
        ├── LoanStatusLog[]
        ├── LoanCollateral?          (hanya bawa pulang)
        ├── LoanReturnInspection?    (hanya alat)
        └── LoanCompensation?
```

**Submission** mengelompokkan pinjaman alat dan pengambilan bahan yang diajukan bersamaan.  
**Loan** adalah unit kerja admin (disetujui, antrian, diserahkan, dikembalikan).

---

## 7. Inventaris

### 7.1 Alat (dipinjam)

Setiap alat punya:

| Field | Arti |
|---|---|
| `stock` | Total unit tercatat |
| `qty_baik` / `qty_rusak_ringan` / `qty_rusak_berat` | Kondisi fisik; jumlahnya = total |
| `available` | Unit baik yang **sedang di lab** (siap dipinjam) |
| `status` | Inventaris aktif: `tersedia` / `tidak_tersedia` (diset admin) |

**Aturan stok alat**

- Form admin hanya mengisi jumlah per kondisi. Total = jumlah ketiga kondisi.
- `available` tidak diisi manual saat peminjaman.
- Saat pengajuan **disetujui**: `available` berkurang sejumlah item.
- Saat **dikembalikan / ditolak setelah disetujui / dibatalkan setelah stok terpotong**: `available` bertambah kembali (maksimal sisa kapasitas).
- Saat ditandai **dipinjam**, stok **tidak** dipotong lagi (sudah ter-reserve saat disetujui).
- Inspeksi rusak: pindahkan kuantitas dari baik ke rusak, dan kurangi `available` jika perlu.
- Label ketersediaan di tabel: `tersedia`, `dipinjam` (sebagian), `habis` (antrian dibuka), `rusak`, `tidak_tersedia`.
- Tampilan tabel: **Stok Tersedia** = `available / stock` (contoh `19 / 20`).

Kategori alat: Alat Ukur & Pengujian, Mesin & Perkakas, Solder & Perakitan, Trainer Pembelajaran, Sistem Keamanan, Multimedia.

### 7.2 Bahan (habis pakai)

| Field | Arti |
|---|---|
| `stock` | Total tercatat |
| `available` | Sisa di gudang |
| `min_stock` | Ambang peringatan (opsional; `0`/kosong = tanpa peringatan) |
| `unit` | pcs, pack, roll, meter, set, botol |
| Status inventaris | **Diturunkan dari total:** `stock > 0` → tersedia; `stock = 0` → tidak tersedia (bukan dropdown manual) |

**Aturan stok bahan**

- Form admin hanya mengisi total stok (dan peringatan menipis).
- Sisa gudang berkurang otomatis saat pengajuan bahan **disetujui** (langsung berstatus dipinjam/diambil).
- Restok: naikkan total; sisa gudang dihitung otomatis dengan mempertahankan jumlah yang sudah diambil.
- Label stok: `tersedia`, `diambil` (sebagian), `menipis`, `habis` (antrian dibuka), `tidak_tersedia`.

Siswa tetap boleh mengajukan bahan meski gudang kosong, selama total > 0: masuk **antrian**.

---

## 8. Jadwal praktikum

### 8.1 Tipe

| Tipe | Perilaku |
|---|---|
| Mingguan | Berulang setiap hari (Senin–Sabtu) |
| Khusus | Tanggal tertentu (lomba, pengganti, dll.) |

Field: mata pelajaran, kelas, jurusan, hari/tanggal, jam mulai–selesai, ruangan, guru, prioritas (`normal` / `tinggi` / `lomba`), catatan.

Mata pelajaran default: DTE, TPMM, PMM, PRE, PSRT, PISAV, PPPAV, PKK.

Ruang: Ruang Assembly, Ruang Komputer, Ruang Instalasi, Ruang Terbuka.

### 8.2 Aturan tampil ke siswa

- Hanya jadwal **kelas siswa yang login**.
- Hanya jadwal yang **cocok hari ini** (zona `Asia/Jakarta`).
- Jadwal yang jam selesainya sudah lewat dianggap selesai; pengajuan “Pakai di lab” ditolak, siswa diarahkan ke tipe **Pribadi**.

Admin dan guru melihat daftar lengkap (guru: lihat saja).

---

## 9. Pengajuan siswa

Siswa mengajukan dari satu keranjang. Boleh campur alat + bahan; sistem membuat **satu Submission** berisi **satu Loan alat** dan/atau **satu Loan bahan**.

### 9.1 Tipe penggunaan alat

| Tipe UI | `borrow_scope` | `borrow_reason` | Jadwal | Jaminan | Batas kembali |
|---|---|---|---|---|---|
| Pakai di lab | `lab` | `reguler` | Wajib, hari ini | Tidak | **Terkunci** ke jam selesai jadwal |
| Pribadi | `lab` | `lanjutan` | Tidak | Tidak | Jam tutup sekolah hari itu (default 17:00), bisa diisi siswa dalam batas |
| Bawa pulang | `bawa_pulang` | — | Opsional (hari ini) | **Wajib kartu pelajar** | Maks. N hari (default 1) sampai jam tutup sekolah |

**Pakai di lab — field terkunci**

- Tanggal pengajuan = tanggal jadwal hari ini.
- Batas kembali = tanggal + `jam_selesai` jadwal (siswa tidak boleh ubah).
- Guru pembimbing = guru di jadwal (jika terisi).
- Ruang = ruang jadwal (jika terisi).

**Validasi penting**

- Batas kembali tidak boleh melebihi time slice tipe tersebut.
- Pakai di lab: jadwal harus masih aktif (belum lewat jam selesai).
- Bawa pulang: siswa harus menyetujui jaminan kartu.
- Item harus milik jenis yang benar (alat vs bahan) dan masih “tersedia” sebagai inventaris (`stock > 0` untuk bahan; `status = tersedia` untuk alat).
- Jika stok saat ini tidak cukup, pengajuan **tetap diterima** sebagai antrian (bukan ditolak).

Siswa dapat **ubah** pengajuan berstatus `diminta`, `antrian`, atau `disetujui`, dan **batalkan** pada status yang sama.  
Siswa **minta pengembalian** hanya jika alat sedang `dipinjam` / `terlambat`.

---

## 10. Workflow peminjaman (admin)

### 10.1 Status loan

| Status | Arti |
|---|---|
| `diminta` | Menunggu persetujuan, stok cukup |
| `antrian` | Menunggu stok (Round Robin / FIFO) |
| `disetujui` | Stok sudah di-reserve (alat); menunggu penyerahan |
| `dipinjam` | Barang sudah di tangan siswa. Bahan langsung ke sini saat disetujui |
| `terlambat` | Melewati `due_at` (disinkronkan otomatis) |
| `menunggu_inspeksi` | Alat dikembalikan, menunggu cek kondisi |
| `dikembalikan` | Selesai (alat) |
| `ditolak` | Ditolak admin |
| `dibatalkan` | Dibatalkan siswa/admin |

Log status (`LoanStatusLog`) dicatat di setiap transisi.

### 10.2 Alur alat

```
Ajukan
  ├─ stok cukup  → diminta
  └─ stok kurang → antrian ──(stok masuk / prioritas)──→ diminta
Admin setujui → available− → disetujui
  [bawa pulang: terima kartu dulu]
Admin tandai dipinjam → dipinjam → (lewat due) terlambat
Siswa minta kembali / admin proses kembali
  → menunggu_inspeksi
Admin inspeksi
  → dikembalikan + available+
  → jika rusak/tidak lengkap: kompensasi
```

### 10.3 Alur bahan

```
Ajukan → diminta atau antrian
Admin setujui → available− → dipinjam (diambil, tidak dikembalikan)
```

Tidak ada inspeksi pengembalian bahan.

### 10.4 Antrian

- Urutan: **prioritas admin DESC**, lalu **waktu masuk antrian ASC** (FIFO).
- Default prioritas 0 = murni FIFO.
- Admin bisa set / reset prioritas pada loan `antrian`.
- Saat stok bertambah (pengembalian atau restok), sistem memproses antrian barang terkait.
- Jika admin mencoba menyetujui tetapi stok sudah tidak cukup, loan diturunkan ke antrian.

### 10.5 Time slice batas kembali

Di-clamp/dipaksa di server:

- Pakai di lab → selalu jam selesai jadwal (abaikan nilai yang dikirim siswa).
- Pribadi → tidak boleh lewat jam tutup sekolah hari itu.
- Bawa pulang → tanggal pengajuan + N hari pada jam tutup sekolah.

---

## 11. Jaminan, inspeksi, kompensasi

### 11.1 Jaminan kartu (bawa pulang)

Status kartu:

| Status | Arti |
|---|---|
| `dititipkan` | Belum diterima admin |
| `ditahan` | Kartu sudah diterima, alat boleh diserahkan |
| `menunggu_kompensasi` | Ada kerusakan/kehilangan; kartu belum dikembalikan |
| `dikembalikan` | Kartu sudah dikembalikan ke siswa |
| `dibatalkan` | Pengajuan batal |

**Aturan:** admin **tidak boleh** menandai dipinjam sebelum kartu `ditahan`.

### 11.2 Inspeksi pengembalian alat

Hasil:

- `lengkap` — stok kembali, kartu bisa dikembalikan, tidak ada kompensasi.
- `tidak_lengkap` — stok kembali, kompensasi wajib, kartu menunggu kompensasi.
- `rusak` — stok kembali + kuantitas kondisi dipindah (ringan/berat), kompensasi wajib.

### 11.3 Kompensasi

- `pending` sampai admin menandai selesai.
- Setelah kompensasi selesai, kartu dikembalikan (`complete-compensation`).
- Dashboard siswa menampilkan peringatan jika ada kompensasi pending.

---

## 12. Dashboard

### Admin

Statistik: pengajuan alat menunggu, antrian, jadwal minggu ini, kartu ditahan, alat sedang dipinjam, stok bahan menipis.  
Tabel monitoring peminjaman aktif, daftar bahan low-stock, jadwal terdekat.

### Guru

Jadwal hari ini/minggu ini, peminjaman siswa bimbingannya, alert relevan (terlambat, antrian, dll.).

### Siswa

Pengajuan aktif, banner notifikasi, alert kompensasi, jadwal mapel hari ini, pintasan ajukan alat/bahan.

---

## 13. Modul per peran (persyaratan fungsional)

### 13.1 Admin

| ID | Fitur | Kriteria penerimaan |
|---|---|---|
| A-01 | Kelola pengguna | CRUD, filter, reset password, import Excel/CSV (maks. 500 baris), unduh template |
| A-02 | Kelola alat | CRUD, foto, kondisi via stepper, stok total otomatis, `available` tidak diisi manual untuk peminjaman |
| A-03 | Kelola bahan | CRUD, foto, hanya total stok + min. peringatan; status dari total |
| A-04 | Jadwal praktikum | CRUD mingguan/khusus, guru, ruang, prioritas |
| A-05 | Peminjaman | Lihat submission & loan, setujui, tolak (alasan), tandai dipinjam, proses kembali, prioritas antrian |
| A-06 | Jaminan | Terima kartu, kembalikan kartu, selesaikan kompensasi |
| A-07 | Inspeksi | Input hasil lengkap/tidak lengkap/rusak + tingkat rusak |
| A-08 | Laporan | Tab ringkasan / inventaris / peminjaman / pengguna; filter tanggal, status, jenis item; ekspor |
| A-09 | Notifikasi | Daftar, tandai dibaca, Web Push |

### 13.2 Guru

| ID | Fitur | Kriteria penerimaan |
|---|---|---|
| G-01 | Inventaris | Lihat alat & bahan (read-only), filter stok/ketersediaan |
| G-02 | Jadwal | Lihat daftar & detail |
| G-03 | Peminjaman siswa | Hanya loan dengan `supervisor_id` = guru login; tab riwayat |
| G-04 | Laporan | Ringkasan/inventaris/peminjaman **tanpa** tab pengguna |
| G-05 | Notifikasi | Sama seperti admin, scoped ke event terkait |

### 13.3 Siswa

| ID | Fitur | Kriteria penerimaan |
|---|---|---|
| S-01 | Katalog alat/bahan | Cari, filter, detail, CTA ajukan |
| S-02 | Form pengajuan | Keranjang, pilih tipe penggunaan, validasi jadwal/jaminan, paket alat+bahan |
| S-03 | Daftar milik saya | Aktif vs riwayat, status, sisa waktu |
| S-04 | Ubah / batal | Hanya status yang diizinkan policy |
| S-05 | Minta pengembalian | Hanya alat yang sedang dipinjam |
| S-06 | Notifikasi | Status, antrian, kartu, kompensasi |

---

## 14. Notifikasi

Dikirim in-app (dan Web Push jika pengguna subscribe) pada event antara lain:

- Pengajuan dibuat
- Status berubah (disetujui, ditolak, antrian, dipinjam, terlambat, dikembalikan, dibatalkan)
- Kartu diterima / dikembalikan
- Kompensasi wajib / selesai

Penerima: siswa peminjam, guru pembimbing (jika ada), admin (operasional).

---

## 15. Laporan

| Tipe | Isi | Siapa |
|---|---|---|
| Ringkasan | Agregat peminjaman, inventaris, keterlambatan | Admin, guru |
| Inventaris | Daftar alat/bahan, kondisi, stok | Admin, guru |
| Peminjaman | Baris loan + peminjam + status + batas kembali | Admin, guru (scoped) |
| Pengguna | Daftar akun per peran | **Admin saja** |

Filter: jenis item (alat/bahan/semua), status, rentang tanggal, peran (laporan pengguna).  
Meta: nama sekolah, nama lab, waktu generate. Ekspor dari UI laporan.

---

## 16. Aturan bisnis ringkas (harus lulus QA)

1. Siswa tidak bisa mengajukan jika akun nonaktif.
2. Guru tidak melihat peminjaman yang bukan bimbingannya.
3. `available` alat tidak boleh negatif; setujui gagal → masuk antrian.
4. Bahan `stock = 0` tidak bisa diajukan (tidak tersedia).
5. Bahan `available = 0` tetapi `stock > 0` → antrian dibuka.
6. Pakai di lab tanpa jadwal hari ini → form menolak / peringatan kosong.
7. Batas kembali pakai di lab = jam selesai jadwal, immutable di UI dan dipaksa di server.
8. Bawa pulang tanpa kartu `ditahan` → tidak bisa `mark-borrowed`.
9. Sync terlambat: loan alat `dipinjam` dengan `due_at` < sekarang → `terlambat`.
10. Hari jadwal dihitung di `Asia/Jakarta` (Jumat 00:30 WIB = Jumat, bukan Kamis UTC).

---

## 17. Persyaratan non-fungsional

| Aspek | Target |
|---|---|
| Performa | Halaman daftar terpaginasi (umumnya 10 baris); filter debounce ~400 ms |
| Keamanan | Role middleware + policy; CSRF sesi; password hashed; tidak ada registrasi publik |
| Ketersediaan | Aplikasi internal; butuh PHP, MySQL/MariaDB (Laragon), Node untuk Vite |
| Aksesibilitas | Label form, input angka tabular, field terkunci dinonaktifkan (bukan disembunyikan tanpa keterangan) |
| I18n | UI Bahasa Indonesia; format tanggal `d M Y H:i` |
| Audit | Setiap perubahan status loan tercatat di log + notifikasi |
| Import pengguna | Maks. 500 baris; ekstensi xlsx/xls/csv; password default konfigurasi |

---

## 18. Metrik keberhasilan

- Waktu dari pengajuan sampai keputusan admin (setujui/tolak/antrian) turun dibanding proses manual.
- Selisih stok fisik vs `available` di sistem mendekati nol pada audit mingguan.
- 0 pengajuan “Pakai di lab” dengan `due_at` ≠ jam selesai jadwal.
- 0 penyerahan bawa pulang tanpa kartu `ditahan`.
- Bahan low-stock muncul di dashboard sebelum habis total.
- Guru dapat menelusuri peminjaman siswa bimbingannya tanpa minta print-out admin.

---

## 19. Alur pengguna utama (happy path)

### Siswa — pakai di lab

1. Login siswa.  
2. Tambah alat ke keranjang.  
3. Pilih **Pakai di lab** → pilih mapel hari ini.  
4. Tanggal & batas kembali terisi otomatis, tidak bisa diubah.  
5. Ajukan. Status `diminta` atau `antrian`.  
6. Admin setujui → stok lab berkurang.  
7. Admin tandai dipinjam.  
8. Siswa minta pengembalian → inspeksi lengkap → stok lab kembali.

### Siswa — bawa pulang

1. Pilih **Bawa pulang**, setujui jaminan.  
2. Admin terima kartu (`ditahan`).  
3. Admin setujui (jika belum) dan tandai dipinjam.  
4. Pengembalian + inspeksi; kartu dikembalikan jika lengkap.

### Admin — restok bahan

1. Edit bahan, naikkan **total stok**.  
2. Sisa gudang naik otomatis (jumlah yang sudah diambil tetap).  
3. Antrian bahan terkait diproses jika stok mencukupi.

---

## 20. Risiko & asumsi

| Risiko | Mitigasi di produk |
|---|---|
| Zona waktu server UTC | Timezone aplikasi & school timezone `Asia/Jakarta` |
| Admin mengira harus mengedit `available` | Form menyembunyikan input itu; stok mengikuti workflow |
| Siswa mengubah batas kembali pakai di lab | Input disabled + server memaksa jam selesai jadwal |
| Stok fisik rusak saat dipinjam | Inspeksi + `applyReturnDamage` |
| Kelas siswa ≠ kelas jadwal | Filter jadwal by `kelas` |
| Import pengguna salah format | Template + validasi baris + batas 500 |

**Asumsi:** satu lab, satu sekolah, admin lab adalah satu-satunya yang mengubah stok dan menyetujui, koneksi internet tersedia di lab dan (opsional) di rumah siswa.

---

## 21. Glosarium

| Istilah | Definisi |
|---|---|
| Alat | Barang inventaris yang dipinjam dan dikembalikan |
| Bahan | Habis pakai; tidak dikembalikan setelah disetujui |
| Stok tersedia | Unit yang ada di lab/gudang sekarang (`available`) |
| Total stok | Seluruh unit tercatat (`stock`) |
| Stok layak / unit baik | Unit kondisi baik (`qty_baik`), termasuk yang sedang dipinjam |
| Submission | Satu keranjang pengajuan (bisa berisi loan alat + loan bahan) |
| Loan | Transaksi per jenis item yang di-workflow admin |
| Time slice | Jendela waktu maksimal pengembalian menurut tipe penggunaan |
| Antrian | Status menunggu stok; urutan FIFO + prioritas admin |
| Pakai di lab | Penggunaan sesuai mata pelajaran & jam jadwal hari ini |
| Pribadi | Penggunaan di lab di luar jam mapel, tanpa jaminan |
| Bawa pulang | Dibawa keluar lab, wajib kartu pelajar |
| Inspeksi | Pemeriksaan kondisi alat saat pengembalian |
| Kompensasi | Kewajiban siswa jika rusak/tidak lengkap |

---

## 22. Lampiran — menu navigasi

**Admin:** Dashboard, Kelola Pengguna, Kelola Alat, Kelola Bahan, Jadwal Praktikum, Peminjaman, Jaminan Kartu, Notifikasi, Laporan  

**Guru:** Dashboard, Inventaris, Jadwal Praktikum, Peminjaman Siswa, Riwayat, Notifikasi, Laporan  

**Siswa:** Dashboard, Alat Lab, Bahan Lab, Ajukan Alat / Bahan, Alat & Bahan Saya, Riwayat, Notifikasi  

---

*Dokumen ini merujuk implementasi di repositori `manajemen-alat-app` (Laravel + Inertia React) dan harus diperbarui jika workflow stok, jadwal, atau peran berubah.*
