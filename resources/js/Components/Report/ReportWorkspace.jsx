import PageHeader from "@/Components/PageHeader";
import LoanStatusBadge from "@/Components/LoanStatusBadge";
import ReportCharts from "@/Components/Report/ReportCharts";
import ReportEmptyState from "@/Components/Report/ReportEmptyState";
import ReportExportCard from "@/Components/Report/ReportExportCard";
import ReportInsights from "@/Components/Report/ReportInsights";
import ReportKpiGrid from "@/Components/Report/ReportKpiGrid";
import ReportRecentActivity from "@/Components/Report/ReportRecentActivity";
import ReportRoundRobinStats from "@/Components/Report/ReportRoundRobinStats";
import { Input } from "@/Components/ui/input";
import { Select } from "@/Components/ui/select";
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
import { router, useForm } from "@inertiajs/react";
import {
    BarChart3,
    Box,
    ClipboardList,
    FileText,
    Filter,
    Users,
} from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import toast from "react-hot-toast";

const allReportTabs = [
    { key: "ringkasan", label: "Ringkasan", icon: BarChart3 },
    { key: "inventaris", label: "Inventaris", icon: Box },
    { key: "peminjaman", label: "Peminjaman", icon: ClipboardList },
    { key: "pengguna", label: "Pengguna", icon: Users },
];

export default function ReportWorkspace({
    indexRoute,
    pageSubtitle,
    showUsersTab = true,
    reportType,
    filters,
    rows = [],
    stats = {},
    highlights = {},
    charts = {},
    insights = {},
    round_robin: roundRobin = {},
    recent_activity: recentActivity = [],
    meta = {},
    statusOptions = {},
}) {
    const isGuruScope = meta?.report_scope === "guru";
    const reportTabs = useMemo(
        () =>
            showUsersTab
                ? allReportTabs
                : allReportTabs.filter((tab) => tab.key !== "pengguna"),
        [showUsersTab],
    );

    const { data, setData } = useForm({
        type: reportType ?? "ringkasan",
        item_type: filters?.item_type ?? "all",
        status: filters?.status ?? "all",
        role: filters?.role ?? "all",
        date_from: filters?.date_from ?? "",
        date_to: filters?.date_to ?? "",
    });

    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timeout = setTimeout(() => {
            router.get(route(indexRoute), data, {
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
        indexRoute,
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
                exportRingkasanExcel(stats, highlights, meta);
            }
            toast.success("Laporan Excel berhasil diunduh");
        } catch {
            toast.error("Gagal membuat laporan Excel");
        }
    };

    const previewRows = rows.slice(0, 8);
    const totalRows = data.type === "ringkasan" ? 0 : rows.length;
    const isRingkasan = data.type === "ringkasan";
    const hasOperationalData =
        Number(stats.total_loans ?? 0) > 0 ||
        Number(stats.active_borrows ?? 0) > 0 ||
        Number(stats.queued ?? 0) > 0 ||
        Number(stats.awaiting_approval ?? 0) > 0;

    return (
        <div className="animate-fade-in space-y-6">
            <PageHeader title="Laporan & Export" subtitle={pageSubtitle} />

            <div className="flex w-full flex-wrap items-center gap-2 rounded-[8px] border border-border/60 bg-card p-1 shadow-sm">
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

            <div className="rounded-[10px] border border-border/60 bg-card p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2 text-sm font-medium">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    Filter Laporan
                </div>

                {isRingkasan && (
                    <p className="mb-4 text-sm text-muted-foreground">
                        {isGuruScope
                            ? "Ringkasan peminjaman siswa bimbingan dan kondisi inventaris lab untuk periode tertentu."
                            : "Ringkasan operasional lab untuk periode tertentu — cocok dilaporkan ke kepala sekolah."}
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
                            className="rounded-[8px] border-border/60 bg-card shadow-sm"
                        >
                            <option value="all">Semua (Alat & Bahan)</option>
                            <option value="alat">Alat</option>
                            <option value="bahan">Bahan</option>
                        </Select>
                    </div>
                )}

                {(data.type === "peminjaman" || isRingkasan) && (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <Input
                            type="date"
                            value={data.date_from}
                            onChange={(e) =>
                                setData("date_from", e.target.value)
                            }
                            className="rounded-[8px] border-border/60 bg-card shadow-sm"
                            title="Dari tanggal"
                        />
                        <Input
                            type="date"
                            value={data.date_to}
                            onChange={(e) => setData("date_to", e.target.value)}
                            className="rounded-[8px] border-border/60 bg-card shadow-sm"
                            title="Sampai tanggal"
                        />
                        {data.type === "peminjaman" && (
                            <>
                                <Select
                                    value={data.item_type}
                                    onChange={(e) =>
                                        setData("item_type", e.target.value)
                                    }
                                    className="rounded-[8px] border-border/60 bg-card shadow-sm"
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
                                    className="rounded-[8px] border-border/60 bg-card shadow-sm"
                                >
                                    <option value="all">Semua status</option>
                                    {Object.entries(statusOptions).map(
                                        ([value, label]) => (
                                            <option key={value} value={value}>
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
                            onChange={(e) => setData("role", e.target.value)}
                            className="rounded-[8px] border-border/60 bg-card shadow-sm"
                        >
                            <option value="all">Semua (Siswa & Guru)</option>
                            <option value="siswa">Siswa</option>
                            <option value="guru">Guru</option>
                        </Select>
                    </div>
                )}
            </div>

            {isRingkasan ? (
                hasOperationalData ? (
                    <>
                        <ReportKpiGrid
                            stats={stats}
                            isGuruScope={isGuruScope}
                        />
                        <ReportCharts charts={charts} />
                        <ReportInsights insights={insights} />
                        {!isGuruScope && (
                            <ReportRoundRobinStats roundRobin={roundRobin} />
                        )}
                        <ReportRecentActivity items={recentActivity} />
                    </>
                ) : (
                    <ReportEmptyState />
                )
            ) : (
                <>
                    <TabStats type={data.type} stats={stats} />
                    <DataPreview
                        type={data.type}
                        rows={previewRows}
                        totalRows={totalRows}
                    />
                </>
            )}

            <ReportExportCard
                onExportPdf={handleExportPdf}
                onExportExcel={handleExportExcel}
            />
        </div>
    );
}

function StatBox({ label, value, accent }) {
    return (
        <div className="rounded-[8px] border border-border/60 bg-card p-4 shadow-sm">
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

function TabStats({ type, stats }) {
    if (type === "inventaris") {
        return (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatBox label="Total Item" value={stats.total} />
                <StatBox
                    label="Unit Tersedia"
                    value={stats.tersedia}
                    accent="text-success"
                />
                <StatBox label="Kondisi Baik" value={stats.baik} />
                <StatBox
                    label="Stok Menipis"
                    value={stats.low_stock}
                    accent="text-warning"
                />
            </div>
        );
    }

    if (type === "peminjaman") {
        return (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatBox label="Total" value={stats.total} />
                <StatBox
                    label="Aktif"
                    value={stats.aktif}
                    accent="text-primary"
                />
                <StatBox
                    label="Terlambat"
                    value={stats.terlambat}
                    accent="text-destructive"
                />
                <StatBox
                    label="Selesai"
                    value={stats.selesai}
                    accent="text-success"
                />
            </div>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatBox label="Total Pengguna" value={stats.total} />
            <StatBox label="Siswa" value={stats.siswa} accent="text-primary" />
            <StatBox label="Guru" value={stats.guru} accent="text-success" />
            <StatBox label="Aktif" value={stats.aktif} />
        </div>
    );
}

function DataPreview({ type, rows, totalRows }) {
    return (
        <div className="overflow-hidden rounded-[10px] border border-border/60 bg-card shadow-sm">
            <div className="border-b border-border/60 bg-muted/30 px-5 py-4">
                <h3 className="flex items-center gap-2 font-semibold">
                    <FileText className="h-4 w-4" />
                    Preview Data
                </h3>
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
                            <LoanStatusBadge
                                key={row.id}
                                status={row.status}
                                itemType={row.item_type}
                            />,
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
            <thead className="border-b border-border bg-slate-50">
                <tr>
                    {headers.map((header) => (
                        <th
                            key={header}
                            className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
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
                        className="transition-colors hover:bg-muted/40"
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
