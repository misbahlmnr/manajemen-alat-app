import { StatCard } from "@/Components/Dashboard/StatCard";
import { RecentLoansTable } from "@/Components/Dashboard/RecentLoansTable";
import { UpcomingSchedules } from "@/Components/Dashboard/UpcomingSchedules";
import { EquipmentCard } from "@/Components/Equipment/EquipmentCard";
import { Link } from "@inertiajs/react";
import QuickActionCard from "./QuickActionCard";
import NotificationBanner from "./NotificationBanner";
import CompensationAlert from "./CompensationAlert";
import { Bell, ClipboardCheck, FileText, Package, Wrench } from "lucide-react";

export default function SiswaDashboard({
    user,
    loans,
    equipment,
    notifications,
    upcomingSchedules,
}) {
    const userId = String(user?.id ?? "");
    const myLoans = loans.filter((l) => String(l.borrowerId) === userId);
    const myActive = myLoans.filter((l) =>
        ["dipinjam", "disetujui", "terlambat"].includes(l.status),
    );
    const myPending = myLoans.filter((l) =>
        ["diminta", "antrian"].includes(l.status),
    );
    const hasPendingCompensation = myLoans.some(
        (l) => l.compensation?.status === "pending",
    );
    const unread = (notifications ?? []).filter(
        (n) => String(n.userId) === userId && !n.read,
    );
    const availableEquipment = equipment.filter(
        (e) => e.itemType === "alat" && e.available > 0,
    );
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
                    href="#"
                    icon={Wrench}
                    title="Ajukan Pinjam Alat"
                    description="Pinjam kamera, mixer, mikrofon, dan alat lab lainnya."
                    accent="primary"
                />
                <QuickActionCard
                    href="#"
                    icon={Package}
                    title="Ambil Bahan"
                    description="Komponen elektro, kabel, timah, dan bahan habis pakai."
                    accent="warning"
                />
            </div>

            {hasPendingCompensation && <CompensationAlert />}

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
                    <RecentLoansTable loans={returnedLoans.slice(0, 5)} />
                </div>
            )}

            <div className="mt-8">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                        Peralatan Tersedia
                    </h2>
                    <Link
                        href="#"
                        className="flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                        Lihat semua
                    </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {availableEquipment.slice(0, 4).map((eq) => (
                        <EquipmentCard
                            key={eq.id}
                            equipment={eq}
                            onBorrow={() => {}}
                        />
                    ))}
                </div>
            </div>
        </>
    );
}
