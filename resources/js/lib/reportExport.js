import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

function formatFilename(type) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return `laporan_${type}_${date}`;
}

function addPdfHeader(doc, meta, title) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const isGuruScope = meta?.report_scope === "guru";

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

    let printedY = 40;
    if (isGuruScope && meta.guru_name) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Guru: ${meta.guru_name}`, pageWidth / 2, 38, {
            align: "center",
        });
        printedY = 44;
    }

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Dicetak: ${meta.generated_at ?? "-"}`, 14, printedY);

    return printedY;
}

function buildRingkasanRows(stats, meta) {
    const isGuruScope = meta?.report_scope === "guru";
    const rows = [
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
        ["Kompensasi Pending", stats.compensation_pending],
    ];

    if (isGuruScope) {
        rows.push(["Siswa Bimbingan", stats.siswa_bimbingan]);
        rows.push(["Bahan Sedang Diambil", stats.bahan_diambil]);
    } else {
        rows.push(["Kartu Jaminan Ditahan", stats.collateral_held]);
        rows.push(["Total Siswa", stats.total_siswa]);
        rows.push(["Total Guru", stats.total_guru]);
    }

    return rows;
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

function addGuruPdfFooter(doc) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text(
            "Dokumen ini dibuat secara otomatis oleh Sistem Informasi Laboratorium Audio Video SMKN 7 Kota Bekasi.",
            pageWidth / 2,
            pageHeight - 16,
            { align: "center" },
        );
        doc.text(
            "Dokumen ini digunakan sebagai laporan operasional laboratorium.",
            pageWidth / 2,
            pageHeight - 12,
            { align: "center" },
        );
        doc.setFontSize(8);
        doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth / 2, pageHeight - 6, {
            align: "center",
        });
    }
}

function addSectionTitle(doc, title, y) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, y);
    doc.setFont("helvetica", "normal");
    return y + 4;
}

function exportGuruRingkasanPdf(stats, meta, extras = {}) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const insights = extras.insights ?? {};
    const charts = extras.charts ?? {};
    const recentActivity = (extras.recentActivity ?? []).slice(0, 5);
    const topAlat = insights.top_alat ?? [];
    const topBahan = insights.top_bahan ?? [];
    const statusDistribution = charts.status_distribution ?? [];

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
    doc.text("Laporan Ringkasan Peminjaman", pageWidth / 2, 32, {
        align: "center",
    });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    let y = 40;
    if (meta.guru_name) {
        doc.text(`Guru: ${meta.guru_name}`, pageWidth / 2, y, {
            align: "center",
        });
        y += 6;
    }
    doc.setFontSize(9);
    doc.text(`Periode: ${stats.period_label ?? "-"}`, 14, y);
    doc.text(`Tanggal Cetak: ${meta.generated_at ?? "-"}`, pageWidth - 14, y, {
        align: "right",
    });
    y += 8;

    y = addSectionTitle(doc, "Ringkasan", y);
    autoTable(doc, {
        startY: y,
        head: [["Indikator", "Nilai"]],
        body: [
            ["Total Pengajuan", stats.total_loans ?? 0],
            ["Sedang Dipinjam", stats.active_borrows ?? 0],
            ["Menunggu Persetujuan", stats.awaiting_approval ?? 0],
            ["Keterlambatan", stats.overdue ?? 0],
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 58, 95] },
        margin: { bottom: 24 },
    });
    y = doc.lastAutoTable.finalY + 10;

    y = addSectionTitle(doc, "Kondisi Inventaris", y);
    autoTable(doc, {
        startY: y,
        head: [["Indikator", "Nilai"]],
        body: [
            ["Total Alat", stats.total_alat ?? 0],
            ["Unit Tersedia", stats.alat_available ?? 0],
            ["Unit Sedang Dipinjam", stats.active_borrows ?? 0],
            ["Bahan Menipis", stats.low_stock_bahan ?? 0],
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 58, 95] },
        margin: { bottom: 24 },
    });
    y = doc.lastAutoTable.finalY + 10;

    y = addSectionTitle(doc, "Top Alat", y);
    autoTable(doc, {
        startY: y,
        head: [["No", "Nama", "Jumlah Dipinjam"]],
        body:
            topAlat.length > 0
                ? topAlat.map((row, i) => [i + 1, row.name, row.count])
                : [["—", "Belum ada data pada periode ini.", "—"]],
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 58, 95] },
        margin: { bottom: 24 },
    });
    y = doc.lastAutoTable.finalY + 10;

    y = addSectionTitle(doc, "Top Bahan", y);
    autoTable(doc, {
        startY: y,
        head: [["No", "Nama", "Jumlah Digunakan"]],
        body:
            topBahan.length > 0
                ? topBahan.map((row, i) => [i + 1, row.name, row.count])
                : [["—", "Belum ada data pada periode ini.", "—"]],
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 58, 95] },
        margin: { bottom: 24 },
    });
    y = doc.lastAutoTable.finalY + 10;

    y = addSectionTitle(doc, "Distribusi Status", y);
    autoTable(doc, {
        startY: y,
        head: [["Status", "Jumlah"]],
        body:
            statusDistribution.length > 0
                ? statusDistribution.map((row) => [row.label, row.value])
                : [["—", "—"]],
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 58, 95] },
        margin: { bottom: 24 },
    });
    y = doc.lastAutoTable.finalY + 10;

    y = addSectionTitle(doc, "Aktivitas Terbaru", y);
    autoTable(doc, {
        startY: y,
        head: [["Submission", "Nama Siswa", "Status", "Tanggal"]],
        body:
            recentActivity.length > 0
                ? recentActivity.map((row) => [
                      row.submission_code,
                      row.borrower_name,
                      row.status_label ?? row.status,
                      row.date_formatted,
                  ])
                : [["—", "Belum ada aktivitas pada periode ini.", "—", "—"]],
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 58, 95] },
        margin: { bottom: 24 },
    });

    addGuruPdfFooter(doc);
    doc.save(`${formatFilename("ringkasan")}.pdf`);
}

function addAdminPdfFooter(doc) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text(
            "Laporan ini dibuat secara otomatis oleh Sistem Informasi Laboratorium Audio Video SMKN 7 Kota Bekasi.",
            pageWidth / 2,
            pageHeight - 12,
            { align: "center" },
        );
        doc.setFontSize(8);
        doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth / 2, pageHeight - 6, {
            align: "center",
        });
    }
}

function exportAdminRingkasanPdf(stats, meta, extras = {}) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const insights = extras.insights ?? {};
    const charts = extras.charts ?? {};
    const recentActivity = extras.recentActivity ?? [];
    const topAlat = insights.top_alat ?? [];
    const topBahan = insights.top_bahan ?? [];
    const statusDistribution = charts.status_distribution ?? [];

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
    doc.text("Laporan Ringkasan Operasional Laboratorium", pageWidth / 2, 32, {
        align: "center",
    });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    let y = 40;
    doc.text(`Periode: ${stats.period_label ?? "-"}`, 14, y);
    doc.text(`Tanggal Cetak: ${meta.generated_at ?? "-"}`, pageWidth - 14, y, {
        align: "right",
    });
    y += 8;

    y = addSectionTitle(doc, "Ringkasan Operasional", y);
    autoTable(doc, {
        startY: y,
        head: [["Indikator", "Nilai"]],
        body: [
            ["Total Pengajuan", stats.total_loans ?? 0],
            ["Sedang Dipinjam", stats.active_borrows ?? 0],
            ["Menunggu Persetujuan", stats.awaiting_approval ?? 0],
            ["Keterlambatan", stats.overdue ?? 0],
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 58, 95] },
        margin: { bottom: 24 },
    });
    y = doc.lastAutoTable.finalY + 10;

    const inventarisRows = [
        ["Kartu Ditahan", stats.collateral_held ?? 0],
        ["Bahan Menipis", stats.low_stock_bahan ?? 0],
        ["Total Alat", stats.total_alat ?? 0],
        ["Unit Tersedia", stats.alat_available ?? 0],
    ];

    y = addSectionTitle(doc, "Kondisi Inventaris", y);
    autoTable(doc, {
        startY: y,
        head: [["Indikator", "Nilai"]],
        body: inventarisRows,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 58, 95] },
        margin: { bottom: 24 },
    });
    y = doc.lastAutoTable.finalY + 10;

    y = addSectionTitle(doc, "Insight Operasional — Top Alat", y);
    autoTable(doc, {
        startY: y,
        head: [["No", "Nama", "Jumlah"]],
        body:
            topAlat.length > 0
                ? topAlat.map((row, i) => [i + 1, row.name, row.count])
                : [["—", "Belum ada data pada periode ini.", "—"]],
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 58, 95] },
        margin: { bottom: 24 },
    });
    y = doc.lastAutoTable.finalY + 10;

    y = addSectionTitle(doc, "Insight Operasional — Top Bahan", y);
    autoTable(doc, {
        startY: y,
        head: [["No", "Nama", "Jumlah"]],
        body:
            topBahan.length > 0
                ? topBahan.map((row, i) => [i + 1, row.name, row.count])
                : [["—", "Belum ada data pada periode ini.", "—"]],
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 58, 95] },
        margin: { bottom: 24 },
    });
    y = doc.lastAutoTable.finalY + 10;

    y = addSectionTitle(doc, "Distribusi Status", y);
    autoTable(doc, {
        startY: y,
        head: [["Status", "Jumlah"]],
        body:
            statusDistribution.length > 0
                ? statusDistribution.map((row) => [row.label, row.value])
                : [["—", "Belum ada data pada periode ini."]],
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 58, 95] },
        margin: { bottom: 24 },
    });
    y = doc.lastAutoTable.finalY + 10;

    y = addSectionTitle(doc, "Aktivitas Terbaru", y);
    autoTable(doc, {
        startY: y,
        head: [["Submission", "Nama Siswa", "Jenis", "Status", "Tanggal"]],
        body:
            recentActivity.length > 0
                ? recentActivity.map((row) => [
                      row.submission_code,
                      row.borrower_name,
                      row.item_type_label ?? "—",
                      row.status_label ?? row.status,
                      row.date_formatted,
                  ])
                : [
                      [
                          "—",
                          "Belum ada aktivitas pada periode ini.",
                          "—",
                          "—",
                          "—",
                      ],
                  ],
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 58, 95] },
        margin: { bottom: 24 },
    });

    addAdminPdfFooter(doc);
    doc.save(`${formatFilename("ringkasan")}.pdf`);
}

export function exportRingkasanPdf(stats, highlights, meta, extras = {}) {
    if (meta?.report_scope === "guru") {
        exportGuruRingkasanPdf(stats, meta, extras);
        return;
    }

    exportAdminRingkasanPdf(stats, meta, extras);
}

export function exportRingkasanExcel(stats, highlights, meta = {}) {
    const isGuruScope = meta?.report_scope === "guru";
    const title = isGuruScope
        ? "Laporan Ringkasan Bimbingan Peminjaman"
        : "Laporan Ringkasan Operasional Lab";
    const summaryRows = buildRingkasanRows(stats, meta);

    const summarySheet = XLSX.utils.aoa_to_sheet([
        [title],
        ...(isGuruScope && meta.guru_name
            ? [["Guru", meta.guru_name]]
            : []),
        ["Periode", stats.period_label ?? "-"],
        [],
        ["Indikator", "Nilai"],
        ...summaryRows,
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
