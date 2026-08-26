# -*- coding: utf-8 -*-
"""Generator ERD notasi Chen — versi sederhana.

Hanya atribut penting + relasi inti (bukan semua kolom/FK).
Jalankan: python generate_erd.py
"""

from __future__ import annotations

import math
from pathlib import Path
from xml.sax.saxutils import escape as _escape


def esc(text: str) -> str:
    return _escape(text, {'"': "&quot;", "'": "&apos;"})


# Atribut ringkas per entitas (PK + field penting saja)
ENTITIES: dict[str, dict] = {
    "USER": {
        "pk": ["id"],
        "attrs": ["name", "username", "email", "role", "status"],
        "x": 720,
        "y": 80,
    },
    "SUBMISSION": {
        "pk": ["id"],
        "attrs": ["code", "purpose", "request_date"],
        "x": 200,
        "y": 420,
    },
    "PRACTICUM_SCHEDULE": {
        "pk": ["id"],
        "attrs": ["code", "title", "kelas", "type"],
        "x": 1240,
        "y": 420,
    },
    "LOAN": {
        "pk": ["id"],
        "attrs": ["code", "item_type", "status", "borrow_scope"],
        "x": 720,
        "y": 720,
    },
    "EQUIPMENT": {
        "pk": ["id"],
        "attrs": ["code", "name", "item_type", "stock", "status"],
        "x": 80,
        "y": 1100,
    },
    "LOAN_ITEM": {
        "pk": ["id"],
        "attrs": ["quantity"],
        "x": 520,
        "y": 1100,
    },
    "LOAN_STATUS_LOG": {
        "pk": ["id"],
        "attrs": ["status", "note"],
        "x": 980,
        "y": 1100,
    },
    "LOAN_COLLATERAL": {
        "pk": ["id"],
        "attrs": ["code", "card_type", "status"],
        "x": 280,
        "y": 1480,
    },
    "LOAN_RETURN_INSPECTION": {
        "pk": ["id"],
        "attrs": ["result", "checked_at"],
        "x": 720,
        "y": 1480,
    },
    "LOAN_COMPENSATION": {
        "pk": ["id"],
        "attrs": ["status", "amount"],
        "x": 1160,
        "y": 1480,
    },
}

# Relasi inti saja
RELATIONSHIPS = [
    ("rel_ajukan", "mengajukan", "USER", "1", "SUBMISSION", "N", 460, 280),
    ("rel_mengajar", "mengajar", "USER", "1", "PRACTICUM_SCHEDULE", "N", 1000, 280),
    ("rel_pinjam", "meminjam", "USER", "1", "LOAN", "N", 720, 480),
    ("rel_hasilkan", "menghasilkan", "SUBMISSION", "1", "LOAN", "N", 460, 600),
    ("rel_jadwal", "dijadwalkan", "PRACTICUM_SCHEDULE", "1", "LOAN", "N", 1000, 600),
    ("rel_berisi", "berisi", "LOAN", "1", "LOAN_ITEM", "N", 620, 960),
    ("rel_termasuk", "termasuk pada", "EQUIPMENT", "1", "LOAN_ITEM", "N", 300, 1180),
    ("rel_log", "memiliki log", "LOAN", "1", "LOAN_STATUS_LOG", "N", 880, 960),
    ("rel_jaminan", "memiliki jaminan", "LOAN", "1", "LOAN_COLLATERAL", "1", 480, 1300),
    ("rel_inspeksi", "memiliki inspeksi", "LOAN", "1", "LOAN_RETURN_INSPECTION", "1", 720, 1300),
    ("rel_kompensasi", "memiliki kompensasi", "LOAN", "1", "LOAN_COMPENSATION", "1", 980, 1300),
]

ENT_W, ENT_H = 180, 48
ATTR_H = 32
REL_W, REL_H = 140, 56


def attr_positions(cx: float, cy: float, names: list[str], radius: float = 150):
    n = max(len(names), 1)
    # Sebar di atas & samping entitas (hindari tumpuk ke bawah ke arah relasi)
    start = -math.pi * 0.95
    end = -math.pi * 0.05
    out = []
    for i, name in enumerate(names):
        t = start if n == 1 else start + (end - start) * i / (n - 1)
        aw = max(90, min(160, 7 * len(name) + 24))
        x = cx + radius * math.cos(t) - aw / 2
        y = cy + (radius * 0.75) * math.sin(t) - ATTR_H / 2
        out.append((name, x, y, aw))
    return out


def cell(cid: str, value: str, x: float, y: float, w: float, h: float, style: str) -> str:
    return (
        f'<mxCell id="{cid}" value="{value}" style="{style}" vertex="1" parent="1">'
        f'<mxGeometry x="{round(x, 1)}" y="{round(y, 1)}" width="{w}" height="{h}" as="geometry"/>'
        f"</mxCell>"
    )


def edge(eid: str, src: str, dst: str, label: str = "") -> str:
    style = (
        "endArrow=none;html=1;strokeColor=#000000;fontSize=12;fontStyle=1;"
        "labelBackgroundColor=#FFFFFF;"
    )
    return (
        f'<mxCell id="{eid}" value="{esc(label)}" style="{style}" edge="1" parent="1" '
        f'source="{src}" target="{dst}">'
        f'<mxGeometry relative="1" as="geometry"/></mxCell>'
    )


def build_xml() -> str:
    cells = ['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>']

    cells.append(
        cell(
            "title",
            esc("ERD Sistem Manajemen Alat & Bahan Lab (Notasi Chen — Sederhana)"),
            40, 24, 720, 30,
            "text;html=1;strokeColor=none;fillColor=none;align=left;fontStyle=1;fontSize=15;",
        )
    )

    for ename, meta in ENTITIES.items():
        ex, ey = meta["x"], meta["y"]
        cx, cy = ex + ENT_W / 2, ey + ENT_H / 2

        cells.append(
            cell(
                f"ent_{ename}",
                esc(ename),
                ex, ey, ENT_W, ENT_H,
                "rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;"
                "fontStyle=1;fontSize=13;align=center;verticalAlign=middle;",
            )
        )

        all_attrs = list(meta["pk"]) + list(meta["attrs"])
        for i, (aname, ax, ay, aw) in enumerate(attr_positions(cx, cy, all_attrs)):
            is_pk = aname in meta["pk"]
            label = f"&lt;u&gt;{esc(aname)}&lt;/u&gt;" if is_pk else esc(aname)
            cells.append(
                cell(
                    f"attr_{ename}_{i}",
                    label,
                    ax, ay, aw, ATTR_H,
                    "ellipse;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;"
                    "fontSize=10;align=center;verticalAlign=middle;",
                )
            )
            cells.append(edge(f"e_attr_{ename}_{i}", f"ent_{ename}", f"attr_{ename}_{i}"))

    for rid, rname, a, ca, b, cb, rx, ry in RELATIONSHIPS:
        cells.append(
            cell(
                rid,
                esc(rname),
                rx, ry, REL_W, REL_H,
                "rhombus;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;"
                "fontSize=11;align=center;verticalAlign=middle;",
            )
        )
        cells.append(edge(f"{rid}_a", f"ent_{a}", rid, ca))
        cells.append(edge(f"{rid}_b", rid, f"ent_{b}", cb))

    note = (
        "Catatan (disederhanakan):&#xa;"
        "• Hanya atribut utama yang ditampilkan&#xa;"
        "• Equipment.item_type = alat | bahan&#xa;"
        "• FK tambahan ke USER (supervisor, admin, dll.) "
        "tidak digambar terpisah agar diagram tetap ringkas"
    )
    cells.append(
        cell(
            "note",
            note,
            40, 1720, 400, 100,
            "shape=note;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;"
            "fontSize=11;align=left;spacing=8;",
        )
    )

    legend = (
        "Legenda:&#xa;"
        "Persegi = Entitas | Oval = Atribut | Belah ketupat = Relasi | 1/N = Kardinalitas"
    )
    cells.append(
        cell(
            "legend",
            legend,
            460, 1720, 480, 60,
            "text;html=1;strokeColor=none;fillColor=none;align=left;fontSize=11;",
        )
    )

    body = "".join(cells)
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<mxfile host="app.diagrams.net" agent="Cursor" version="26.2.0">'
        '<diagram id="erd-chen-simple" name="ERD Chen Sederhana">'
        '<mxGraphModel dx="1400" dy="1000" grid="1" gridSize="10" guides="1" tooltips="1" '
        'connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1600" pageHeight="1900" '
        'math="0" shadow="0"><root>'
        f"{body}</root></mxGraphModel></diagram></mxfile>\n"
    )


def main():
    out = Path(__file__).resolve().parent / "erd.drawio"
    out.write_text(build_xml(), encoding="utf-8")
    from xml.etree import ElementTree as ET
    ET.parse(out)
    print(f"ERD sederhana tersimpan: {out}")
    print(f"  entitas : {len(ENTITIES)}")
    print(f"  relasi  : {len(RELATIONSHIPS)}")


if __name__ == "__main__":
    main()
