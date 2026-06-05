import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import LoanStatusBadge from "@/Components/LoanStatusBadge";
import { cn } from "@/lib/utils";
import {
    exportInventarisExcel,
    exportInventarisPdf,
    exportPeminjamanExcel,
    exportPeminjamanPdf,
    exportPenggunaExcel,
    exportPenggunaPdf,
    exportRingkasanExcel,
    exportRingkasanPdf,
} from "@/lib/reportExport";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Select } from "@/Components/ui/select";
import { Head, router, useForm } from "@inertiajs/react";
import {
    BarChart3,
    Box,
    ClipboardList,
    FileSpreadsheet,
    FileText,
    Filter,
    Users,
} from "lucide-react";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

const reportTabs = [
    { key: "ringkasan", label: "Ringkasan", icon: BarChart3 },
    { key: "inventaris", label: "Inventaris", icon: Box },
    { key: "peminjaman", label: "Peminjaman", icon: ClipboardList },
    { key: "pengguna", label: "Pengguna", icon: Users },
];

export default function Index({
    reportType,
    filters,
    rows = [],
    stats = {},
    highlights = {},
    meta = {},
    statusOptions = {},
}) {
    const { data, setData } = useForm({
        type: reportType ?? "ringkasan",
        item_type: filters.item_type ?? "all",
        status: filters.status ?? "all",
        role: filters.role ?? "all",
        date_from: filters.date_from ?? "",
        date_to: filters.date_to ?? "",
    });

    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timeout = setTimeout(() => {
            router.get(route("admin.reports.index"), data, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 400);

        return () => clearTimeout(timeout);
    }, [
        data.type,
        data.item_type,
        data.status,
        data.role,
        data.date_from,
        data.date_to,
    ]);

    const switchType = (type) => {
        setData({
            type,
            item_type: "all",
            status: "all",
            role: "all",
            date_from: data.date_from,
            date_to: data.date_to,
        });
    };

    const handleExportPdf = () => {
        try {
            if (data.type === "inventaris") {
                exportInventarisPdf(rows, meta, data);
            } else if (data.type === "peminjaman") {
                exportPeminjamanPdf(rows, meta, statusOptions);
            } else if (data.type === "pengguna") {
                exportPenggunaPdf(rows, meta);
            } else {
                exportRingkasanPdf(stats, highlights, meta);
            }
            toast.success("Laporan PDF berhasil diunduh");
        } catch {
            toast.error("Gagal membuat laporan PDF");
        }
    };

    const handleExportExcel = () => {
        try {
            if (data.type === "inventaris") {
                exportInventarisExcel(rows, data);
            } else if (data.type === "peminjaman") {
                exportPeminjamanExcel(rows, statusOptions);
            } else if (data.type === "pengguna") {
                exportPenggunaExcel(rows);
            } else {
                exportRingkasanExcel(stats, highlights);
            }
            toast.success("Laporan Excel berhasil diunduh");
        } catch {
            toast.error("Gagal membuat laporan Excel");
        }
    };

    const previewRows = rows.slice(0, 8);
    const totalRows = data.type === "ringkasan" ? 0 : rows.length;

    return (
        <AppLayout>
            <Head title="Laporan" />

            <div className="animate-fade-in">
                <PageHeader
                    title="Laporan & Export"
                    subtitle="Generate laporan operasional lab untuk kepala sekolah atau atasan"
                />

                <div className="mb-6 flex w-full flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-card p-1 shadow-sm">
                    {reportTabs.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => switchType(key)}
                            className={cn(
                                "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:flex-none",
                                data.type === key
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </button>
                    ))}
                </div>

                <div className="mb-6 rounded-2xl border border-border/60 bg-card p-5 shadow-card">
                    <div className="mb-4 flex items-center gap-2 text-sm font-medium">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        Filter Laporan
                    </div>

                    {data.type === "ringkasan" && (
                        <p className="mb-4 text-sm text-muted-foreground">
                            Ringkasan operasional lab untuk periode tertentu —
                            cocok dilaporkan ke kepala sekolah.
                        </p>
                    )}

                    {data.type === "inventaris" && (
                        <div className="max-w-xs">
                            <label className="mb-2 block text-xs font-medium text-muted-foreground">
                                Jenis Inventaris
                            </label>
                            <Select
                                value={data.item_type}
                                onChange={(e) =>
                                    setData("item_type", e.target.value)
                                }
                                className="rounded-xl border-border/60 bg-card shadow-sm"
                            >
                                <option value="all">Semua (Alat & Bahan)</option>
                                <option value="alat">Alat</option>
                                <option value="bahan">Bahan</option>
                            </Select>
                        </div>
                    )}

                    {(data.type === "peminjaman" ||
                        data.type === "ringkasan") && (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <Input
                                type="date"
                                value={data.date_from}
                                onChange={(e) =>
                                    setData("date_from", e.target.value)
                                }
                                className="rounded-xl border-border/60 bg-card shadow-sm"
                                title="Dari tanggal"
                            />
                            <Input
                                type="date"
                                value={data.date_to}
                                onChange={(e) =>
                                    setData("date_to", e.target.value)
                                }
                                className="rounded-xl border-border/60 bg-card shadow-sm"
                                title="Sampai tanggal"
                            />
                            {data.type === "peminjaman" && (
                                <>
                                    <Select
                                        value={data.item_type}
                                        onChange={(e) =>
                                            setData("item_type", e.target.value)
                                        }
                                        className="rounded-xl border-border/60 bg-card shadow-sm"
                                    >
                                        <option value="all">Semua jenis</option>
                                        <option value="alat">Alat</option>
                                        <option value="bahan">Bahan</option>
                                    </Select>
                                    <Select
                                        value={data.status}
                                        onChange={(e) =>
                                            setData("status", e.target.value)
                                        }
                                        className="rounded-xl border-border/60 bg-card shadow-sm"
                                    >
                                        <option value="all">Semua status</option>
                                        {Object.entries(statusOptions).map(
                                            ([value, label]) => (
                                                <option
                                                    key={value}
                                                    value={value}
                                                >
                                                    {label}
                                                </option>
                                            ),
                                        )}
                                    </Select>
                                </>
                            )}
                        </div>
                    )}

                    {data.type === "pengguna" && (
                        <div className="max-w-xs">
                            <label className="mb-2 block text-xs font-medium text-muted-foreground">
                                Role
                            </label>
                            <Select
                                value={data.role}
                                onChange={(e) =>
                                    setData("role", e.target.value)
                                }
                                className="rounded-xl border-border/60 bg-card shadow-sm"
                            >
                                <option value="all">Semua (Siswa & Guru)</option>
                                <option value="siswa">Siswa</option>
                                <option value="guru">Guru</option>
                            </Select>
                        </div>
                    )}
                </div>

                <ReportStats type={data.type} stats={stats} />

                <div className="mb-6 rounded-2xl border border-border/60 bg-card p-6 shadow-card">
                    <h3 className="mb-2 font-semibold">Export Laporan</h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                        Unduh laporan lengkap dalam format PDF atau Excel untuk
                        diserahkan ke atasan.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <Button
                            onClick={handleExportPdf}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            Export PDF
                        </Button>
                        <Button
                            onClick={handleExportExcel}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            Export Excel
                        </Button>
                    </div>
                </div>

                <ReportPreview
                    type={data.type}
                    rows={previewRows}
                    totalRows={totalRows}
                    stats={stats}
                    highlights={highlights}
                    statusOptions={statusOptions}
                />
            </div>
        </AppLayout>
    );
}

function StatBox({ label, value, accent }) {
    return (
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p
                className={cn(
                    "mt-1 text-2xl font-bold tabular-nums",
                    accent ?? "text-foreground",
                )}
            >
                {value ?? 0}
            </p>
        </div>
    );
}

function ReportStats({ type, stats }) {
    if (type === "ringkasan") {
        return (
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatBox label="Total Pengajuan" value={stats.total_loans} />
                <StatBox
                    label="Aktif / Dipinjam"
                    value={stats.active_borrows}
                    accent="text-primary"
                />
                <StatBox
                    label="Keterlambatan"
                    value={stats.overdue}
                    accent="text-destructive"
                />
                <StatBox
                    label="Bahan Menipis"
                    value={stats.low_stock_bahan}
                    accent="text-warning"
                />
                <StatBox label="Dikembalikan" value={stats.returned} />
                <StatBox label="Kartu Ditahan" value={stats.collateral_held} />
                <StatBox label="Total Siswa" value={stats.total_siswa} />
                <StatBox label="Total Guru" value={stats.total_guru} />
            </div>
        );
    }

    if (type === "inventaris") {
        return (
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatBox label="Total Item" value={stats.total} />
                <StatBox label="Unit Tersedia" value={stats.tersedia} accent="text-success" />
                <StatBox label="Kondisi Baik" value={stats.baik} />
                <StatBox label="Stok Menipis" value={stats.low_stock} accent="text-warning" />
            </div>
        );
    }

    if (type === "peminjaman") {
        return (
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatBox label="Total" value={stats.total} />
                <StatBox label="Aktif" value={stats.aktif} accent="text-primary" />
                <StatBox label="Terlambat" value={stats.terlambat} accent="text-destructive" />
                <StatBox label="Selesai" value={stats.selesai} accent="text-success" />
            </div>
        );
    }

    return (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatBox label="Total Pengguna" value={stats.total} />
            <StatBox label="Siswa" value={stats.siswa} accent="text-primary" />
            <StatBox label="Guru" value={stats.guru} accent="text-success" />
            <StatBox label="Aktif" value={stats.aktif} />
        </div>
    );
}

function ReportPreview({ type, rows, totalRows, stats, highlights, statusOptions }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
            <div className="border-b border-border/60 bg-muted/30 px-5 py-4">
                <h3 className="flex items-center gap-2 font-semibold">
                    <FileText className="h-4 w-4" />
                    Preview Data
                </h3>
                {type === "ringkasan" && (
                    <p className="mt-1 text-sm text-muted-foreground">
                        Periode: {stats.period_label}
                    </p>
                )}
            </div>

            <div className="overflow-x-auto">
                {type === "inventaris" && (
                    <PreviewTable
                        headers={[
                            "No",
                            "Kode",
                            "Nama",
                            "Jenis",
                            "Stok",
                            "Tersedia",
                            "Kondisi",
                            "Lokasi",
                        ]}
                        rows={rows.map((row, i) => [
                            i + 1,
                            row.code,
                            row.name,
                            row.item_type_label,
                            row.stock,
                            row.available,
                            row.condition_label,
                            row.location,
                        ])}
                    />
                )}

                {type === "peminjaman" && (
                    <PreviewTable
                        headers={[
                            "No",
                            "Kode",
                            "Peminjam",
                            "Barang",
                            "Jenis",
                            "Status",
                        ]}
                        rows={rows.map((row, i) => [
                            i + 1,
                            row.code,
                            <>
                                {row.borrower_name}
                                <span className="block text-xs text-muted-foreground">
                                    {row.borrower_class}
                                </span>
                            </>,
                            row.items_summary,
                            row.item_type_label,
                            <LoanStatusBadge key={row.id} status={row.status} />,
                        ])}
                    />
                )}

                {type === "pengguna" && (
                    <PreviewTable
                        headers={[
                            "No",
                            "Nama",
                            "Email",
                            "Role",
                            "NISN/NIP",
                            "Kelas",
                        ]}
                        rows={rows.map((row, i) => [
                            i + 1,
                            row.name,
                            row.email,
                            row.role_label,
                            row.identifier,
                            row.class,
                        ])}
                    />
                )}

                {type === "ringkasan" && (
                    <div className="space-y-6 p-5">
                        <div className="grid gap-3 sm:grid-cols-2">
                            {[
                                ["Pengajuan", stats.total_loans],
                                ["Aktif", stats.active_borrows],
                                ["Terlambat", stats.overdue],
                                ["Dikembalikan", stats.returned],
                                ["Alat terdaftar", stats.total_alat],
                                ["Bahan menipis", stats.low_stock_bahan],
                            ].map(([label, value]) => (
                                <div
                                    key={label}
                                    className="flex items-center justify-between rounded-lg bg-secondary/40 px-4 py-3 text-sm"
                                >
                                    <span className="text-muted-foreground">
                                        {label}
                                    </span>
                                    <span className="font-semibold tabular-nums">
                                        {value ?? 0}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {highlights?.overdue_loans?.length > 0 && (
                            <div>
                                <p className="mb-2 text-sm font-medium text-destructive">
                                    Peminjaman Terlambat
                                </p>
                                <PreviewTable
                                    headers={["Kode", "Peminjam", "Barang"]}
                                    rows={highlights.overdue_loans
                                        .slice(0, 5)
                                        .map((row) => [
                                            row.code,
                                            row.borrower_name,
                                            row.items_summary,
                                        ])}
                                />
                            </div>
                        )}

                        {highlights?.low_stock?.length > 0 && (
                            <div>
                                <p className="mb-2 text-sm font-medium text-warning">
                                    Bahan Stok Menipis
                                </p>
                                <PreviewTable
                                    headers={["Kode", "Nama", "Tersedia"]}
                                    rows={highlights.low_stock
                                        .slice(0, 5)
                                        .map((row) => [
                                            row.code,
                                            row.name,
                                            `${row.available} / ${row.stock}`,
                                        ])}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {totalRows > 8 && (
                <div className="border-t border-border/60 px-5 py-3 text-center text-sm text-muted-foreground">
                    Menampilkan 8 dari {totalRows} data. Export untuk melihat
                    semua.
                </div>
            )}
        </div>
    );
}

function PreviewTable({ headers, rows }) {
    if (!rows?.length) {
        return (
            <p className="py-10 text-center text-sm text-muted-foreground">
                Tidak ada data untuk ditampilkan
            </p>
        );
    }

    return (
        <table className="w-full min-w-[640px]">
            <thead className="bg-secondary/50">
                <tr>
                    {headers.map((header) => (
                        <th
                            key={header}
                            className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                        >
                            {header}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-border">
                {rows.map((cells, rowIndex) => (
                    <tr
                        key={rowIndex}
                        className="transition-colors hover:bg-secondary/30"
                    >
                        {cells.map((cell, cellIndex) => (
                            <td
                                key={cellIndex}
                                className="px-4 py-3 text-sm text-foreground"
                            >
                                {cell}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
