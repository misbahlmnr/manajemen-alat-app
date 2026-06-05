import { StatCard } from "@/Components/Dashboard/StatCard";
import { RecentLoansTable } from "@/Components/Dashboard/RecentLoansTable";
import { MonitoringEquipmentTable } from "@/Components/Dashboard/MonitoringEquipmentTable";
import { DashboardSection } from "@/Components/Dashboard/DashboardSection";
import { UpcomingSchedules } from "@/Components/Dashboard/UpcomingSchedules";
import AlertBanner from "./AlertBanner";
import { AlertTriangle, CalendarDays, Package, Users } from "lucide-react";

export default function GuruDashboard({
    loans,
    equipment,
    stats,
    upcomingSchedules,
    notifications,
}) {
    const activeAlat = loans.filter((l) =>
        ["dipinjam", "terlambat"].includes(l.status),
    );
    const overdue = loans.filter((l) => l.status === "terlambat");
    const borrowedEquipment = equipment.filter((e) => e.available < e.stock);
    const alertNotifications = (notifications ?? []).filter(
        (n) => !n.read && ["error", "warning"].includes(n.type),
    );

    return (
        <>
            <AlertBanner notifications={alertNotifications} />

            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard
                    title="Siswa Pinjam Aktif"
                    value={activeAlat.length}
                    icon={Users}
                    variant="primary"
                />
                <StatCard
                    title="Keterlambatan"
                    value={stats.overdue}
                    icon={AlertTriangle}
                    variant={stats.overdue > 0 ? "danger" : "default"}
                />
                <StatCard
                    title="Bahan Diambil (7 hari)"
                    value={stats.bahanThisWeek}
                    icon={Package}
                />
            </div>

            <DashboardSection
                title="Peminjaman Siswa Terbaru"
                description="Pantau aktivitas peminjaman siswa Anda."
                actionLabel="Lihat Semua"
                actionHref={route("guru.loans.index")}
                actionVariant="outline"
            >
                <RecentLoansTable loans={loans} />
            </DashboardSection>

            <UpcomingSchedules schedules={upcomingSchedules} />

            <DashboardSection
                title="Monitoring Alat Praktikum"
                description="Alat dengan stok sedang dipinjam"
                badge={borrowedEquipment.length || undefined}
                actionLabel="Lihat Inventaris"
                actionHref={route("guru.inventaris.index", { type: "alat" })}
                actionVariant="outline"
                className="mt-8"
            >
                <MonitoringEquipmentTable
                    equipment={borrowedEquipment}
                    showDetailLink
                />
            </DashboardSection>

            {overdue.length > 0 && (
                <DashboardSection
                    title="Peminjaman Terlambat"
                    description="Perlu tindak lanjut segera"
                    badge={overdue.length}
                    className="mt-8"
                >
                    <RecentLoansTable loans={overdue} />
                </DashboardSection>
            )}

            {upcomingSchedules?.length > 0 && (
                <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    <span>
                        {upcomingSchedules.length} jadwal praktikum dalam
                        minggu ini
                    </span>
                </div>
            )}
        </>
    );
}
