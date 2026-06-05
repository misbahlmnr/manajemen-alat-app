import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

function formatFilename(type) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return `laporan_${type}_${date}`;
}

function addPdfHeader(doc, meta, title) {
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(meta.school_name ?? "Sekolah", pageWidth / 2, 15, {
        align: "center",
    });
    doc.setFontSize(11);
    doc.text(meta.lab_name ?? "Laboratorium", pageWidth / 2, 22, {
        align: "center",
    });
    doc.setFontSize(13);
    doc.text(title, pageWidth / 2, 32, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Dicetak: ${meta.generated_at ?? "-"}`, 14, 40);
}

function addPdfFooter(doc) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
            `Halaman ${i} dari ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: "center" },
        );
    }
}

function downloadWorkbook(workbook, filename) {
    XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportInventarisPdf(rows, meta, filters) {
    const doc = new jsPDF({ orientation: "landscape" });
    const title =
        filters.item_type === "bahan"
            ? "Laporan Inventaris Bahan"
            : filters.item_type === "alat"
              ? "Laporan Inventaris Alat"
              : "Laporan Inventaris Laboratorium";
    addPdfHeader(doc, meta, title);

    autoTable(doc, {
        startY: 46,
        head: [
            [
                "No",
                "Kode",
                "Nama",
                "Jenis",
                "Kategori",
                "Stok",
                "Tersedia",
                "Kondisi",
                "Lokasi",
            ],
        ],
        body: rows.map((row, i) => [
            i + 1,
            row.code,
            row.name,
            row.item_type_label,
            row.category,
            row.stock,
            row.available,
            row.condition_label,
            row.location,
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 58, 95] },
    });

    addPdfFooter(doc);
    doc.save(`${formatFilename("inventaris")}.pdf`);
}

export function exportInventarisExcel(rows, filters) {
    const data = rows.map((row, i) => ({
        No: i + 1,
        Kode: row.code,
        Nama: row.name,
        Jenis: row.item_type_label,
        Kategori: row.category,
        Stok: row.stock,
        Tersedia: row.available,
        Dipinjam: row.borrowed,
        Satuan: row.unit,
        Kondisi: row.condition_label,
        Status: row.availability_label || row.stock_label,
        Lokasi: row.location,
        Deskripsi: row.description ?? "-",
    }));

    const sheetName =
        filters.item_type === "bahan"
            ? "Bahan"
            : filters.item_type === "alat"
              ? "Alat"
              : "Inventaris";
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(data),
        sheetName,
    );
    downloadWorkbook(workbook, formatFilename("inventaris"));
}

export function exportPeminjamanPdf(rows, meta, statusOptions) {
    const doc = new jsPDF({ orientation: "landscape" });
    addPdfHeader(doc, meta, "Laporan Peminjaman");

    autoTable(doc, {
        startY: 46,
        head: [
            [
                "No",
                "Kode",
                "Peminjam",
                "Kelas",
                "Barang",
                "Jenis",
                "Qty",
                "Tgl Pengajuan",
                "Batas",
                "Status",
            ],
        ],
        body: rows.map((row, i) => [
            i + 1,
            row.code,
            row.borrower_name,
            row.borrower_class,
            row.items_summary,
            row.item_type_label,
            row.total_quantity,
            row.request_date_formatted,
            row.due_at_formatted,
            statusOptions?.[row.status] ?? row.status,
        ]),
        styles: { fontSize: 7 },
        headStyles: { fillColor: [30, 58, 95] },
    });

    addPdfFooter(doc);
    doc.save(`${formatFilename("peminjaman")}.pdf`);
}

export function exportPeminjamanExcel(rows, statusOptions) {
    const data = rows.map((row, i) => ({
        No: i + 1,
        Kode: row.code,
        Peminjam: row.borrower_name,
        Kelas: row.borrower_class,
        "Guru Pembimbing": row.supervisor_name,
        Barang: row.items_summary,
        Jenis: row.item_type_label,
        Jumlah: row.total_quantity,
        "Lokasi Pinjam": row.borrow_scope_label ?? "-",
        "Tgl Pengajuan": row.request_date_formatted,
        "Tgl Dipinjam": row.borrowed_at_formatted,
        "Batas Pengembalian": row.due_at_formatted,
        "Tgl Dikembalikan": row.returned_at_formatted,
        Status: statusOptions?.[row.status] ?? row.status,
        "Status Jaminan": row.collateral_status_label ?? "-",
        Keperluan: row.purpose ?? "-",
        Catatan: row.notes ?? "-",
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(data),
        "Peminjaman",
    );
    downloadWorkbook(workbook, formatFilename("peminjaman"));
}

export function exportPenggunaPdf(rows, meta) {
    const doc = new jsPDF();
    addPdfHeader(doc, meta, "Laporan Pengguna");

    autoTable(doc, {
        startY: 46,
        head: [["No", "Nama", "Email", "Role", "NISN/NIP", "Kelas", "Telepon"]],
        body: rows.map((row, i) => [
            i + 1,
            row.name,
            row.email,
            row.role_label,
            row.identifier,
            row.class,
            row.phone,
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 58, 95] },
    });

    addPdfFooter(doc);
    doc.save(`${formatFilename("pengguna")}.pdf`);
}

export function exportPenggunaExcel(rows) {
    const data = rows.map((row, i) => ({
        No: i + 1,
        Nama: row.name,
        Email: row.email,
        Username: row.username,
        Role: row.role_label,
        NISN: row.nisn ?? "-",
        NIP: row.nip ?? "-",
        Kelas: row.class,
        Telepon: row.phone,
        Status: row.status,
        "Terdaftar": row.created_at_formatted ?? "-",
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(data),
        "Pengguna",
    );
    downloadWorkbook(workbook, formatFilename("pengguna"));
}

export function exportRingkasanPdf(stats, highlights, meta) {
    const doc = new jsPDF();
    addPdfHeader(doc, meta, "Laporan Ringkasan Operasional Lab");
    doc.setFontSize(10);
    doc.text(`Periode: ${stats.period_label ?? "-"}`, 14, 48);

    const summaryRows = [
        ["Total Pengajuan Peminjaman", stats.total_loans],
        ["Peminjaman Alat", stats.loans_alat],
        ["Pengambilan Bahan", stats.loans_bahan],
        ["Menunggu Persetujuan", stats.pending],
        ["Sedang Dipinjam / Aktif", stats.active_borrows],
        ["Keterlambatan", stats.overdue],
        ["Dikembalikan", stats.returned],
        ["Ditolak", stats.rejected],
        ["Total Alat Terdaftar", stats.total_alat],
        ["Total Bahan Terdaftar", stats.total_bahan],
        ["Unit Alat Tersedia", stats.alat_available],
        ["Bahan Stok Menipis", stats.low_stock_bahan],
        ["Jadwal Praktikum (periode)", stats.schedules_period],
        ["Kartu Jaminan Ditahan", stats.collateral_held],
        ["Kompensasi Pending", stats.compensation_pending],
        ["Total Siswa", stats.total_siswa],
        ["Total Guru", stats.total_guru],
    ];

    autoTable(doc, {
        startY: 54,
        head: [["Indikator", "Nilai"]],
        body: summaryRows,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 58, 95] },
    });

    let nextY = doc.lastAutoTable.finalY + 10;

    if (highlights?.overdue_loans?.length) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Peminjaman Terlambat", 14, nextY);
        doc.setFont("helvetica", "normal");
        autoTable(doc, {
            startY: nextY + 4,
            head: [["Kode", "Peminjam", "Kelas", "Barang"]],
            body: highlights.overdue_loans.map((row) => [
                row.code,
                row.borrower_name,
                row.borrower_class,
                row.items_summary,
            ]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [180, 50, 50] },
        });
        nextY = doc.lastAutoTable.finalY + 10;
    }

    if (highlights?.low_stock?.length) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Bahan Stok Menipis", 14, nextY);
        doc.setFont("helvetica", "normal");
        autoTable(doc, {
            startY: nextY + 4,
            head: [["Kode", "Nama", "Tersedia", "Stok"]],
            body: highlights.low_stock.map((row) => [
                row.code,
                row.name,
                row.available,
                row.stock,
            ]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [180, 120, 30] },
        });
    }

    addPdfFooter(doc);
    doc.save(`${formatFilename("ringkasan")}.pdf`);
}

export function exportRingkasanExcel(stats, highlights) {
    const summarySheet = XLSX.utils.aoa_to_sheet([
        ["Laporan Ringkasan Operasional Lab"],
        ["Periode", stats.period_label ?? "-"],
        [],
        ["Indikator", "Nilai"],
        ["Total Pengajuan", stats.total_loans],
        ["Peminjaman Alat", stats.loans_alat],
        ["Pengambilan Bahan", stats.loans_bahan],
        ["Menunggu Persetujuan", stats.pending],
        ["Aktif / Dipinjam", stats.active_borrows],
        ["Keterlambatan", stats.overdue],
        ["Dikembalikan", stats.returned],
        ["Ditolak", stats.rejected],
        ["Total Alat", stats.total_alat],
        ["Total Bahan", stats.total_bahan],
        ["Alat Tersedia", stats.alat_available],
        ["Bahan Menipis", stats.low_stock_bahan],
        ["Jadwal Aktif", stats.schedules_period],
        ["Kartu Ditahan", stats.collateral_held],
        ["Kompensasi Pending", stats.compensation_pending],
        ["Total Siswa", stats.total_siswa],
        ["Total Guru", stats.total_guru],
    ]);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Ringkasan");

    if (highlights?.overdue_loans?.length) {
        XLSX.utils.book_append_sheet(
            workbook,
            XLSX.utils.json_to_sheet(
                highlights.overdue_loans.map((row, i) => ({
                    No: i + 1,
                    Kode: row.code,
                    Peminjam: row.borrower_name,
                    Kelas: row.borrower_class,
                    Barang: row.items_summary,
                })),
            ),
            "Terlambat",
        );
    }

    if (highlights?.low_stock?.length) {
        XLSX.utils.book_append_sheet(
            workbook,
            XLSX.utils.json_to_sheet(
                highlights.low_stock.map((row, i) => ({
                    No: i + 1,
                    Kode: row.code,
                    Nama: row.name,
                    Tersedia: row.available,
                    Stok: row.stock,
                })),
            ),
            "Stok Menipis",
        );
    }

    downloadWorkbook(workbook, formatFilename("ringkasan"));
}
