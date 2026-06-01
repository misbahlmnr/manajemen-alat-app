import { StatCard } from "@/Components/Dashboard/StatCard";
import { RecentLoansTable } from "@/Components/Dashboard/RecentLoansTable";
import { DashboardSection } from "@/Components/Dashboard/DashboardSection";
import { EmptyState } from "@/Components/Dashboard/EmptyState";
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

    return (
        <>
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
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

            <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
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

            <DashboardSection
                title="Verifikasi Permintaan"
                description="Permintaan peminjaman alat menunggu persetujuan."
                badge={pendingAlat.length}
                actionLabel="Buka Verifikasi"
                actionHref="#"
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
                    title="Status Bahan — Stok Menipis"
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
