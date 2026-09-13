# Demo alur antrian peminjaman

Reproduce manual untuk demo ke dospem. Semua memakai data seed sekarang: Toolset 20 unit, siswa `XI TAV 1`, password semua `password`.

Hari demo: Minggu, 13 September 2026. Booking ke **Senin, 14 September 2026**.

Sebelum mulai: batalkan dulu pengajuan Toolset yang masih aktif (kalau ada), supaya antriannya bersih.

---

## Akun yang dipakai

| Peran | Login | Password |
|---|---|---|
| Admin | `admin` | `password` |
| Guru | `maryadi` | `password` |
| Siswa 1 (ketua praktik) | `patmawati` | `password` |
| Siswa 2 (sisa slot) | `santi` | `password` |
| Siswa 3 (antrian pribadi) | `misbah` | `password` |
| Siswa 4 (project, prioritas paling belakang) | `azka` | `password` |
| Siswa 5 (lomba, prioritas paling depan) | `azki` | `password` |

Barang: **Toolset** (20 / 20).

Prioritas antrian otomatis: **Lomba 400 → Praktik lab 300 → Pribadi 200 → Project 100**. Tidak ada tombol prioritas di admin.

---

## 0. Admin siapkan jadwal dulu

Login `admin` → **Jadwal praktikum** → buat 1 jadwal:

- Tipe: Mingguan
- Hari: **Senin**
- Jam: **07:00 – 09:30**
- Kelas: **XI TAV 1**
- Mapel: DTE
- Guru: Maryadi
- Ruang: Ruang Assembly

Ini wajib. Tanpa jadwal, `patmawati` tidak bisa pilih **Praktik lab**.

---

## 1. Stok cukup → status Menunggu Persetujuan

Login `patmawati` → Ajukan alat:

1. Tipe **Praktik lab**
2. Tanggal **14 Sep 2026**
3. Mapel DTE (otomatis 07:00–09:30, batas kembali terkunci jam 09:30)
4. Barang **Toolset × 6**
5. Kirim

**Yang harus kelihatan:** status **Menunggu Persetujuan**, bukan Antrian.

Ke dospem: slot Senin pagi masih muat (20 − 6 = 14).

Logout.

---

## 2. Sisa slot masih boleh dipakai

Login `santi` → Ajukan alat:

1. Tipe **Pribadi**
2. Tanggal **14 Sep 2026**
3. Ruang Assembly
4. **Toolset × 14**
5. Kirim

**Yang harus kelihatan:** juga **Menunggu Persetujuan**. Batas kembali terpaksa **17:00**.

Ke dospem: pribadi memakai sisa jam, bukan stok terpisah. Peak overlap = 6 + 14 = 20, slot penuh.

Logout.

---

## 3. Slot habis → masuk antrian, bukan ditolak

Login `misbah` → Ajukan alat:

1. Tipe **Pribadi**
2. Tanggal **14 Sep 2026**
3. **Toolset × 1**
4. Kirim

**Yang harus kelihatan:**

- Toast: pengajuan masuk antrian
- Status **Antrian #1 · Pribadi**
- Banner: “Pengajuan dalam antrian stok (posisi #1)”

Ke dospem: stok kurang **tidak menolak**, siswa tetap antre.

Logout. Ulangi dengan `azka`, tipe **Bawa pulang project**, Toolset × 1, centang jaminan kartu.

**Yang harus kelihatan:** **Antrian #2 · Bawa pulang project** (skor 100, di belakang pribadi).

Logout.

---

## 4. Lomba menyusul tetap loncat ke depan

Login `azki` → Ajukan alat:

1. Tipe **Bawa pulang lomba**
2. Tanggal **14 Sep 2026**
3. **Toolset × 1**
4. Centang jaminan kartu
5. Kirim (paling akhir)

Buka detail `azki`: **Antrian #1 · Bawa pulang lomba**.

Buka lagi `misbah`: mundur jadi **#2**. `azka` jadi **#3**.

Login `admin` → Peminjaman → tab **Antrian**. Urutan harus:

1. Azki — Bawa pulang lomba
2. Misbah — Pribadi
3. Azka — Bawa pulang project

Ke dospem: urutan dari **tipe**, bukan siapa yang klik duluan. Admin tidak bisa menggeser manual.

---

## 5. Admin tidak bisa setujui yang masih antrian

Masih di admin, buka pengajuan **Misbah** atau **Azka** → **Setujui**.

**Yang harus kelihatan:** ditolak, pesan masih antrian stok. Status tetap Antrian.

Yang boleh disetujui sekarang hanya **Patmawati** dan **Santi**.

---

## 6. Giliran jalan setelah barang kembali

Masih admin, proses **Santi** sampai selesai (pribadi, tanpa kartu):

1. **Setujui** → Disetujui
2. **Tandai dipinjam**
3. Proses pengembalian → inspeksi **Lengkap**

Setelah Santi selesai, cek tab **Antrian** / **Perlu diproses**:

| Siswa | Sesudah Santi kembali |
|---|---|
| Azki (lomba) | naik jadi **Menunggu Persetujuan** (skor tertinggi + stok 1 longgar) |
| Misbah | tetap antrian, posisi maju |
| Azka | tetap antrian |

Kalau yang naik Misbah dulu, berarti lomba belum muat di slot yang sama — tunjukkan ke dospem bahwa alokasi per jam, bukan “siapa antre nomor 1 otomatis dapat”. Yang penting: **bukan admin yang mengangkat**, sistem yang memproses antrian.

Lanjut: setujui Azki → terima kartu dulu → **jangan** tandai dipinjam sebelum jam praktik Toolset selesai (09:30). Kalau dipaksa pagi-pagi, tombol serah terima terblokir sampai **09:30**.

Ke dospem: lomba prioritas tinggi, tapi tidak boleh cabut Toolset dari kelas yang masih berlangsung.

---

## 7. Ajukan ulang masuk ekor

Setelah Azki selesai pinjam dan dikembalikan, login `azki` lagi → ajukan **lomba Toolset × 1** sekali lagi.

**Yang harus kelihatan:** masuk antrian **paling belakang**, di bawah Misbah/Azka yang belum kebagian. Tidak numpang prioritas lama.

---

## Urutan bicara ke dospem

1. Admin buat jadwal dulu — siswa tidak bisa praktik lab tanpa mapel.
2. Patmawati 6 unit → disetujui jalur normal.
3. Santi 14 unit sisa slot → masih lolos.
4. Misbah kelebihan → antrian, tidak ditolak.
5. Azki lomba menyusul → tetap #1.
6. Admin tidak bisa “loncatkan” atau setujui paksa.
7. Setelah barang kembali, antrian terangkat sendiri.
8. Ajukan ulang = antre dari belakang.
