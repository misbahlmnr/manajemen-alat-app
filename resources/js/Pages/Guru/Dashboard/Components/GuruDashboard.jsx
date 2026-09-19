import { StatCard } from "@/Components/Dashboard/StatCard";
import { RecentLoansTable } from "@/Components/Dashboard/RecentLoansTable";
import { MonitoringEquipmentTable } from "@/Components/Dashboard/MonitoringEquipmentTable";
import { DashboardSection } from "@/Components/Dashboard/DashboardSection";
import { UpcomingSchedules } from "@/Components/Dashboard/UpcomingSchedules";
import AlertBanner from "./AlertBanner";
import { usePage } from "@inertiajs/react";
import {
    AlertTriangle,
    CalendarDays,
    Package,
    Users,
    Wrench,
} from "lucide-react";

function praktikumDescription(praktikumToday) {
    if (!praktikumToday) {
        return "Tidak ada jadwal hari ini";
    }

    const parts = [];
    if ((praktikumToday.classes ?? []).length > 0) {
        parts.push(praktikumToday.classes.join(", "));
    }
    if ((praktikumToday.student_count ?? 0) > 0) {
        parts.push(`${praktikumToday.student_count} siswa`);
    }
    if ((praktikumToday.submission_count ?? 0) > 0) {
        parts.push(`${praktikumToday.submission_count} submission`);
    }

    return parts.length > 0 ? parts.join(" · ") : "Tidak ada jadwal hari ini";
}

function InventoryStrip({ summary }) {
    if (!summary) {
        return null;
    }

    const items = [
        { label: "Total Alat", value: summary.total_alat ?? 0 },
        { label: "Sedang Dipinjam", value: summary.sedang_dipinjam ?? 0 },
        { label: "Rusak Ringan", value: summary.rusak_ringan ?? 0 },
        { label: "Rusak Berat", value: summary.rusak_berat ?? 0 },
        { label: "Bahan Menipis", value: summary.bahan_menipis ?? 0 },
    ];

    return (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {items.map((item) => (
                <div
                    key={item.label}
                    className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5"
                >
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {item.label}
                    </p>
                    <p className="mt-1 font-display text-xl font-semibold tabular-nums text-foreground">
                        {item.value}
                    </p>
                </div>
            ))}
        </div>
    );
}

export default function GuruDashboard({
    loans,
    equipment,
    stats,
    praktikumToday = null,
    inventorySummary = null,
    todaySchedules,
    upcomingSchedules,
    weekScheduleCount = 0,
}) {
    const { notifications = [], notificationsIndexUrl = null } =
        usePage().props;
    const schedules = todaySchedules ?? upcomingSchedules ?? [];
    const activeAlat = loans.filter((l) =>
        ["dipinjam", "terlambat"].includes(l.status),
    );
    const overdue = loans.filter((l) => l.status === "terlambat");
    const alertNotifications = (notifications ?? []).filter(
        (n) => !n.read && ["error", "warning"].includes(n.type),
    );

    return (
        <>
            <AlertBanner
                notifications={alertNotifications}
                indexUrl={notificationsIndexUrl}
            />

            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard
                    title="Siswa Pinjam Aktif"
                    value={stats.activeBorrows ?? activeAlat.length}
                    icon={Users}
                    variant="info"
                />
                <StatCard
                    title="Keterlambatan"
                    value={stats.overdue ?? overdue.length}
                    icon={AlertTriangle}
                    variant="danger"
                />
                <StatCard
                    title="Praktikum Hari Ini"
                    value={praktikumToday?.schedule_count ?? 0}
                    description={praktikumDescription(praktikumToday)}
                    icon={CalendarDays}
                    variant="success"
                />
            </div>

            <DashboardSection
                title="Aktivitas Peminjaman Siswa"
                description="Pantau peminjaman siswa yang Anda bimbing."
                icon={Users}
                iconTone="info"
                actionLabel="Lihat Semua"
                actionHref={route("guru.loans.index")}
                actionVariant="outline"
            >
                <RecentLoansTable loans={loans} />
            </DashboardSection>

            <UpcomingSchedules schedules={schedules} />

            <DashboardSection
                title="Monitoring Inventaris"
                description="Ringkasan kondisi aset laboratorium"
                icon={Package}
                iconTone="info"
                actionLabel="Lihat Inventaris"
                actionHref={route("guru.inventaris.index", { type: "alat" })}
                actionVariant="outline"
                className="mt-8"
            >
                <InventoryStrip summary={inventorySummary} />
                <MonitoringEquipmentTable
                    equipment={equipment}
                    showDetailLink
                />
            </DashboardSection>

            {overdue.length > 0 && (
                <DashboardSection
                    title="Peminjaman Terlambat"
                    description="Perlu tindak lanjut segera"
                    icon={AlertTriangle}
                    iconTone="danger"
                    badge={overdue.length}
                    badgeTone="danger"
                    actionLabel="Lihat Semua"
                    actionHref={route("guru.loans.index", { scope: "active" })}
                    actionVariant="outline"
                    className="mt-8"
                >
                    <RecentLoansTable loans={overdue} />
                </DashboardSection>
            )}

            {weekScheduleCount > 0 && (
                <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                    <Wrench className="h-4 w-4 text-sky-600" />
                    <span>
                        {weekScheduleCount} jadwal praktikum dalam minggu ini
                    </span>
                </div>
            )}
        </>
    );
}
