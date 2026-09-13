# Demo alur antrian peminjaman

Reproduce manual untuk demo ke dospem. Toolset 20 unit, password semua `password`. Siswa seed: Patmawati XI TAV 1, Santi & Misbah XII TAV 1, Azka & Azki XII TAV 3.

Hari demo: Minggu, 13 September 2026. Booking ke **Senin, 14 September 2026**.

Hari demo: Minggu, 13 September 2026. Booking ke **Senin, 14 September 2026**.

Sebelum mulai: batalkan dulu pengajuan Toolset yang masih aktif (kalau ada), supaya antriannya bersih.

---

## Akun yang dipakai

| Peran                                        | Login       | Password   | Kelas     |
| -------------------------------------------- | ----------- | ---------- | --------- |
| Admin                                        | `admin`     | `password` | —         |
| Guru                                         | `maryadi`   | `password` | —         |
| Siswa 1 (ketua praktik)                      | `patmawati` | `password` | XI TAV 1  |
| Siswa 2 (sisa slot)                          | `santi`     | `password` | XII TAV 1 |
| Siswa 3 (antrian pribadi)                    | `misbah`    | `password` | XII TAV 1 |
| Siswa 4 (project, prioritas paling belakang) | `azka`      | `password` | XII TAV 3 |
| Siswa 5 (lomba, prioritas paling depan)      | `azki`      | `password` | XII TAV 3 |

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

## 4. Lomba hari ini menggusur pribadi yang masih diminta

Login `azki` → Ajukan alat:

1. Tipe **Bawa pulang lomba**
2. Tanggal **14 Sep 2026** (hari yang sama dengan jam uji)
3. **Toolset × 1**
4. Centang jaminan kartu
5. Kirim (paling akhir)

**Yang harus kelihatan:**

- Azki: **Menunggu Persetujuan** (bukan antrian)
- Patmawati: tetap **Menunggu Persetujuan** (praktik 300, tidak digusur)
- Santi: turun **Antrian #1 · Pribadi** (skor 200 berkorban)
- Misbah: **Antrian #2 · Pribadi**
- Azka: **Antrian #3 · Bawa pulang project**

Login `admin` → Peminjaman → tab **Antrian**. Urutan harus:

1. Santi — Pribadi
2. Misbah — Pribadi
3. Azka — Bawa pulang project

Ke dospem: slot dihitung dari **jam pengajuan** (08:00), bukan 17:00. Skor 400 boleh menurunkan yang masih `diminta` skor lebih rendah. Yang sudah disetujui/dipinjam tidak digusur.

---

## 5. Admin tidak bisa setujui yang masih antrian

Masih di admin, buka pengajuan **Santi**, **Misbah**, atau **Azka** → **Setujui**.

**Yang harus kelihatan:** ditolak, pesan masih antrian stok. Status tetap Antrian.

Yang boleh disetujui sekarang: **Patmawati** dan **Azki**.

---

## 6. Serah terima lomba boleh pagi itu

Masih admin, proses **Azki**:

1. **Setujui**
2. Terima kartu pelajar (ditahan)
3. **Tandai dipinjam** — boleh jam 08:00, **tidak** nunggu 09:30

Ke dospem: lomba boleh diambil hari itu setelah disetujui + kartu. Project tetap nunggu jam mapel selesai.

Kalau Azki dikembalikan (inspeksi lengkap), Santi naik jadi **Menunggu Persetujuan** (giliran antrian #1). Misbah/Azka tetap antrian — sisa 20 − 6 Patmawati = 14, pas untuk Santi.

Kalau **Patmawati** yang dikembalikan (Azki masih pegang 1), sisa 19. Santi 14 naik, lalu Misbah 1 dan Azka 1 juga naik karena masih muat.

---

## 7. Ajukan ulang masuk ekor (skor sama)

Kalau dua pengajuan **lomba** sama-sama antrian, yang dulu ajukan unggul. Setelah yang pegang barang mengembalikan, yang antre berikutnya naik. Yang baru saja selesai lalu ajukan lomba **lagi** masuk **paling belakang** di antara lomba — tidak numpang jatah lama.

---

## Urutan bicara ke dospem

1. Admin buat jadwal dulu — siswa tidak bisa praktik lab tanpa mapel.
2. Patmawati 6 unit → menunggu persetujuan.
3. Santi 14 unit sisa slot → masih lolos.
4. Misbah/Azka kelebihan → antrian, tidak ditolak.
5. Azki lomba menyusul → **diminta**; Santi berkorban ke antrian #1.
6. Admin tidak bisa setujui yang masih antrian; lomba boleh diserahkan pagi itu.
7. Setelah lomba kembali, antrian terangkat sendiri (Santi dulu; Misbah/Azka tetap antri). Setelah praktik Patmawati kembali, Santi + Misbah + Azka naik semua.
8. Ajukan ulang tipe yang sama = antre dari belakang.
