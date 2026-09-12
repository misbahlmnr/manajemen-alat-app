import { StatCard } from "@/Components/Dashboard/StatCard";
import { RecentLoansTable } from "@/Components/Dashboard/RecentLoansTable";
import { AvailableEquipmentTable } from "@/Components/Dashboard/AvailableEquipmentTable";
import { DashboardSection } from "@/Components/Dashboard/DashboardSection";
import { UpcomingSchedules } from "@/Components/Dashboard/UpcomingSchedules";
import QuickActionCard from "./QuickActionCard";
import NotificationBanner from "./NotificationBanner";
import CompensationAlert from "./CompensationAlert";
import { usePage } from "@inertiajs/react";
import { Bell, ClipboardCheck, FileText } from "lucide-react";

export default function SiswaDashboard({
    loans,
    equipment,
    inventorySummary = null,
    todaySchedules,
    hasPendingCompensation = false,
    compensationLoanId = null,
    pendingCompensation = null,
}) {
    const {
        notifications = [],
        unreadNotifications = 0,
        notificationsIndexUrl = null,
    } = usePage().props;
    const myLoans = loans ?? [];
    const myActive = myLoans.filter((l) =>
        ["dipinjam", "disetujui", "terlambat"].includes(l.status),
    );
    const myPending = myLoans.filter((l) =>
        ["diminta", "antrian"].includes(l.status),
    );
    const availableEquipment = equipment ?? [];
    const returnedLoans = myLoans.filter((l) => l.status === "dikembalikan");

    return (
        <>
            <NotificationBanner
                notifications={notifications}
                unreadCount={unreadNotifications}
                indexUrl={notificationsIndexUrl}
            />

            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard
                    title="Pinjaman Alat Aktif"
                    value={myActive.length}
                    icon={FileText}
                    variant="info"
                />
                <StatCard
                    title="Pengajuan Pending"
                    value={myPending.length}
                    icon={ClipboardCheck}
                    variant="warning"
                />
                <StatCard
                    title="Notifikasi Baru"
                    value={unreadNotifications}
                    icon={Bell}
                    variant="warning"
                />
            </div>

            <div className="mb-8">
                <QuickActionCard
                    href={route("siswa.loans.create")}
                    icon={FileText}
                    title="Ajukan Alat / Bahan"
                    description="Pilih alat dan bahan ke satu keranjang, lalu ajukan sekali untuk kebutuhan praktikum."
                    accent="primary"
                />
            </div>

            {hasPendingCompensation && (
                <CompensationAlert
                    href={
                        compensationLoanId
                            ? route("siswa.loans.show", compensationLoanId)
                            : route("siswa.loans.index")
                    }
                    compensation={pendingCompensation}
                />
            )}

            <UpcomingSchedules schedules={todaySchedules} />

            {myActive.length > 0 && (
                <DashboardSection
                    title="Alat & Bahan Aktif"
                    description="Pinjaman yang sedang berjalan"
                    icon={FileText}
                    iconTone="info"
                    actionLabel="Lihat Semua"
                    actionHref={route("siswa.loans.index", { scope: "active" })}
                    actionVariant="outline"
                    className="mt-8"
                >
                    <RecentLoansTable loans={myActive} />
                </DashboardSection>
            )}

            {returnedLoans.length > 0 && (
                <DashboardSection
                    title="Riwayat Pengembalian"
                    description="Peminjaman yang sudah selesai"
                    icon={ClipboardCheck}
                    iconTone="success"
                    actionLabel="Lihat Semua"
                    actionHref={route("siswa.loans.index", { scope: "history" })}
                    actionVariant="outline"
                    className="mt-8"
                >
                    <RecentLoansTable loans={returnedLoans} />
                </DashboardSection>
            )}

            <DashboardSection
                title="Inventaris Aktif"
                description={
                    inventorySummary
                        ? `${inventorySummary.tersedia ?? 0} tersedia · ${inventorySummary.sedang_dipinjam ?? 0} stok kosong · ${inventorySummary.antrean_aktif ?? 0} antrean aktif Anda`
                        : `${availableEquipment.length} alat lab`
                }
                icon={FileText}
                iconTone="info"
                actionLabel="Lihat Semua"
                actionHref={route("siswa.equipment.index")}
                actionVariant="outline"
                className="mt-8"
            >
                <AvailableEquipmentTable equipment={availableEquipment} />
            </DashboardSection>
        </>
    );
}
