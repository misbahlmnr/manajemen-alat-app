import { StatCard } from "@/Components/Dashboard/StatCard";
import { RecentLoansTable } from "@/Components/Dashboard/RecentLoansTable";
import { AvailableEquipmentTable } from "@/Components/Dashboard/AvailableEquipmentTable";
import { DashboardSection } from "@/Components/Dashboard/DashboardSection";
import { UpcomingSchedules } from "@/Components/Dashboard/UpcomingSchedules";
import QuickActionCard from "./QuickActionCard";
import NotificationBanner from "./NotificationBanner";
import CompensationAlert from "./CompensationAlert";
import { Bell, ClipboardCheck, FileText, Package, Wrench } from "lucide-react";

export default function SiswaDashboard({
    loans,
    equipment,
    notifications,
    upcomingSchedules,
    hasPendingCompensation = false,
    compensationLoanId = null,
}) {
    const myLoans = loans ?? [];
    const myActive = myLoans.filter((l) =>
        ["dipinjam", "disetujui", "terlambat"].includes(l.status),
    );
    const myPending = myLoans.filter((l) =>
        ["diminta", "antrian"].includes(l.status),
    );
    const unread = (notifications ?? []).filter((n) => !n.read);
    const availableEquipment = equipment ?? [];
    const returnedLoans = myLoans.filter((l) => l.status === "dikembalikan");

    return (
        <>
            <NotificationBanner notifications={unread} />

            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard
                    title="Pinjaman Alat Aktif"
                    value={myActive.length}
                    icon={FileText}
                    variant="primary"
                />
                <StatCard
                    title="Pengajuan Pending"
                    value={myPending.length}
                    icon={ClipboardCheck}
                    variant={myPending.length > 0 ? "warning" : "default"}
                />
                <StatCard
                    title="Notifikasi Baru"
                    value={unread.length}
                    icon={Bell}
                    variant={unread.length > 0 ? "warning" : "default"}
                />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <QuickActionCard
                    href={route("siswa.loans.create", { type: "alat" })}
                    icon={Wrench}
                    title="Ajukan Pinjam Alat"
                    description="Pinjam kamera, mixer, mikrofon, dan alat lab lainnya."
                    accent="primary"
                />
                <QuickActionCard
                    href={route("siswa.loans.create", { type: "bahan" })}
                    icon={Package}
                    title="Ambil Bahan"
                    description="Komponen elektro, kabel, timah, dan bahan habis pakai."
                    accent="warning"
                />
            </div>

            {hasPendingCompensation && (
                <CompensationAlert
                    href={
                        compensationLoanId
                            ? route("siswa.loans.show", compensationLoanId)
                            : route("siswa.loans.index")
                    }
                />
            )}

            <UpcomingSchedules schedules={upcomingSchedules} />

            {myActive.length > 0 && (
                <div className="mt-8">
                    <h2 className="mb-4 text-lg font-semibold">
                        Peminjaman Aktif Saya
                    </h2>
                    <RecentLoansTable loans={myActive} />
                </div>
            )}

            {returnedLoans.length > 0 && (
                <div className="mt-8">
                    <h2 className="mb-4 text-lg font-semibold">
                        Riwayat Pengembalian
                    </h2>
                    <RecentLoansTable loans={returnedLoans} />
                </div>
            )}

            <DashboardSection
                title="Peralatan Tersedia"
                description={`${availableEquipment.length} alat siap dipinjam`}
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
