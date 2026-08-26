# -*- coding: utf-8 -*-
"""Generator class/entity diagram (draw.io) — layout & routing dirapikan.

Jalankan: python generate_class_diagram.py
"""

from pathlib import Path
from xml.sax.saxutils import escape as _escape


def escape(text: str) -> str:
    return _escape(text, {'"': "&quot;", "'": "&apos;"})


# Layout: 3 kolom + koridor panah (hindari silang di tengah kotak)
# Col L (x=50): User, Equipment, PracticumSchedule
# Col M (x=420): Submission, Loan
# Col R (x=820): LoanItem, LoanStatusLog, LoanCollateral, LoanCompensation, LoanReturnInspection
ENTITIES = {
    "User": {
        "attrs": [
            "name: string",
            "username: string",
            "email: string",
            "email_verified_at: datetime",
            "password: string",
            "role: enum",
            "status: enum",
            "phone: string",
            "nisn: string",
            "nip: string",
            "class: string",
            "remember_token: string",
            "created_at: timestamp",
            "updated_at: timestamp",
        ],
        "keys": ["id: bigint (PK)"],
        "x": 50,
        "y": 70,
        "w": 250,
        "h": 320,
    },
    "Submission": {
        "attrs": [
            "code: string",
            "purpose: string",
            "notes: text",
            "request_date: date",
            "created_at: timestamp",
            "updated_at: timestamp",
        ],
        "keys": [
            "id: bigint (PK)",
            "borrower_id: bigint (FK)",
            "supervisor_id: bigint (FK)",
        ],
        "x": 420,
        "y": 70,
        "w": 260,
        "h": 220,
    },
    "LoanItem": {
        "attrs": [
            "quantity: int",
            "created_at: timestamp",
            "updated_at: timestamp",
        ],
        "keys": [
            "id: bigint (PK)",
            "loan_id: bigint (FK)",
            "equipment_id: bigint (FK)",
        ],
        "x": 820,
        "y": 70,
        "w": 240,
        "h": 180,
    },
    "Equipment": {
        "attrs": [
            "code: string",
            "name: string",
            "category: string",
            "item_type: enum",
            "stock: int",
            "available: int",
            "qty_baik: int",
            "qty_rusak_ringan: int",
            "qty_rusak_berat: int",
            "location: string",
            "description: text",
            "image_path: string",
            "status: string",
            "unit: string",
            "min_stock: int",
            "created_at: timestamp",
            "updated_at: timestamp",
        ],
        "keys": ["id: bigint (PK)"],
        "x": 50,
        "y": 430,
        "w": 250,
        "h": 380,
    },
    "Loan": {
        "attrs": [
            "code: string",
            "loan_group_id: uuid",
            "item_type: enum",
            "status: enum",
            "queue_priority: int",
            "queued_at: timestamp",
            "queue_priority_note: string",
            "queue_priority_set_at: timestamp",
            "request_date: date",
            "borrowed_at: datetime",
            "due_at: datetime",
            "returned_at: datetime",
            "purpose: string",
            "notes: text",
            "rejection_reason: text",
            "borrow_scope: enum",
            "borrow_reason: enum",
            "usage_room: string",
            "created_at: timestamp",
            "updated_at: timestamp",
        ],
        "keys": [
            "id: bigint (PK)",
            "submission_id: bigint (FK)",
            "borrower_id: bigint (FK)",
            "supervisor_id: bigint (FK)",
            "practicum_schedule_id: bigint (FK)",
            "queue_priority_set_by: bigint (FK)",
        ],
        "x": 420,
        "y": 340,
        "w": 280,
        "h": 500,
    },
    "LoanStatusLog": {
        "attrs": [
            "status: string",
            "note: text",
            "created_at: timestamp",
        ],
        "keys": [
            "id: bigint (PK)",
            "loan_id: bigint (FK)",
            "user_id: bigint (FK)",
        ],
        "x": 820,
        "y": 280,
        "w": 240,
        "h": 190,
    },
    "LoanCollateral": {
        "attrs": [
            "code: string",
            "card_type: enum",
            "card_number: string",
            "status: enum",
            "held_at: datetime",
            "returned_at: datetime",
            "notes: text",
            "created_at: timestamp",
            "updated_at: timestamp",
        ],
        "keys": [
            "id: bigint (PK)",
            "loan_id: bigint (FK)",
            "student_id: bigint (FK)",
            "held_by_admin_id: bigint (FK)",
        ],
        "x": 820,
        "y": 500,
        "w": 250,
        "h": 280,
    },
    "PracticumSchedule": {
        "attrs": [
            "code: string",
            "title: string",
            "mata_kuliah: string",
            "jurusan: string",
            "kelas: string",
            "type: enum",
            "hari: enum",
            "tanggal: date",
            "jam_mulai: time",
            "jam_selesai: time",
            "ruangan: string",
            "priority: enum",
            "notes: text",
            "created_at: timestamp",
            "updated_at: timestamp",
        ],
        "keys": [
            "id: bigint (PK)",
            "guru_id: bigint (FK)",
        ],
        "x": 50,
        "y": 850,
        "w": 250,
        "h": 360,
    },
    "LoanCompensation": {
        "attrs": [
            "required: boolean",
            "status: enum",
            "amount: int",
            "description: text",
            "completed_at: timestamp",
            "created_at: timestamp",
            "updated_at: timestamp",
        ],
        "keys": [
            "id: bigint (PK)",
            "loan_id: bigint (FK)",
            "completed_by_admin_id: bigint (FK)",
        ],
        "x": 820,
        "y": 810,
        "w": 260,
        "h": 260,
    },
    "LoanReturnInspection": {
        "attrs": [
            "result: enum",
            "notes: text",
            "missing_items: text",
            "damage_description: text",
            "checked_at: timestamp",
            "created_at: timestamp",
            "updated_at: timestamp",
        ],
        "keys": [
            "id: bigint (PK)",
            "loan_id: bigint (FK)",
            "checked_by_admin_id: bigint (FK)",
        ],
        "x": 420,
        "y": 900,
        "w": 280,
        "h": 280,
    },
}


def entity_html(name: str, attrs: list[str], keys: list[str]) -> str:
    attr_lines = "<br/>".join(escape(a) for a in attrs)
    key_lines = "<br/>".join(escape(k) for k in keys)
    return (
        f'<p style="margin:0;padding:6px 8px;background:#F3F4F6;border-bottom:1px solid #9CA3AF;">'
        f'<font style="background:#0D9488;color:#FFFFFF;border-radius:10px;padding:1px 6px;'
        f'font-size:10px;font-weight:bold;">T</font> '
        f'<b>{escape(name)}</b></p>'
        f'<p style="margin:6px 8px;font-size:11px;line-height:1.35;">{attr_lines}</p>'
        f'<hr style="margin:4px 0;border:none;border-top:1px solid #9CA3AF;"/>'
        f'<p style="margin:6px 8px 8px;font-size:11px;line-height:1.35;">{key_lines}</p>'
    )


def edge(
    eid: str,
    src: str,
    dst: str,
    label: str,
    *,
    dashed: bool = False,
    exit_xy: tuple[float, float] | None = None,
    entry_xy: tuple[float, float] | None = None,
    points: list[tuple[float, float]] | None = None,
) -> str:
    dash = "dashed=1;" if dashed else ""
    ports = ""
    if exit_xy:
        ports += f"exitX={exit_xy[0]};exitY={exit_xy[1]};exitDx=0;exitDy=0;"
    if entry_xy:
        ports += f"entryX={entry_xy[0]};entryY={entry_xy[1]};entryDx=0;entryDy=0;"

    style = (
        "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;"
        f"html=1;endArrow=block;endFill=0;startArrow=none;fontSize=10;"
        f"strokeColor=#000000;labelBackgroundColor=#FFFFFF;{dash}{ports}"
    )

    geom = '<mxGeometry relative="1" as="geometry">'
    if points:
        geom += '<Array as="points">'
        for x, y in points:
            geom += f'<mxPoint x="{x}" y="{y}"/>'
        geom += "</Array>"
    geom += "</mxGeometry>"

    return (
        f'<mxCell id="{eid}" value="{escape(label)}" style="{style}" edge="1" parent="1" '
        f'source="ent_{src}" target="ent_{dst}">{geom}</mxCell>'
    )


def build_relations() -> list[str]:
    """Relasi dengan koridor routing agar tidak menembus kotak."""
    # Koridor X: antara L-M = 350, antara M-R = 740
    # Koridor Y atas = 50, bawah = 1240
    rels = []

    # --- Relasi pendek / berdekatan (prioritas visual) ---
    # User -> Submission
    rels.append(edge(
        "r_sub_borrower", "User", "Submission", "1  borrower_id  *",
        exit_xy=(1, 0.28), entry_xy=(0, 0.35),
    ))
    rels.append(edge(
        "r_sub_supervisor", "User", "Submission", "1  supervisor_id  0..*",
        dashed=True, exit_xy=(1, 0.42), entry_xy=(0, 0.55),
    ))

    # Submission -> Loan (vertikal)
    rels.append(edge(
        "r_loan_submission", "Submission", "Loan", "1  submission_id  *",
        exit_xy=(0.5, 1), entry_xy=(0.5, 0),
    ))

    # User -> Loan (lewat koridor x=350)
    rels.append(edge(
        "r_loan_borrower", "User", "Loan", "1  borrower_id  *",
        exit_xy=(1, 0.70), entry_xy=(0, 0.22),
        points=[(350, 294), (350, 450)],
    ))
    rels.append(edge(
        "r_loan_supervisor", "User", "Loan", "1  supervisor_id  0..*",
        dashed=True, exit_xy=(1, 0.82), entry_xy=(0, 0.32),
        points=[(365, 332), (365, 500)],
    ))
    rels.append(edge(
        "r_loan_qprio", "User", "Loan", "1  queue_priority_set_by  0..*",
        dashed=True, exit_xy=(1, 0.90), entry_xy=(0, 0.42),
        points=[(380, 358), (380, 550)],
    ))

    # User -> PracticumSchedule (koridor kiri, hindari Equipment)
    rels.append(edge(
        "r_sched_guru", "User", "PracticumSchedule", "1  guru_id  *",
        exit_xy=(0, 0.85), entry_xy=(0, 0.12),
        points=[(35, 342), (35, 893)],
    ))

    # PracticumSchedule -> Loan
    rels.append(edge(
        "r_loan_sched", "PracticumSchedule", "Loan", "1  practicum_schedule_id  0..*",
        dashed=True, exit_xy=(1, 0.25), entry_xy=(0, 0.85),
        points=[(350, 940), (350, 765)],
    ))

    # Loan -> children kanan (koridor pendek dari sisi kanan Loan)
    rels.append(edge(
        "r_item_loan", "Loan", "LoanItem", "1  loan_id  *",
        exit_xy=(1, 0.12), entry_xy=(0, 0.55),
        points=[(740, 400), (740, 169)],
    ))
    rels.append(edge(
        "r_log_loan", "Loan", "LoanStatusLog", "1  loan_id  *",
        exit_xy=(1, 0.28), entry_xy=(0, 0.45),
    ))
    rels.append(edge(
        "r_col_loan", "Loan", "LoanCollateral", "1  loan_id  0..1",
        exit_xy=(1, 0.48), entry_xy=(0, 0.35),
    ))
    rels.append(edge(
        "r_comp_loan", "Loan", "LoanCompensation", "1  loan_id  0..1",
        exit_xy=(1, 0.72), entry_xy=(0, 0.30),
        points=[(740, 700), (740, 888)],
    ))
    rels.append(edge(
        "r_insp_loan", "Loan", "LoanReturnInspection", "1  loan_id  0..1",
        exit_xy=(0.5, 1), entry_xy=(0.5, 0),
    ))

    # Equipment -> LoanItem (koridor atas: naik lalu kanan)
    rels.append(edge(
        "r_item_eq", "Equipment", "LoanItem", "1  equipment_id  *",
        exit_xy=(1, 0.15), entry_xy=(0, 0.75),
        points=[(330, 487), (330, 50), (800, 50), (800, 205)],
    ))

    # User -> entitas kanan lewat koridor ATAS (y=45) agar tidak menembus Loan
    rels.append(edge(
        "r_log_user", "User", "LoanStatusLog", "1  user_id  0..*",
        dashed=True, exit_xy=(0.85, 0), entry_xy=(0.5, 0),
        points=[(262, 45), (940, 45), (940, 270)],
    ))
    rels.append(edge(
        "r_col_student", "User", "LoanCollateral", "1  student_id  *",
        exit_xy=(0.70, 0), entry_xy=(0.35, 0),
        points=[(225, 40), (908, 40), (908, 490)],
    ))
    rels.append(edge(
        "r_col_admin", "User", "LoanCollateral", "1  held_by_admin_id  0..*",
        dashed=True, exit_xy=(0.55, 0), entry_xy=(0.65, 0),
        points=[(188, 35), (982, 35), (982, 490)],
    ))

    # User -> Inspection / Compensation lewat koridor BAWAH (y=1230)
    rels.append(edge(
        "r_insp_admin", "User", "LoanReturnInspection", "1  checked_by_admin_id  0..*",
        dashed=True, exit_xy=(0, 0.55), entry_xy=(0, 0.75),
        points=[(30, 246), (30, 1230), (400, 1230), (400, 1110)],
    ))
    rels.append(edge(
        "r_comp_admin", "User", "LoanCompensation", "1  completed_by_admin_id  0..*",
        dashed=True, exit_xy=(0, 0.70), entry_xy=(0, 0.85),
        points=[(25, 294), (25, 1250), (800, 1250), (800, 1031)],
    ))

    return rels


def build_xml() -> str:
    cells = ['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>']

    cells.append(
        '<mxCell id="frame" value="Entitas Database" style="rounded=0;whiteSpace=wrap;html=1;'
        'fillColor=none;strokeColor=#000000;verticalAlign=top;fontStyle=1;fontSize=14;'
        'align=center;spacingTop=6;" vertex="1" parent="1">'
        '<mxGeometry x="10" y="10" width="1080" height="1360" as="geometry"/></mxCell>'
    )

    for name, meta in ENTITIES.items():
        html = entity_html(name, meta["attrs"], meta["keys"])
        cells.append(
            f'<mxCell id="ent_{name}" value="{escape(html)}" style="rounded=0;whiteSpace=wrap;html=1;'
            f'align=left;verticalAlign=top;fillColor=#FFFFFF;strokeColor=#000000;fontSize=11;'
            f'overflow=fill;spacing=0;" vertex="1" parent="1">'
            f'<mxGeometry x="{meta["x"]}" y="{meta["y"]}" width="{meta["w"]}" height="{meta["h"]}" '
            f'as="geometry"/></mxCell>'
        )

    note = (
        "Catatan: tabel equipment menyimpan alat dan bahan "
        "melalui kolom item_type (alat | bahan). Model Supply "
        "menggunakan tabel yang sama.&#xa;&#xa;"
        "Garis putus-putus = FK nullable."
    )
    cells.append(
        f'<mxCell id="note1" value="{escape(note)}" style="shape=note;whiteSpace=wrap;html=1;'
        f'backgroundOutline=1;fillColor=#FFF2CC;strokeColor=#D6B656;fontSize=11;'
        f'align=left;spacing=8;" vertex="1" parent="1">'
        f'<mxGeometry x="50" y="1285" width="300" height="70" as="geometry"/></mxCell>'
    )
    # Note dekat Equipment — tanpa edge panjang; cukup posisi
    # (edge note dihilangkan agar tidak menambah kekacauan)

    cells.extend(build_relations())

    body = "".join(cells)
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<mxfile host="app.diagrams.net" agent="Cursor" version="26.2.0">'
        '<diagram id="class-entitas-db" name="Class / Entitas Database">'
        '<mxGraphModel dx="1400" dy="1000" grid="1" gridSize="10" guides="1" tooltips="1" '
        'connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1200" pageHeight="1450" '
        'math="0" shadow="0"><root>'
        f"{body}</root></mxGraphModel></diagram></mxfile>\n"
    )


def main():
    out = Path(__file__).resolve().parent / "class-diagram.drawio"
    xml = build_xml()
    out.write_text(xml, encoding="utf-8")
    from xml.etree import ElementTree as ET
    ET.parse(out)
    print(f"Class/entity diagram dirapikan: {out}")


if __name__ == "__main__":
    main()
