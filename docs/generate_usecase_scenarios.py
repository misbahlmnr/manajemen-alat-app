# -*- coding: utf-8 -*-
"""Generator dokumen Word untuk Use Case Scenario Sistem Manajemen Alat & Bahan Lab.

Menghasilkan 11 tabel skenario use case dengan format menyerupai contoh
"Tabel 3.6 Use Case Scenario Login". Jalankan: python generate_usecase_scenarios.py
"""

from pathlib import Path

from docx import Document
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement


USE_CASES = [
    {
        "no": 1,
        "name": "Masuk (Login)",
        "id": "UC01",
        "importance": "High",
        "actor": "Siswa, Guru, Admin",
        "type": "Main Use Case",
        "stakeholder": "Pengguna ingin masuk ke sistem sesuai hak akses perannya masing-masing.",
        "brief": "Use Case ini menjelaskan bagaimana pengguna melakukan proses masuk sebelum dapat menggunakan fitur sesuai perannya.",
        "trigger": "Pengguna ingin membuka halaman beranda sistem.",
        "uc_type": "Primary",
        "relationship": "Association",
        "include": "-",
        "extend": "Keluar (UC02)",
        "generalization": "-",
        "normal": [
            "Pengguna membuka halaman masuk sistem.",
            "Pengguna memasukkan email dan kata sandi, lalu menekan tombol masuk.",
            "Sistem memeriksa data yang dimasukkan pengguna.",
            "Sistem membuka halaman beranda sesuai peran (Siswa, Guru, atau Admin).",
        ],
        "exceptional": "Jika email atau kata sandi salah, sistem menampilkan pesan gagal masuk dan pengguna tetap berada di halaman masuk.",
    },
    {
        "no": 2,
        "name": "Keluar (Logout)",
        "id": "UC02",
        "importance": "Medium",
        "actor": "Siswa, Guru, Admin",
        "type": "Main Use Case",
        "stakeholder": "Pengguna ingin keluar dari sistem dengan aman setelah selesai menggunakannya.",
        "brief": "Use Case ini menjelaskan bagaimana pengguna mengakhiri sesi dan keluar dari sistem.",
        "trigger": "Pengguna ingin mengakhiri penggunaan sistem.",
        "uc_type": "Primary",
        "relationship": "Extend (dari Masuk / UC01)",
        "include": "-",
        "extend": "-",
        "generalization": "-",
        "normal": [
            "Pengguna menekan menu keluar pada sistem.",
            "Sistem mengakhiri sesi pengguna.",
            "Sistem mengarahkan pengguna kembali ke halaman masuk.",
        ],
        "exceptional": "Jika sesi pengguna sudah berakhir, sistem langsung menampilkan halaman masuk.",
    },
    {
        "no": 3,
        "name": "Lihat Inventaris & Antrian",
        "id": "UC03",
        "importance": "Medium",
        "actor": "Siswa, Guru",
        "type": "Main Use Case",
        "stakeholder": "Siswa dan guru ingin mengetahui ketersediaan alat, stok bahan, serta posisi antrian alat.",
        "brief": "Use Case ini menjelaskan bagaimana siswa atau guru melihat daftar alat dan bahan lab beserta jumlah yang tersedia dan status antriannya.",
        "trigger": "Pengguna ingin mengecek ketersediaan alat atau bahan lab.",
        "uc_type": "Primary",
        "relationship": "Association",
        "include": "-",
        "extend": "-",
        "generalization": "-",
        "normal": [
            "Pengguna membuka menu Alat Lab atau Bahan Lab.",
            "Sistem menampilkan daftar alat atau bahan beserta jumlah tersedia dan satuannya.",
            "Pengguna memilih salah satu barang untuk melihat detailnya.",
            "Sistem menampilkan detail barang, termasuk status dan antrian bila stok sedang habis.",
        ],
        "exceptional": "Jika barang yang dicari tidak ditemukan, sistem menampilkan pesan bahwa data tidak tersedia.",
    },
    {
        "no": 4,
        "name": "Mengajukan Peminjaman & Permintaan",
        "id": "UC04",
        "importance": "High",
        "actor": "Siswa",
        "type": "Main Use Case",
        "stakeholder": "Siswa ingin meminjam alat atau mengambil bahan untuk keperluan praktikum.",
        "brief": "Use Case ini menjelaskan bagaimana siswa mengajukan peminjaman alat atau permintaan bahan kepada admin.",
        "trigger": "Siswa ingin meminjam alat atau mengambil bahan.",
        "uc_type": "Primary",
        "relationship": "Association",
        "include": "Kelola Antrian Round Robin (UC11)",
        "extend": "-",
        "generalization": "-",
        "normal": [
            "Siswa membuka menu Ajukan Peminjaman.",
            "Siswa memilih jenis pengajuan, yaitu peminjaman alat atau permintaan bahan.",
            "Siswa memilih barang dan jumlahnya, guru pembimbing, serta jadwal praktikum.",
            "Siswa mengisi keperluan lalu menekan tombol kirim.",
            "Sistem menyimpan pengajuan dan menampilkan status Menunggu Persetujuan.",
        ],
        "exceptional": "Jika stok alat sedang habis, sistem memasukkan pengajuan ke dalam antrian dan memberi tahu posisi antrian siswa. Jika data belum lengkap, sistem menampilkan pesan agar siswa melengkapi isian.",
    },
    {
        "no": 5,
        "name": "Kelola Peminjaman Saya",
        "id": "UC05",
        "importance": "Medium",
        "actor": "Siswa",
        "type": "Main Use Case",
        "stakeholder": "Siswa ingin memantau dan mengelola pengajuan peminjamannya.",
        "brief": "Use Case ini menjelaskan bagaimana siswa melihat, mengubah, membatalkan, serta mengajukan pengembalian atas peminjamannya.",
        "trigger": "Siswa ingin melihat atau mengubah status peminjamannya.",
        "uc_type": "Primary",
        "relationship": "Association",
        "include": "-",
        "extend": "-",
        "generalization": "-",
        "normal": [
            "Siswa membuka menu Peminjaman Saya.",
            "Sistem menampilkan daftar peminjaman aktif beserta riwayatnya.",
            "Siswa memilih salah satu peminjaman untuk melihat detail.",
            "Siswa dapat mengubah atau membatalkan pengajuan yang masih menunggu, atau mengajukan pengembalian alat yang sedang dipinjam.",
            "Sistem memperbarui status peminjaman.",
        ],
        "exceptional": "Jika peminjaman sudah disetujui atau diproses, pilihan ubah dan batal tidak lagi tersedia.",
    },
    {
        "no": 6,
        "name": "Pengembalian Alat",
        "id": "UC06",
        "importance": "High",
        "actor": "Siswa, Admin",
        "type": "Main Use Case",
        "stakeholder": "Siswa ingin mengembalikan alat, dan admin ingin memastikan alat kembali dalam kondisi baik.",
        "brief": "Use Case ini menjelaskan proses pengembalian alat, mulai dari pengajuan oleh siswa hingga pemeriksaan dan pencatatan oleh admin.",
        "trigger": "Alat yang dipinjam akan dikembalikan.",
        "uc_type": "Primary",
        "relationship": "Association",
        "include": "-",
        "extend": "-",
        "generalization": "-",
        "normal": [
            "Siswa mengajukan pengembalian alat melalui menu peminjaman.",
            "Admin menerima pengajuan pengembalian dari siswa.",
            "Admin memeriksa kondisi alat yang dikembalikan.",
            "Admin mencatat pengembalian, lalu sistem menambah kembali stok alat.",
            "Sistem mengubah status peminjaman menjadi Dikembalikan.",
        ],
        "exceptional": "Jika alat rusak atau hilang, admin mencatat hasil pemeriksaan dan menandainya perlu kompensasi. Untuk alat yang dibawa pulang, kartu jaminan dikembalikan setelah alat diterima.",
    },
    {
        "no": 7,
        "name": "Monitoring Peminjaman Siswa",
        "id": "UC07",
        "importance": "Medium",
        "actor": "Guru",
        "type": "Main Use Case",
        "stakeholder": "Guru ingin memantau peminjaman alat dan bahan oleh siswa bimbingannya.",
        "brief": "Use Case ini menjelaskan bagaimana guru memantau aktivitas peminjaman siswa dan jadwal praktikum terkait.",
        "trigger": "Guru ingin memantau kegiatan peminjaman siswa.",
        "uc_type": "Primary",
        "relationship": "Association",
        "include": "-",
        "extend": "-",
        "generalization": "-",
        "normal": [
            "Guru membuka menu Peminjaman Siswa.",
            "Sistem menampilkan daftar peminjaman siswa yang berkaitan dengan guru tersebut.",
            "Guru memilih salah satu peminjaman untuk melihat detail.",
            "Sistem menampilkan detail peminjaman beserta jadwal praktikum terkait.",
        ],
        "exceptional": "Jika belum ada data peminjaman, sistem menampilkan pesan bahwa data belum tersedia.",
    },
    {
        "no": 8,
        "name": "Membuat Laporan",
        "id": "UC08",
        "importance": "Medium",
        "actor": "Guru, Admin",
        "type": "Main Use Case",
        "stakeholder": "Admin dan guru ingin memperoleh rekap peminjaman dan inventaris untuk keperluan pelaporan.",
        "brief": "Use Case ini menjelaskan bagaimana admin atau guru menyusun dan mengunduh laporan peminjaman serta inventaris.",
        "trigger": "Admin atau guru membutuhkan laporan.",
        "uc_type": "Primary",
        "relationship": "Association",
        "include": "-",
        "extend": "-",
        "generalization": "-",
        "normal": [
            "Pengguna membuka menu Laporan.",
            "Pengguna memilih jenis laporan dan rentang tanggal yang diinginkan.",
            "Sistem menampilkan data laporan sesuai pilihan.",
            "Pengguna mengunduh atau mencetak laporan.",
        ],
        "exceptional": "Jika tidak ada data pada rentang yang dipilih, sistem menampilkan laporan kosong.",
    },
    {
        "no": 9,
        "name": "Verifikasi Peminjaman & Bahan",
        "id": "UC09",
        "importance": "High",
        "actor": "Admin",
        "type": "Main Use Case",
        "stakeholder": "Admin ingin memverifikasi pengajuan peminjaman alat dan permintaan bahan dari siswa.",
        "brief": "Use Case ini menjelaskan bagaimana admin menyetujui atau menolak pengajuan, serta mengatur prioritas antrian bila diperlukan.",
        "trigger": "Ada pengajuan peminjaman atau permintaan bahan yang masuk.",
        "uc_type": "Primary",
        "relationship": "Association",
        "include": "-",
        "extend": "-",
        "generalization": "-",
        "normal": [
            "Admin membuka menu Peminjaman.",
            "Sistem menampilkan daftar pengajuan yang menunggu persetujuan.",
            "Admin memeriksa detail pengajuan.",
            "Admin menyetujui atau menolak pengajuan.",
            "Sistem memperbarui status dan memberi tahu siswa.",
        ],
        "exceptional": "Jika pengajuan ditolak, admin mengisi alasan penolakan. Jika stok masih habis, admin dapat mengatur prioritas antrian pengajuan.",
    },
    {
        "no": 10,
        "name": "Mengelola Master Data",
        "id": "UC10",
        "importance": "High",
        "actor": "Admin",
        "type": "Main Use Case",
        "stakeholder": "Admin ingin menjaga data alat, bahan, pengguna, jadwal praktikum, dan kartu jaminan tetap akurat.",
        "brief": "Use Case ini menjelaskan bagaimana admin menambah, mengubah, dan menghapus data utama pada sistem.",
        "trigger": "Admin perlu memperbarui data utama sistem.",
        "uc_type": "Primary",
        "relationship": "Association",
        "include": "-",
        "extend": "-",
        "generalization": "-",
        "normal": [
            "Admin membuka menu data yang ingin dikelola (Alat, Bahan, Pengguna, Jadwal, atau Jaminan Kartu).",
            "Sistem menampilkan daftar data yang ada.",
            "Admin menambah, mengubah, atau menghapus data.",
            "Admin menyimpan perubahan.",
            "Sistem menyimpan dan menampilkan data terbaru.",
        ],
        "exceptional": "Jika isian tidak lengkap atau tidak sesuai, sistem menampilkan pesan kesalahan dan data tidak disimpan.",
    },
    {
        "no": 11,
        "name": "Kelola Antrian Round Robin",
        "id": "UC11",
        "importance": "Medium",
        "actor": "Sistem",
        "type": "Sub Use Case",
        "stakeholder": "Siswa ingin mendapat giliran alat secara adil saat stok terbatas.",
        "brief": "Use Case ini menjelaskan bagaimana sistem mengatur urutan antrian peminjaman alat secara bergiliran (round robin) ketika stok habis, dan mempromosikan pengajuan saat stok kembali tersedia.",
        "trigger": "Pengajuan peminjaman alat masuk saat stok habis, atau stok alat bertambah kembali.",
        "uc_type": "Secondary",
        "relationship": "Include (dari Mengajukan Peminjaman / UC04)",
        "include": "-",
        "extend": "-",
        "generalization": "-",
        "normal": [
            "Sistem menerima pengajuan peminjaman alat yang stoknya sedang habis.",
            "Sistem menempatkan pengajuan ke dalam antrian sesuai urutan dan prioritasnya.",
            "Saat stok tersedia kembali, sistem memilih pengajuan berikutnya secara bergiliran.",
            "Sistem mengubah status pengajuan menjadi siap ditinjau dan memberi tahu siswa.",
        ],
        "exceptional": "Jika admin menaikkan prioritas suatu pengajuan, sistem menempatkannya lebih dulu dalam urutan antrian.",
    },
]


def set_cell_border(cell, **kwargs):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcBorders = tcPr.find(qn("w:tcBorders"))
    if tcBorders is None:
        tcBorders = OxmlElement("w:tcBorders")
        tcPr.append(tcBorders)
    for edge in ("top", "left", "bottom", "right"):
        element = OxmlElement(f"w:{edge}")
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), "4")
        element.set(qn("w:space"), "0")
        element.set(qn("w:color"), "000000")
        tcBorders.append(element)


def shade_cell(cell, fill="D9D9D9"):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill)
    tcPr.append(shd)


def clear_cell(cell):
    cell.text = ""
    return cell.paragraphs[0]


def add_label_value(paragraph, label, value, label_italic=True):
    paragraph.paragraph_format.space_after = Pt(2)
    paragraph.paragraph_format.space_before = Pt(2)
    run_label = paragraph.add_run(label)
    run_label.italic = label_italic
    run_label.bold = False
    if value:
        run_value = paragraph.add_run(value)
        run_value.italic = False
    return paragraph


def add_stacked(cell, label, value):
    p = clear_cell(cell)
    add_label_value(p, label, "")
    p2 = cell.add_paragraph()
    p2.paragraph_format.space_before = Pt(0)
    r = p2.add_run(value)
    r.bold = False
    set_cell_border(cell)


def build_table(document, uc):
    document.add_paragraph()
    caption = document.add_paragraph()
    caption.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap_run = caption.add_run(f"Tabel 3.{uc['no']} Use Case Scenario {uc['name']}")
    cap_run.italic = True
    cap_run.bold = True

    table = document.add_table(rows=0, cols=3)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = "Table Grid"
    table.autofit = True

    # Baris 1: Use Case Name | ID | Importance
    row = table.add_row().cells
    add_stacked(row[0], "Use Case Name:", uc["name"])
    add_stacked(row[1], "ID:", uc["id"])
    p = clear_cell(row[2])
    add_label_value(p, "Importance: ", uc["importance"])
    set_cell_border(row[2])

    # Baris 2: Primary Actor (merge 0-1) | Use Case Type
    row = table.add_row().cells
    merged = row[0].merge(row[1])
    p = clear_cell(merged)
    add_label_value(p, "Primary Actor: ", uc["actor"])
    set_cell_border(merged)
    p = clear_cell(row[2])
    add_label_value(p, "Use Case Type: ", uc["type"])
    set_cell_border(row[2])

    # Baris 3: Stakeholder and Interest (full)
    row = table.add_row().cells
    merged = row[0].merge(row[1]).merge(row[2])
    p = clear_cell(merged)
    add_label_value(p, "Stakeholder and Interest:", "")
    p2 = merged.add_paragraph()
    p2.add_run(uc["stakeholder"])
    set_cell_border(merged)

    # Baris 4: Brief Description (full)
    row = table.add_row().cells
    merged = row[0].merge(row[1]).merge(row[2])
    p = clear_cell(merged)
    add_label_value(p, "Brief Description:", "")
    p2 = merged.add_paragraph()
    p2.add_run(uc["brief"])
    set_cell_border(merged)

    # Baris 5: Trigger/Type/Relationship/Include/Extend/Generalization (full)
    row = table.add_row().cells
    merged = row[0].merge(row[1]).merge(row[2])
    p = clear_cell(merged)
    add_label_value(p, "Trigger: ", uc["trigger"])
    for label, value in [
        ("Type: ", uc["uc_type"]),
        ("Relationship: ", uc["relationship"]),
        ("Include: ", uc["include"]),
        ("Extend: ", uc["extend"]),
        ("Generalization/Inheritance: ", uc["generalization"]),
    ]:
        pp = merged.add_paragraph()
        add_label_value(pp, label, value)
    set_cell_border(merged)

    # Baris 6: Normal Flow of Events (full)
    row = table.add_row().cells
    merged = row[0].merge(row[1]).merge(row[2])
    p = clear_cell(merged)
    add_label_value(p, "Normal Flow of Events:", "")
    for i, step in enumerate(uc["normal"], start=1):
        pp = merged.add_paragraph()
        pp.paragraph_format.left_indent = Pt(18)
        pp.add_run(f"{i}. {step}")
    set_cell_border(merged)

    # Baris 7: Exceptional Flows (full)
    row = table.add_row().cells
    merged = row[0].merge(row[1]).merge(row[2])
    p = clear_cell(merged)
    add_label_value(p, "Exceptional Flows:", "")
    p2 = merged.add_paragraph()
    p2.add_run(uc["exceptional"])
    set_cell_border(merged)

    return table


def main():
    document = Document()

    style = document.styles["Normal"]
    style.font.name = "Times New Roman"
    style.font.size = Pt(11)

    title = document.add_heading("Use Case Scenario", level=1)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER

    subtitle = document.add_paragraph()
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub_run = subtitle.add_run("Sistem Manajemen Alat & Bahan Laboratorium")
    sub_run.bold = True

    intro = document.add_paragraph(
        "Berikut adalah skenario dari 11 use case pada Sistem Manajemen Alat & Bahan "
        "Laboratorium yang menjelaskan interaksi antara aktor (Siswa, Guru, dan Admin) "
        "dengan sistem."
    )
    intro.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

    for uc in USE_CASES:
        build_table(document, uc)

    output_path = Path(__file__).resolve().parent / "usecase-scenario.docx"
    document.save(output_path)
    print(f"Dokumen berhasil dibuat: {output_path}")


if __name__ == "__main__":
    main()
