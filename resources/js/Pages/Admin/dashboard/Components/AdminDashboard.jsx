import { StatCard } from "@/Components/Dashboard/StatCard";
import { RecentLoansTable } from "@/Components/Dashboard/RecentLoansTable";
import { DashboardSection } from "@/Components/Dashboard/DashboardSection";
import { EmptyState } from "@/Components/Dashboard/EmptyState";
import {
    PopularEquipmentChart,
    StatusDistributionChart,
} from "@/Components/Dashboard/DashboardCharts";
import LowStockList from "./LowStockList";
import {
    AlertTriangle,
    CalendarDays,
    CheckCircle2,
    ClipboardCheck,
    CreditCard,
    FileText,
    ListOrdered,
    PackageMinus,
} from "lucide-react";

export default function AdminDashboard({ loans, equipment, stats }) {
    const pendingAlat = loans.filter(
        (l) => l.status === "diminta" && l.itemType === "alat",
    );
    const queueAlat = loans.filter(
        (l) => l.status === "antrian" && l.itemType === "alat",
    );
    const activeAlat = loans.filter((l) =>
        ["dipinjam", "terlambat"].includes(l.status),
    );
    const overdue = loans.filter((l) => l.status === "terlambat");
    const lowStock = equipment.filter((e) => {
        if (e.itemType !== "bahan") return false;
        const remaining = e.stockRemaining ?? e.available ?? 0;
        return e.minStock != null && remaining <= e.minStock;
    });
    const alatLoans = loans.filter((l) => l.itemType === "alat");

    const todayLabel = new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    return (
        <>
            <div className="mb-6 rounded-[10px] border border-border bg-muted/40 px-5 py-4 sm:px-6">
                <p className="text-sm font-medium text-foreground">
                    Ringkasan hari ini · {todayLabel}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                    {stats.pendingAlat || 0} menunggu verifikasi ·{" "}
                    {stats.alatDipinjam || 0} alat dipinjam ·{" "}
                    {stats.overdue || 0} keterlambatan ·{" "}
                    {stats.lowStockBahan || 0} stok menipis
                </p>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <StatCard
                    title="Permintaan Pending"
                    value={stats.pendingAlat}
                    icon={ClipboardCheck}
                    variant={stats.pendingAlat > 0 ? "warning" : "default"}
                />
                <StatCard
                    title="Antrian Konflik Stok"
                    value={stats.queueAlat}
                    icon={ListOrdered}
                    variant={stats.queueAlat > 0 ? "warning" : "default"}
                />
                <StatCard
                    title="Jadwal Aktif (7 hari)"
                    value={stats.activeSchedulesWeek}
                    icon={CalendarDays}
                    variant="primary"
                />
                <StatCard
                    title="Kartu Ditahan"
                    value={stats.heldCards}
                    icon={CreditCard}
                    variant={stats.heldCards > 0 ? "warning" : "default"}
                />
            </div>

            <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
                <StatCard
                    title="Alat Dipinjam"
                    value={stats.alatDipinjam}
                    icon={FileText}
                    variant="primary"
                />
                <StatCard
                    title="Keterlambatan"
                    value={stats.overdue}
                    icon={AlertTriangle}
                    variant={stats.overdue > 0 ? "danger" : "default"}
                />
                <StatCard
                    title="Stok Bahan Menipis"
                    value={stats.lowStockBahan}
                    icon={PackageMinus}
                    variant={stats.lowStockBahan > 0 ? "warning" : "default"}
                />
            </div>

            <div className="mb-8 grid gap-6 lg:grid-cols-2">
                <DashboardSection
                    title="Grafik peminjaman"
                    description="Distribusi status pengajuan & peminjaman"
                    className="mb-0"
                >
                    <StatusDistributionChart loans={loans} />
                </DashboardSection>
                <DashboardSection
                    title="Alat terpopuler"
                    description="Berdasarkan frekuensi peminjaman"
                    className="mb-0"
                >
                    <PopularEquipmentChart loans={alatLoans} />
                </DashboardSection>
            </div>

            <DashboardSection
                title="Verifikasi Permintaan"
                description="Permintaan peminjaman alat menunggu persetujuan."
                badge={pendingAlat.length}
                actionLabel="Buka Verifikasi"
                actionHref={route("admin.loans.index", { status: "diminta" })}
            >
                {pendingAlat.length > 0 ? (
                    <RecentLoansTable loans={pendingAlat} />
                ) : (
                    <EmptyState
                        icon={CheckCircle2}
                        description="Tidak ada permintaan menunggu"
                    />
                )}
            </DashboardSection>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <DashboardSection
                    title="Peminjaman Aktif"
                    description={`${activeAlat.length} peminjaman sedang berjalan`}
                    className="mb-0"
                >
                    {activeAlat.length > 0 ? (
                        <RecentLoansTable loans={activeAlat} />
                    ) : (
                        <EmptyState description="Tidak ada peminjaman aktif" />
                    )}
                </DashboardSection>

                <DashboardSection
                    title="Keterlambatan"
                    description="Peminjaman melewati batas waktu"
                    className="mb-0"
                >
                    {overdue.length > 0 ? (
                        <RecentLoansTable loans={overdue} />
                    ) : (
                        <EmptyState
                            icon={CheckCircle2}
                            description="Tidak ada keterlambatan"
                        />
                    )}
                </DashboardSection>
            </div>

            {lowStock.length > 0 && (
                <DashboardSection
                    title="Bahan yang hampir habis"
                    description="Perlu restock segera"
                    badge={lowStock.length}
                    className="mt-8"
                >
                    <LowStockList items={lowStock} />
                </DashboardSection>
            )}

            {queueAlat.length > 0 && (
                <DashboardSection
                    title="Antrian Konflik Stok"
                    description="Menunggu ketersediaan alat"
                    className="mt-8"
                >
                    <RecentLoansTable loans={queueAlat} />
                </DashboardSection>
            )}
        </>
    );
}
