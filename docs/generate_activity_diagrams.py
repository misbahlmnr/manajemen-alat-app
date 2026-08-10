# -*- coding: utf-8 -*-
"""Generator activity diagram (draw.io) untuk 11 use case Sistem Manajemen Alat & Bahan Lab.

Menghasilkan satu file .drawio multi-halaman, satu halaman per use case, bergaya
swimlane (lane aktor | Sistem) menyerupai contoh Activity Diagram Login.
Jalankan: python generate_activity_diagrams.py
"""

from pathlib import Path
from xml.sax.saxutils import escape


# ----- Style konstanta -----
LANE = "swimlane;html=1;startSize=30;fillColor=none;strokeColor=#000000;fontStyle=1;horizontal=1;whiteSpace=wrap;"
ACT = "rounded=1;whiteSpace=wrap;html=1;fillColor=#F5F5F5;strokeColor=#666666;fontSize=11;"
DEC = "rhombus;whiteSpace=wrap;html=1;fillColor=#F5F5F5;strokeColor=#666666;fontSize=11;"
START = "ellipse;html=1;fillColor=#000000;strokeColor=#000000;"
END_OUT = "ellipse;html=1;fillColor=none;strokeColor=#000000;strokeWidth=1;"
END_IN = "ellipse;html=1;fillColor=#000000;strokeColor=#000000;"
EDGE = "edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;endArrow=classic;strokeColor=#000000;"
TITLE = "text;html=1;strokeColor=none;fillColor=none;fontStyle=2;fontSize=12;align=left;verticalAlign=middle;"

ACT_W, ACT_H = 200, 46
DEC_W, DEC_H = 150, 80
DOT = 30
LANE_Y = 44


def center(lane_w, w):
    return round((lane_w - w) / 2)


class Diagram:
    def __init__(self, key, title, lanes):
        self.key = key
        self.title = title
        self.lanes = lanes  # list of (name, width)
        self.height = 0
        self.nodes = []
        self.edges = []

    def lane_x(self, idx):
        return sum(w for _, w in self.lanes[:idx])

    def node(self, nid, lane, ntype, label="", y=0, x=None, w=None, h=None):
        if ntype == "act":
            w = w or ACT_W
            h = h or ACT_H
        elif ntype == "dec":
            w = w or DEC_W
            h = h or DEC_H
        else:  # start / end
            w = w or DOT
            h = h or DOT
        if x is None:
            x = center(self.lanes[lane][1], w)
        self.nodes.append(dict(id=nid, lane=lane, type=ntype, label=label, x=x, y=y, w=w, h=h))
        self.height = max(self.height, y + h + 60)
        return nid

    def edge(self, src, dst, label=""):
        self.edges.append((src, dst, label))


def slugify(text):
    keep = []
    for ch in text.lower():
        if ch.isalnum():
            keep.append(ch)
        elif ch in " -/":
            keep.append("-")
    slug = "".join(keep)
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug.strip("-")


def emit_diagram(d, page_index):
    cells = []
    # judul halaman
    cells.append(
        f'<mxCell id="{d.key}_title" value="{escape(d.title)}" style="{TITLE}" vertex="1" parent="1">'
        f'<mxGeometry x="0" y="8" width="700" height="24" as="geometry"/></mxCell>'
    )
    # lanes
    for i, (name, w) in enumerate(d.lanes):
        lid = f"{d.key}_lane{i}"
        cells.append(
            f'<mxCell id="{lid}" value="{escape(name)}" style="{LANE}" vertex="1" parent="1">'
            f'<mxGeometry x="{d.lane_x(i)}" y="{LANE_Y}" width="{w}" height="{d.height}" as="geometry"/></mxCell>'
        )
    # nodes
    for n in d.nodes:
        parent = f"{d.key}_lane{n['lane']}"
        nid = f"{d.key}_{n['id']}"
        if n["type"] == "start":
            cells.append(
                f'<mxCell id="{nid}" value="" style="{START}" vertex="1" parent="{parent}">'
                f'<mxGeometry x="{n["x"]}" y="{n["y"]}" width="{n["w"]}" height="{n["h"]}" as="geometry"/></mxCell>'
            )
        elif n["type"] == "end":
            cells.append(
                f'<mxCell id="{nid}" value="" style="{END_OUT}" vertex="1" parent="{parent}">'
                f'<mxGeometry x="{n["x"]}" y="{n["y"]}" width="{n["w"]}" height="{n["h"]}" as="geometry"/></mxCell>'
            )
            cells.append(
                f'<mxCell id="{nid}_i" value="" style="{END_IN}" vertex="1" parent="{nid}">'
                f'<mxGeometry x="7" y="7" width="16" height="16" as="geometry"/></mxCell>'
            )
        else:
            style = ACT if n["type"] == "act" else DEC
            cells.append(
                f'<mxCell id="{nid}" value="{escape(n["label"])}" style="{style}" vertex="1" parent="{parent}">'
                f'<mxGeometry x="{n["x"]}" y="{n["y"]}" width="{n["w"]}" height="{n["h"]}" as="geometry"/></mxCell>'
            )
    # edges
    for j, (src, dst, label) in enumerate(d.edges):
        eid = f"{d.key}_e{j}"
        cells.append(
            f'<mxCell id="{eid}" value="{escape(label)}" style="{EDGE}" edge="1" parent="1" '
            f'source="{d.key}_{src}" target="{d.key}_{dst}">'
            f'<mxGeometry relative="1" as="geometry"/></mxCell>'
        )

    body = "".join(cells)
    return (
        f'<diagram id="activity_{d.key}" name="{escape(d.short)}">'
        f'<mxGraphModel dx="1000" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" '
        f'connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1100" pageHeight="900" '
        f'math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>'
        f'{body}</root></mxGraphModel></diagram>'
    )


def build_all():
    diagrams = []

    # ---------- UC01 Login ----------
    d = Diagram("uc01", "a. Activity Diagram Masuk (Login)", [("User (Siswa, Guru, Admin)", 320), ("Sistem", 480)])
    d.short = "01 - Masuk"
    d.height = 720
    d.node("start", 0, "start", y=50)
    d.node("a1", 0, "act", "Membuka halaman masuk", y=130)
    d.node("a2", 0, "act", "Memasukkan email & kata sandi", y=220)
    d.node("s1", 1, "act", "Memverifikasi data pengguna", y=220)
    d.node("d1", 1, "dec", "Data valid?", y=320)
    d.node("s2", 1, "act", "Membuat sesi pengguna", y=450, x=30)
    d.node("s3", 1, "act", "Menampilkan pesan gagal masuk", y=450, x=250, w=210)
    d.node("s4", 1, "act", "Menampilkan beranda sesuai peran", y=550, x=30)
    d.node("end", 1, "end", y=650, x=245)
    d.edge("start", "a1"); d.edge("a1", "a2"); d.edge("a2", "s1"); d.edge("s1", "d1")
    d.edge("d1", "s2", "Ya"); d.edge("d1", "s3", "Tidak")
    d.edge("s2", "s4"); d.edge("s4", "end"); d.edge("s3", "end")
    diagrams.append(d)

    # ---------- UC02 Logout ----------
    d = Diagram("uc02", "b. Activity Diagram Keluar (Logout)", [("User (Siswa, Guru, Admin)", 320), ("Sistem", 480)])
    d.short = "02 - Keluar"
    d.height = 520
    d.node("start", 0, "start", y=50)
    d.node("a1", 0, "act", "Menekan menu keluar", y=140)
    d.node("s1", 1, "act", "Mengakhiri sesi pengguna", y=140)
    d.node("s2", 1, "act", "Mengarahkan ke halaman masuk", y=240)
    d.node("end", 1, "end", y=350)
    d.edge("start", "a1"); d.edge("a1", "s1"); d.edge("s1", "s2"); d.edge("s2", "end")
    diagrams.append(d)

    # ---------- UC03 Lihat Inventaris & Antrian ----------
    d = Diagram("uc03", "c. Activity Diagram Lihat Inventaris & Antrian", [("Siswa / Guru", 320), ("Sistem", 480)])
    d.short = "03 - Lihat Inventaris"
    d.height = 700
    d.node("start", 0, "start", y=50)
    d.node("a1", 0, "act", "Membuka menu Alat / Bahan Lab", y=130)
    d.node("s1", 1, "act", "Menampilkan daftar alat & bahan beserta stok", y=130)
    d.node("a2", 0, "act", "Memilih salah satu barang", y=250)
    d.node("s2", 1, "act", "Menampilkan detail barang", y=250)
    d.node("d1", 1, "dec", "Stok tersedia?", y=350)
    d.node("s3", 1, "act", "Menampilkan status tersedia", y=480, x=30)
    d.node("s4", 1, "act", "Menampilkan status & posisi antrian", y=480, x=250, w=210)
    d.node("end", 1, "end", y=590)
    d.edge("start", "a1"); d.edge("a1", "s1"); d.edge("s1", "a2"); d.edge("a2", "s2"); d.edge("s2", "d1")
    d.edge("d1", "s3", "Ya"); d.edge("d1", "s4", "Tidak"); d.edge("s3", "end"); d.edge("s4", "end")
    diagrams.append(d)

    # ---------- UC04 Mengajukan Peminjaman & Permintaan ----------
    d = Diagram("uc04", "d. Activity Diagram Mengajukan Peminjaman & Permintaan", [("Siswa", 320), ("Sistem", 480)])
    d.short = "04 - Mengajukan Peminjaman"
    d.height = 830
    d.node("start", 0, "start", y=50)
    d.node("a1", 0, "act", "Membuka menu Ajukan Peminjaman", y=130)
    d.node("a2", 0, "act", "Memilih jenis: alat atau bahan", y=220)
    d.node("a3", 0, "act", "Memilih barang, jumlah, pembimbing & jadwal", y=310)
    d.node("a4", 0, "act", "Mengisi keperluan lalu menekan kirim", y=410)
    d.node("s1", 1, "act", "Memeriksa kelengkapan & stok", y=410)
    d.node("d1", 1, "dec", "Stok alat tersedia?", y=510)
    d.node("s2", 1, "act", "Menyimpan pengajuan (Menunggu Persetujuan)", y=640, x=20, w=220)
    d.node("s3", 1, "act", "Memasukkan pengajuan ke antrian", y=640, x=260, w=200)
    d.node("end", 1, "end", y=750)
    d.edge("start", "a1"); d.edge("a1", "a2"); d.edge("a2", "a3"); d.edge("a3", "a4")
    d.edge("a4", "s1"); d.edge("s1", "d1"); d.edge("d1", "s2", "Ya"); d.edge("d1", "s3", "Tidak")
    d.edge("s2", "end"); d.edge("s3", "end")
    diagrams.append(d)

    # ---------- UC05 Kelola Peminjaman Saya ----------
    d = Diagram("uc05", "e. Activity Diagram Kelola Peminjaman Saya", [("Siswa", 320), ("Sistem", 480)])
    d.short = "05 - Kelola Peminjaman"
    d.height = 760
    d.node("start", 0, "start", y=50)
    d.node("a1", 0, "act", "Membuka menu Peminjaman Saya", y=130)
    d.node("s1", 1, "act", "Menampilkan daftar peminjaman & riwayat", y=130)
    d.node("a2", 0, "act", "Memilih salah satu peminjaman", y=250)
    d.node("s2", 1, "act", "Menampilkan detail peminjaman", y=250)
    d.node("d1", 1, "dec", "Masih menunggu persetujuan?", y=350)
    d.node("a3", 0, "act", "Mengubah / membatalkan pengajuan", y=490)
    d.node("a4", 1, "act", "Mengajukan pengembalian alat", y=490, x=250, w=210)
    d.node("s3", 1, "act", "Memperbarui status peminjaman", y=600, x=20, w=220)
    d.node("end", 1, "end", y=700)
    d.edge("start", "a1"); d.edge("a1", "s1"); d.edge("s1", "a2"); d.edge("a2", "s2"); d.edge("s2", "d1")
    d.edge("d1", "a3", "Ya"); d.edge("d1", "a4", "Tidak"); d.edge("a3", "s3"); d.edge("a4", "s3"); d.edge("s3", "end")
    diagrams.append(d)

    # ---------- UC06 Pengembalian Alat (3 lane) ----------
    d = Diagram("uc06", "f. Activity Diagram Pengembalian Alat", [("Siswa", 240), ("Admin", 380), ("Sistem", 320)])
    d.short = "06 - Pengembalian Alat"
    d.height = 830
    d.node("start", 0, "start", y=50)
    d.node("a1", 0, "act", "Mengajukan pengembalian alat", y=130, x=20)
    d.node("b1", 1, "act", "Menerima pengajuan pengembalian", y=130)
    d.node("b2", 1, "act", "Memeriksa kondisi alat", y=230)
    d.node("d1", 1, "dec", "Alat baik & lengkap?", y=330)
    d.node("b3", 1, "act", "Mencatat pengembalian normal", y=470, x=10, w=175, h=54)
    d.node("b4", 1, "act", "Mencatat kerusakan & tandai kompensasi", y=470, x=195, w=175, h=54)
    d.node("s1", 2, "act", "Menambah kembali stok alat", y=600)
    d.node("s2", 2, "act", "Mengubah status jadi Dikembalikan", y=700)
    d.node("end", 2, "end", y=790)
    d.edge("start", "a1"); d.edge("a1", "b1"); d.edge("b1", "b2"); d.edge("b2", "d1")
    d.edge("d1", "b3", "Ya"); d.edge("d1", "b4", "Tidak"); d.edge("b3", "s1"); d.edge("b4", "s1")
    d.edge("s1", "s2"); d.edge("s2", "end")
    diagrams.append(d)

    # ---------- UC07 Monitoring Peminjaman Siswa ----------
    d = Diagram("uc07", "g. Activity Diagram Monitoring Peminjaman Siswa", [("Guru", 320), ("Sistem", 480)])
    d.short = "07 - Monitoring"
    d.height = 700
    d.node("start", 0, "start", y=50)
    d.node("a1", 0, "act", "Membuka menu Peminjaman Siswa", y=130)
    d.node("s1", 1, "act", "Menampilkan daftar peminjaman siswa bimbingan", y=130)
    d.node("d1", 1, "dec", "Ada data peminjaman?", y=250)
    d.node("a2", 0, "act", "Memilih peminjaman untuk melihat detail", y=390)
    d.node("s3", 1, "act", "Menampilkan pesan data belum tersedia", y=390, x=250, w=210)
    d.node("s2", 1, "act", "Menampilkan detail & jadwal praktikum", y=490, x=30, w=210)
    d.node("end", 1, "end", y=590)
    d.edge("start", "a1"); d.edge("a1", "s1"); d.edge("s1", "d1")
    d.edge("d1", "a2", "Ya"); d.edge("d1", "s3", "Tidak"); d.edge("a2", "s2"); d.edge("s2", "end"); d.edge("s3", "end")
    diagrams.append(d)

    # ---------- UC08 Membuat Laporan ----------
    d = Diagram("uc08", "h. Activity Diagram Membuat Laporan", [("Admin / Guru", 320), ("Sistem", 480)])
    d.short = "08 - Membuat Laporan"
    d.height = 760
    d.node("start", 0, "start", y=50)
    d.node("a1", 0, "act", "Membuka menu Laporan", y=130)
    d.node("a2", 0, "act", "Memilih jenis laporan & rentang tanggal", y=230)
    d.node("s1", 1, "act", "Mengambil & menampilkan data laporan", y=330)
    d.node("d1", 1, "dec", "Ada data?", y=430)
    d.node("a3", 0, "act", "Mengunduh / mencetak laporan", y=570)
    d.node("s2", 1, "act", "Menampilkan laporan kosong", y=570, x=250, w=210)
    d.node("end", 1, "end", y=670)
    d.edge("start", "a1"); d.edge("a1", "a2"); d.edge("a2", "s1"); d.edge("s1", "d1")
    d.edge("d1", "a3", "Ya"); d.edge("d1", "s2", "Tidak"); d.edge("a3", "end"); d.edge("s2", "end")
    diagrams.append(d)

    # ---------- UC09 Verifikasi Peminjaman & Bahan ----------
    d = Diagram("uc09", "i. Activity Diagram Verifikasi Peminjaman & Bahan", [("Admin", 320), ("Sistem", 480)])
    d.short = "09 - Verifikasi"
    d.height = 780
    d.node("start", 0, "start", y=50)
    d.node("a1", 0, "act", "Membuka menu Peminjaman", y=130)
    d.node("s1", 1, "act", "Menampilkan daftar pengajuan menunggu", y=130)
    d.node("a2", 0, "act", "Memeriksa detail pengajuan", y=250)
    d.node("d1", 1, "dec", "Setujui pengajuan?", y=350)
    d.node("a3", 0, "act", "Menyetujui pengajuan", y=490)
    d.node("a4", 1, "act", "Menolak & mengisi alasan penolakan", y=490, x=250, w=210)
    d.node("s2", 1, "act", "Memperbarui status & memberi tahu siswa", y=600, x=20, w=220)
    d.node("end", 1, "end", y=700)
    d.edge("start", "a1"); d.edge("a1", "s1"); d.edge("s1", "a2"); d.edge("a2", "d1")
    d.edge("d1", "a3", "Ya"); d.edge("d1", "a4", "Tidak"); d.edge("a3", "s2"); d.edge("a4", "s2"); d.edge("s2", "end")
    diagrams.append(d)

    # ---------- UC10 Mengelola Master Data ----------
    d = Diagram("uc10", "j. Activity Diagram Mengelola Master Data", [("Admin", 320), ("Sistem", 480)])
    d.short = "10 - Master Data"
    d.height = 800
    d.node("start", 0, "start", y=50)
    d.node("a1", 0, "act", "Membuka menu data (alat/bahan/pengguna/jadwal/jaminan)", y=130, h=56)
    d.node("s1", 1, "act", "Menampilkan daftar data", y=135)
    d.node("a2", 0, "act", "Menambah / mengubah / menghapus data", y=250)
    d.node("a3", 0, "act", "Menyimpan perubahan", y=350)
    d.node("s2", 1, "act", "Memeriksa isian data", y=350)
    d.node("d1", 1, "dec", "Data valid?", y=450)
    d.node("s3", 1, "act", "Menyimpan & menampilkan data terbaru", y=590, x=20, w=220)
    d.node("s4", 1, "act", "Menampilkan pesan kesalahan", y=590, x=260, w=200)
    d.node("end", 1, "end", y=700, x=110)
    d.edge("start", "a1"); d.edge("a1", "s1"); d.edge("s1", "a2"); d.edge("a2", "a3")
    d.edge("a3", "s2"); d.edge("s2", "d1"); d.edge("d1", "s3", "Ya"); d.edge("d1", "s4", "Tidak")
    d.edge("s3", "end"); d.edge("s4", "a2", "Perbaiki")
    diagrams.append(d)

    # ---------- UC11 Kelola Antrian Round Robin ----------
    d = Diagram("uc11", "k. Activity Diagram Kelola Antrian Round Robin", [("Siswa", 320), ("Sistem", 480)])
    d.short = "11 - Antrian Round Robin"
    d.height = 820
    d.node("start", 0, "start", y=50)
    d.node("a1", 0, "act", "Mengajukan peminjaman alat", y=140)
    d.node("d1", 1, "dec", "Stok tersedia?", y=130)
    d.node("s2", 1, "act", "Memproses langsung (siap ditinjau)", y=280, x=20, w=220)
    d.node("s1", 1, "act", "Menempatkan pengajuan ke antrian", y=280, x=260, w=200)
    d.node("s3", 1, "act", "Menunggu stok bertambah", y=390, x=260, w=200)
    d.node("s4", 1, "act", "Memilih pengajuan berikutnya secara bergiliran", y=500, x=260, w=200)
    d.node("s5", 1, "act", "Ubah status siap ditinjau & beri tahu siswa", y=630, x=20, w=220)
    d.node("end", 1, "end", y=730)
    d.edge("start", "a1"); d.edge("a1", "d1")
    d.edge("d1", "s2", "Ya"); d.edge("d1", "s1", "Tidak")
    d.edge("s1", "s3"); d.edge("s3", "s4"); d.edge("s4", "s5"); d.edge("s2", "s5"); d.edge("s5", "end")
    diagrams.append(d)

    return diagrams


def main():
    diagrams = build_all()
    out_dir = Path(__file__).resolve().parent / "activity-diagrams"
    out_dir.mkdir(exist_ok=True)

    for i, d in enumerate(diagrams, start=1):
        diagram_xml = emit_diagram(d, i)
        xml = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<mxfile host="app.diagrams.net" agent="Cursor" version="26.2.0" type="device">'
            f"{diagram_xml}</mxfile>\n"
        )
        filename = f"{slugify(d.short)}.drawio"
        (out_dir / filename).write_text(xml, encoding="utf-8")
        print(f"  dibuat: {filename}")

    print(f"\n{len(diagrams)} activity diagram tersimpan di: {out_dir}")


if __name__ == "__main__":
    main()
