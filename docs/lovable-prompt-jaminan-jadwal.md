# Prompt Lovable — Jaminan Kartu Pelajar & Jadwal Praktikum

> **Repo:** `misbahlmnr/patmawati-peminjaman-alat`  
> **Prasyarat:** Update sebelumnya (Alat vs Bahan, DataContext, localStorage) sudah ada.  
> **Cara pakai:** Copy isi section **PROMPT** di bawah, paste ke Lovable.

---

## Catatan desain (untuk Anda — tidak perlu paste ke Lovable)

### Masalah 1: Jaminan kartu pelajar — alur teknis yang disarankan

```
Siswa ajukan pinjam alat (bawa pulang)
    → Centang "Bawa pulang" + setuju syarat jaminan
    → Admin setujui
    → Kartu pelajar DITAHAN (status: ditahan) — fisik di lab, dicatat di sistem
    → Siswa pakai alat di luar sekolah
    → Siswa ajukan pengembalian
    → Admin inspeksi barang:
         ├─ LENGKAP & baik → kartu dikembalikan ke siswa (status: dikembalikan)
         └─ TIDAK LENGKAP / rusak → kartu TETAP ditahan
                → Admin input: item kurang/rusak, nominal/tindakan ganti rugi
                → Siswa wajib ganti rugi dulu (status kompensasi: pending → selesai)
                → Setelah selesai → kartu baru dikembalikan
```

**Kunci teknis:** pisahkan status **peminjaman alat** dan status **jaminan kartu**. Kartu tidak otomatis kembali saat alat "dikembalikan" — hanya setelah inspeksi lolos ATAU kompensasi selesai.

### Masalah 2: Jadwal praktikum — alur teknis yang disarankan

```
Admin buat jadwal praktikum (matkul, kelas, tanggal, jam, prioritas, kebutuhan alat)
    → Sistem hitung/reserve stok untuk jadwal prioritas tinggi (opsional: soft reserve)
    → Siswa ajukan pinjam alat HARUS pilih jadwal yang relevan
    → Jika stok tidak cukup:
         - Bandingkan prioritas jadwal pemohon vs jadwal lain yang sudah reserve
         - Lomba/tinggi menang atas pengajuan telat/normal
         - Siswa dapat status: disetujui | ditolak | antrian (waitlist)
```

---

## PROMPT (copy dari sini ↓)

```
Lanjutkan pengembangan aplikasi Sistem Peminjaman Lab Audio Video (SMK Negeri 7 Bekasi). Stack tetap: React + Vite + TypeScript + shadcn/ui + Tailwind + DataContext + localStorage. Pertahankan semua fitur yang sudah ada (Alat vs Bahan, pinjam terpisah, notifikasi, detail modal, dll).

Tambahkan 2 fitur besar berikut dengan implementasi yang BENAR-BENAR jalan di state global (bukan console.log).

---

## BAGIAN A — JAMINAN KARTU PELAJAR (Alat Bawa Pulang)

### Konteks bisnis

Tidak semua peminjaman alat sama:
- **Pakai di lab saja** — alat tidak dibawa pulang, TIDAK perlu jaminan kartu pelajar.
- **Bawa pulang** — alat dibawa ke luar sekolah/rumah, WAJIB jaminan **kartu pelajar** ditahan di lab.

Aturan jaminan:
1. Saat alat disetujui dan diambil (bawa pulang), kartu pelajar siswa **ditahan** oleh admin/lab.
2. Saat pengembalian, admin **inspeksi kelengkapan** alat (checklist).
3. Jika alat **lengkap & kondisi baik** → kartu pelajar dikembalikan ke siswa.
4. Jika alat **tidak lengkap, hilang, atau rusak** → kartu **TETAP ditahan** sampai siswa menyelesaikan ganti rugi/penggantian.
5. Setelah kompensasi selesai → admin konfirmasi → kartu baru dikembalikan.

### Perubahan data model

Tambahkan pada entitas `Loan` (hanya untuk `itemType === 'alat'`):

```ts
borrowScope: 'dalam_lab' | 'bawa_pulang';  // wajib saat pinjam alat

// Jaminan — hanya jika borrowScope === 'bawa_pulang'
collateral?: {
  type: 'kartu_pelajar';
  status: 'tidak_diperlukan' | 'ditahan' | 'dikembalikan';
  heldAt?: string;        // ISO datetime — saat kartu ditahan
  returnedAt?: string;    // ISO datetime — saat kartu dikembalikan ke siswa
  heldByAdminId?: string; // opsional
};

// Inspeksi pengembalian
inspection?: {
  status: 'belum' | 'lengkap' | 'tidak_lengkap' | 'rusak';
  checkedAt?: string;
  checkedByAdminId?: string;
  notes?: string;           // catatan admin
  missingItems?: string;    // daftar item kurang, ex: "Lensa cap, Battery grip"
  damageDescription?: string;
};

// Kompensasi / ganti rugi
compensation?: {
  required: boolean;
  status: 'tidak_perlu' | 'pending' | 'selesai';
  amount?: number;          // nominal ganti rugi (Rp), opsional
  description?: string;     // keterangan: ganti unit, bayar, dll
  completedAt?: string;
  completedByAdminId?: string;
};
```

Tambahkan status loan opsional (sesuaikan StatusBadge):
- `menunggu_inspeksi` — setelah siswa ajukan pengembalian, menunggu admin inspeksi
- Pertahankan status existing: diminta, disetujui, dipinjam, terlambat, dikembalikan, ditolak

### Alur UI — Siswa (Ajukan Pinjam Alat)

Pada tab **Pinjam Alat** di `/request-loan`:

1. Tambah pilihan **Lokasi Penggunaan** (RadioGroup shadcn):
   - `Pakai di Lab` (default) — tidak perlu jaminan
   - `Bawa Pulang` — tampilkan panel peringatan jaminan

2. Jika **Bawa Pulang**, tampilkan Alert/box informatif:
   > "Anda wajib menyerahkan **kartu pelajar** sebagai jaminan. Kartu akan dikembalikan setelah alat dikembalikan dalam keadaan lengkap. Jika ada barang tidak lengkap/rusak, kartu ditahan sampai penggantian selesai."

3. Checkbox wajib: *"Saya setuju menyerahkan kartu pelajar sebagai jaminan"*

4. Field lain tetap: guru pembimbing, tanggal/waktu, catatan, jadwal praktikum (lihat Bagian B)

### Alur UI — Admin (Peminjaman & Pengembalian)

**Saat menyetujui pinjaman bawa pulang:**
- Modal konfirmasi: "Pastikan kartu pelajar siswa [Nama] telah diterima"
- Setelah approve → set `collateral.status = 'ditahan'`, `collateral.heldAt = now`

**Saat siswa ajukan pengembalian:**
- Status loan → `menunggu_inspeksi`
- Notifikasi ke admin: "Pengembalian [alat] dari [siswa] menunggu inspeksi"

**Modal Inspeksi Pengembalian** (wajib, pengganti konfirmasi return sederhana):

Form inspeksi berisi:
- Radio: `Lengkap & Baik` | `Tidak Lengkap` | `Rusak`
- Textarea: catatan inspeksi
- Jika tidak lengkap/rusak:
  - Input: daftar item kurang / kerusakan
  - Input: nominal ganti rugi (opsional, Rp)
  - Textarea: instruksi ke siswa

**Tombol aksi setelah inspeksi:**

| Hasil inspeksi | Aksi sistem |
|----------------|-------------|
| Lengkap & baik | `loan.status = dikembalikan`, stok alat +, `collateral.status = dikembalikan`, notif siswa: "Alat & kartu pelajar dapat diambil" |
| Tidak lengkap/rusak | `loan.status = dikembalikan` (alat sudah kembali), stok partial update, `compensation.required = true`, `compensation.status = pending`, `collateral.status = ditahan` (kartu TIDAK dikembalikan), notif siswa: detail kerusakan & instruksi ganti |

**Halaman/Kolom khusus admin — "Jaminan Ditahan":**
- Daftar siswa yang kartunya masih ditahan
- Filter: menunggu kompensasi / siap dikembalikan kartu
- Tombol **"Kompensasi Selesai — Kembalikan Kartu"** → `compensation.status = selesai`, `collateral.status = dikembalikan`

### Alur UI — Siswa (Peminjaman Saya)

Pada detail pinjaman bawa pulang, tampilkan section **Status Jaminan**:
- Badge: Kartu Ditahan / Kartu Sudah Dikembalikan
- Jika kompensasi pending: banner merah dengan instruksi ganti rugi
- Timeline gabungan: pinjaman + inspeksi + kompensasi

### Notifikasi otomatis (generate via DataContext)

- Saat kartu ditahan: "Kartu pelajar Anda ditahan sebagai jaminan peminjaman [alat]"
- Saat inspeksi tidak lengkap: "Pengembalian tidak lengkap. Kartu pelajar masih ditahan. [detail]"
- Saat kompensasi selesai: "Kompensasi selesai. Silakan ambil kartu pelajar di lab"
- Saat kartu dikembalikan: "Kartu pelajar Anda telah dikembalikan"

### Mock data

Tambahkan 2–3 contoh loan `bawa_pulang` di seed:
- 1 lengkap (kartu sudah kembali)
- 1 ditahan menunggu kompensasi
- 1 dalam_lab (tanpa jaminan) untuk perbandingan

---

## BAGIAN B — JADWAL PRAKTIKUM & PRIORITAS

### Konteks bisnis

Setiap peminjaman **alat** harus berdasarkan **jadwal praktikum** mata kuliah kejurusan (Audio Video / TAV). Admin yang membuat jadwal. Sistem harus mengatur **prioritas** ketika stok terbatas — misalnya kebutuhan **lomba** lebih diutamakan daripada pengajuan siswa yang terlambat.

### Entitas baru: JadwalPraktikum

```ts
type SchedulePriority = 'normal' | 'tinggi' | 'lomba';

interface JadwalPraktikum {
  id: string;
  title: string;              // ex: "Praktik Shooting Video"
  mataKuliah: string;         // ex: "Produksi Video"
  jurusan: string;            // default: "Audio Video" / "TAV"
  kelas: string;              // ex: "XII TAV 1"
  tanggal: string;            // YYYY-MM-DD
  jamMulai: string;           // HH:mm
  jamSelesai: string;
  ruangan?: string;           // ex: "Lab AV-1"
  guruId: string;
  guruName: string;
  priority: SchedulePriority;
  status: 'draft' | 'aktif' | 'selesai' | 'dibatalkan';
  // Alat yang dibutuhkan (perkiraan)
  requiredEquipment?: Array<{
    equipmentId: string;
    equipmentName: string;
    quantity: number;
  }>;
  notes?: string;
  createdAt: string;
}
```

Tambahkan di `Loan`:
```ts
scheduleId: string;
scheduleTitle?: string;  // denormalized untuk tampilan
```

### Prioritas — aturan bisnis (implementasikan di logic)

Skor prioritas (semakin tinggi menang):
| Priority | Skor |
|----------|------|
| lomba | 100 |
| tinggi | 70 |
| normal | 40 |

**Saat siswa mengajukan pinjam alat:**
1. Wajib pilih jadwal praktikum yang `status === 'aktif'` dan tanggal jadwal >= hari ini (atau dalam rentang H-7 s/d H+1)
2. Sistem cek ketersediaan stok per alat
3. Jika stok cukup → `diminta` (alur normal)
4. Jika stok tidak cukup:
   - Hitung apakah ada jadwal lain dengan prioritas lebih tinggi yang sudah memesan/mengajukan alat yang sama pada tanggal overlap
   - Jika pemohon punya jadwal `lomba` → bisa **menggeser** atau **menolak** pengajuan prioritas lebih rendah yang belum dikonfirmasi (tampilkan dialog admin)
   - Jika pemohon `normal` dan ada jadwal `lomba/tinggi` yang butuh stok → status pengajuan: `antrian` (waitlist) ATAU `ditolak` dengan alasan: "Stok dialokasikan untuk jadwal [nama lomba]"

**Reservasi stok (soft reserve):**
- Saat admin membuat jadwal `lomba` atau `tinggi` dengan `requiredEquipment`, kurangi "stok tersedia untuk booking" (bukan stok fisik, tapi `availableForBooking`)
- Tambah field opsional di Equipment: `reservedQty: number` — dihitung dari jadwal aktif yang overlap tanggal
- `availableForBooking = available - reservedQty`

### Halaman baru / update: Kelola Jadwal (Admin)

Route: `/schedules` — tambah ke sidebar admin (dan guru: lihat saja)

**Fitur admin:**
- CRUD jadwal praktikum (form shadcn: date picker, time picker, select kelas, select guru, select prioritas)
- Tabel + filter: tanggal, kelas, prioritas, status
- Kalender mingguan sederhana (opsional tapi disarankan) — tampilkan jadwal per hari
- Saat buat/edit jadwal: multi-select alat + qty yang dibutuhkan → update `reservedQty`
- Badge warna prioritas: normal=abu, tinggi=kuning, lomba=merah

**Fitur guru:**
- Lihat jadwal (read-only) + jadwal yang dia ampukan

### Update: Ajukan Pinjam Alat (Siswa)

Wajib tambah field sebelum submit:
- **Select Jadwal Praktikum** — hanya jadwal aktif sesuai kelas siswa yang login
- Tampilkan info jadwal terpilih: tanggal, jam, mata kuliah, prioritas (badge)
- Jika jadwal `lomba`: tampilkan badge "Prioritas Tinggi — stok diprioritaskan"

Jika tidak ada jadwal tersedia: disabled submit + pesan "Tidak ada jadwal praktikum aktif untuk kelas Anda. Hubungi admin/guru."

### Update: Manajemen Peminjaman (Admin)

- Kolom baru di tabel: Jadwal, Prioritas, Scope (Lab/Bawa Pulang)
- Filter: prioritas jadwal, scope pinjam
- Saat konflik stok: modal **"Konflik Stok"** — tampilkan perbandingan 2 pengajuan (siswa A vs jadwal lomba B), tombol: Setujui A / Setujui B / Tolak keduanya

### Update: Dashboard

**Admin** — tambah stat card:
- Jadwal aktif minggu ini
- Jaminan kartu ditahan (jumlah)
- Konflik stok / antrian pending

**Siswa** — di dashboard atau Peminjaman Saya:
- Jadwal praktikum mendatang (3 terdekat)
- Peringatan jika ada kompensasi pending

### DataContext — fungsi baru

```ts
// Jadwal
schedules: JadwalPraktikum[];
addSchedule, updateSchedule, deleteSchedule;
getSchedulesForClass(className: string): JadwalPraktikum[];
calculateReservedQty(equipmentId: string, date: string): number;
getAvailableForBooking(equipmentId: string, date: string): number;

// Jaminan & inspeksi
holdCollateral(loanId: string): void;
inspectReturn(loanId: string, inspection: InspectionInput): void;
completeCompensation(loanId: string): void;
returnCollateral(loanId: string): void;

// Prioritas
checkStockConflict(input): ConflictResult;
approveWithPriority(loanId: string): void;
```

Persist ke localStorage: `lab.schedules.v1`

### Mock data jadwal

Minimal 6 jadwal contoh:
- 2 normal (praktikum reguler XII TAV 1)
- 1 tinggi (ujian praktik)
- 2 lomba (competition prep — prioritas tertinggi)
- 1 selesai (histori)

Pastikan ada skenario: jadwal lomba butuh kamera (A1) qty 3, stok tersedia 3, siswa normal telat mengajuan kamera qty 1 → masuk antrian atau ditolak.

---

## BAGIAN C — NAVIGASI & INTEGRASI

### Sidebar update

**Admin:**
- Tambah menu **Jadwal Praktikum** → `/schedules`
- Tambah menu **Jaminan Kartu** → `/collateral` (daftar kartu ditahan)

**Guru:**
- Tambah **Jadwal** (read-only) → `/schedules`

**Siswa:** tidak perlu menu jadwal terpisah (pilih saat pinjam)

### Komponen yang harus dibuat

- `CollateralStatusBadge`
- `SchedulePriorityBadge`
- `InspectionModal` — form inspeksi pengembalian
- `CompensationPanel` — admin selesaikan kompensasi
- `ScheduleSelect` — dropdown jadwal untuk siswa
- `StockConflictDialog` — admin resolve konflik
- `CollateralHeldTable` — halaman admin kartu ditahan

### StatusBadge — tambah label Indonesia

- `menunggu_inspeksi` → "Menunggu Inspeksi"
- `antrian` → "Antrian" (jika dipakai)

---

## BAGIAN D — UX & KUALITAS

- Semua form pakai shadcn (Select, RadioGroup, DateField, TimeField, Textarea, Alert)
- Validasi zod: bawa pulang wajib checkbox setuju, wajib pilih jadwal
- Mobile responsive
- Bahasa Indonesia di semua label
- TypeScript strict — tidak ada `any`
- Update export laporan: tambah kolom Jadwal, Prioritas, Scope, Status Jaminan

---

## Prioritas implementasi

1. Model data + mock (JadwalPraktikum, field loan baru)
2. DataContext functions + localStorage
3. Halaman Kelola Jadwal (admin)
4. Update Ajukan Pinjam Alat (scope + jadwal + jaminan)
5. Modal inspeksi + alur jaminan kartu
6. Halaman Jaminan Ditahan (admin)
7. Logic prioritas & konflik stok
8. Update dashboard, notifikasi, laporan

---

## Skenario uji end-to-end (wajib lulus)

**Jaminan:**
1. Siswa pinjam kamera (bawa pulang) + setuju jaminan → admin approve → kartu ditahan
2. Siswa kembalikan → admin inspeksi "tidak lengkap" → kartu masih ditahan + notif kompensasi
3. Admin tandai kompensasi selesai → kartu dikembalikan → notif siswa

**Jadwal & prioritas:**
1. Admin buat jadwal lomba (prioritas lomba) butuh 3 kamera di tanggal X
2. Siswa normal telat ajukan 1 kamera tanggal sama → sistem tolak atau antrian dengan alasan jelas
3. Siswa dengan jadwal lomba ajukan kamera → disetujui meski stok ketat

**Lab only:**
1. Siswa pinjam multimeter (dalam lab) → tidak ada jaminan kartu → alur existing tanpa collateral
```

---

## PROMPT (copy sampai sini ↑)

---

## Opsi pecah 2 sesi Lovable

### Sesi 1 — Jaminan kartu pelajar
Copy **BAGIAN A** + **Bagian C** (menu Jaminan Kartu, CollateralHeldTable) + fungsi DataContext jaminan.

Pembuka:
> "Implementasikan fitur jaminan kartu pelajar untuk peminjaman alat bawa pulang. Jangan ubah jadwal dulu."

### Sesi 2 — Jadwal & prioritas
Copy **BAGIAN B** + update navigasi + dashboard.

Pembuka:
> "Lanjutkan. Tambahkan jadwal praktikum dan sistem prioritas stok. Integrasikan dengan form pinjam alat yang sudah ada."

---

## Checklist setelah Lovable selesai

**Jaminan**
- [ ] Pilihan Pakai di Lab vs Bawa Pulang saat pinjam alat
- [ ] Checkbox persetujuan jaminan untuk bawa pulang
- [ ] Kartu ditahan saat admin approve bawa pulang
- [ ] Modal inspeksi saat pengembalian
- [ ] Kartu tetap ditahan jika tidak lengkap
- [ ] Alur kompensasi selesai → kartu kembali
- [ ] Halaman admin "Jaminan Ditahan"
- [ ] Notifikasi tiap tahap jaminan

**Jadwal**
- [ ] Admin CRUD jadwal praktikum
- [ ] Siswa wajib pilih jadwal saat pinjam alat
- [ ] Prioritas lomba/tinggi/normal berpengaruh ke stok
- [ ] Konflik stok dengan pesan jelas
- [ ] Soft reserve stok per jadwal
- [ ] Guru bisa lihat jadwal

---

## Mapping ke Laravel (nanti)

| Fitur Lovable | Laravel |
|---------------|---------|
| `borrowScope` | kolom `borrow_scope` di `loans` |
| `collateral` | tabel `loan_collaterals` atau JSON + status |
| `inspection` | tabel `loan_return_inspections` |
| `compensation` | tabel `loan_compensations` |
| `JadwalPraktikum` | tabel `practicum_schedules` |
| `scheduleId` | FK di `loans` |
| `reservedQty` | tabel `schedule_equipment_reservations` |
