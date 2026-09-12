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
            <div className="mb-6 rounded-xl border bg-muted/40 px-5 py-4 sm:px-6">
                <p className="text-sm font-medium text-foreground">
                    Ringkasan hari ini · {todayLabel}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                        <ClipboardCheck className="h-3.5 w-3.5 text-amber-600" />
                        {stats.pendingAlat || 0} menunggu verifikasi
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-sky-600" />
                        {stats.alatDipinjam || 0} alat dipinjam
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                        {stats.overdue || 0} keterlambatan
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <PackageMinus className="h-3.5 w-3.5 text-amber-600" />
                        {stats.lowStockBahan || 0} stok menipis
                    </span>
                </div>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <StatCard
                    title="Permintaan Pending"
                    value={stats.pendingAlat}
                    icon={ClipboardCheck}
                    variant="warning"
                />
                <StatCard
                    title="Antrian Konflik Stok"
                    value={stats.queueAlat}
                    icon={ListOrdered}
                    variant="warning"
                />
                <StatCard
                    title="Jadwal Aktif (7 hari)"
                    value={stats.activeSchedulesWeek}
                    icon={CalendarDays}
                    variant="info"
                />
                <StatCard
                    title="Kartu Ditahan"
                    value={stats.heldCards}
                    icon={CreditCard}
                    variant="warning"
                />
            </div>

            <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
                <StatCard
                    title="Alat Dipinjam"
                    value={stats.alatDipinjam}
                    icon={FileText}
                    variant="info"
                />
                <StatCard
                    title="Keterlambatan"
                    value={stats.overdue}
                    icon={AlertTriangle}
                    variant="danger"
                />
                <StatCard
                    title="Stok Bahan Menipis"
                    value={stats.lowStockBahan}
                    icon={PackageMinus}
                    variant="warning"
                />
            </div>

            <div className="mb-8 grid gap-6 lg:grid-cols-2">
                <DashboardSection
                    title="Grafik peminjaman"
                    description="Distribusi status pengajuan & peminjaman"
                    icon={ClipboardCheck}
                    iconTone="info"
                    className="mb-0"
                >
                    <StatusDistributionChart loans={loans} />
                </DashboardSection>
                <DashboardSection
                    title="Alat terpopuler"
                    description="Berdasarkan frekuensi peminjaman"
                    icon={FileText}
                    iconTone="primary"
                    className="mb-0"
                >
                    <PopularEquipmentChart loans={alatLoans} />
                </DashboardSection>
            </div>

            <DashboardSection
                title="Verifikasi Permintaan"
                description="Permintaan peminjaman alat menunggu persetujuan."
                icon={ClipboardCheck}
                iconTone="warning"
                badge={pendingAlat.length}
                badgeTone="warning"
                actionLabel="Buka Verifikasi"
                actionHref={route("admin.loans.index", { status: "diminta" })}
            >
                {pendingAlat.length > 0 ? (
                    <RecentLoansTable loans={pendingAlat} />
                ) : (
                    <EmptyState
                        icon={CheckCircle2}
                        tone="success"
                        description="Tidak ada permintaan menunggu"
                    />
                )}
            </DashboardSection>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <DashboardSection
                    title="Peminjaman Aktif"
                    description={`${activeAlat.length} peminjaman sedang berjalan`}
                    icon={FileText}
                    iconTone="info"
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
                    icon={AlertTriangle}
                    iconTone="danger"
                    badge={overdue.length || undefined}
                    badgeTone="danger"
                    className="mb-0"
                >
                    {overdue.length > 0 ? (
                        <RecentLoansTable loans={overdue} />
                    ) : (
                        <EmptyState
                            icon={CheckCircle2}
                            tone="success"
                            description="Tidak ada keterlambatan"
                        />
                    )}
                </DashboardSection>
            </div>

            {lowStock.length > 0 && (
                <DashboardSection
                    title="Bahan yang hampir habis"
                    description="Perlu restock segera"
                    icon={PackageMinus}
                    iconTone="warning"
                    badge={lowStock.length}
                    badgeTone="warning"
                    className="mt-8"
                >
                    <LowStockList items={lowStock} />
                </DashboardSection>
            )}

            {queueAlat.length > 0 && (
                <DashboardSection
                    title="Antrian Konflik Stok"
                    description="Menunggu ketersediaan alat"
                    icon={ListOrdered}
                    iconTone="warning"
                    badge={queueAlat.length}
                    badgeTone="warning"
                    className="mt-8"
                >
                    <RecentLoansTable loans={queueAlat} />
                </DashboardSection>
            )}
        </>
    );
}
