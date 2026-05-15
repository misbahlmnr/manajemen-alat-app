import AppLayout from "@/Layouts/AppLayout";
import { Head, usePage, Link } from "@inertiajs/react";
import { StatCard } from "@/Components/Dashboard/StatCard";
import { RecentLoansTable } from "@/Components/Dashboard/RecentLoansTable";
import { EquipmentCard } from "@/Components/Equipment/EquipmentCard";
import {
    Box,
    FileText,
    Clock,
    AlertTriangle,
    CheckCircle2,
    ArrowRight,
    Bell,
} from "lucide-react";

// Mock Data
const dashboardStats = {
    totalEquipment: 62,
    totalLoans: 156,
    activeLoans: 12,
    overdueLoans: 2,
    pendingRequests: 5,
};

const loansData = [
    {
        id: "1",
        equipmentId: "1",
        equipmentName: "Kamera DSLR Canon EOS 80D",
        borrowerId: "3",
        borrowerName: "Rina Permata",
        borrowerClass: "XII TAV 1",
        quantity: 1,
        status: "dipinjam",
        borrowDate: "2026-01-06",
        dueDate: "2026-01-10",
    },
    {
        id: "2",
        equipmentId: "2",
        equipmentName: "Microphone Condenser Rode NT1",
        borrowerId: "4",
        borrowerName: "Budi Santoso",
        borrowerClass: "XI TAV 2",
        quantity: 2,
        status: "terlambat",
        borrowDate: "2026-01-08",
        dueDate: "2026-01-08",
    },
    {
        id: "3",
        equipmentId: "3",
        equipmentName: "Tripod Video Manfrotto",
        borrowerId: "5",
        borrowerName: "Dewi Anggraini",
        borrowerClass: "XII TAV 1",
        quantity: 1,
        status: "diminta",
    },
];

const equipmentData = [
    {
        id: "1",
        name: "Kamera DSLR Canon EOS 80D",
        category: "Kamera",
        stock: 5,
        available: 3,
        condition: "baik",
        location: "Rak A1",
        description:
            "Kamera DSLR profesional untuk rekaman video dan fotografi",
    },
    {
        id: "2",
        name: "Microphone Condenser Rode NT1",
        category: "Mikrofon",
        stock: 8,
        available: 6,
        condition: "baik",
        location: "Rak B2",
        description: "Mikrofon condenser berkualitas studio",
    },
    {
        id: "3",
        name: "Tripod Video Manfrotto",
        category: "Tripod",
        stock: 10,
        available: 7,
        condition: "baik",
        location: "Rak C1",
        description: "Tripod video profesional dengan fluid head",
    },
];

const notificationsData = [
    {
        id: "1",
        userId: "3", // Matches siswa role for demo
        title: "Pengingat Pengembalian",
        message:
            "Kamera DSLR Canon EOS 80D harus dikembalikan pada 10 Jan 2026 pukul 16:00",
        type: "warning",
        read: false,
    },
];

export default function Dashboard() {
    const user = usePage().props.auth.user;

    const pendingLoans = loansData.filter((l) => l.status === "diminta");
    const activeLoans = loansData.filter(
        (l) => l.status === "dipinjam" || l.status === "terlambat",
    );
    const overdueLoans = loansData.filter((l) => l.status === "terlambat");
    const userNotifications = notificationsData.filter(
        (n) => n.userId === user?.id && !n.read,
    );

    const renderAdminDashboard = () => (
        <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    title="Total Peralatan"
                    value={dashboardStats.totalEquipment}
                    icon={Box}
                    variant="primary"
                />
                <StatCard
                    title="Peminjaman Aktif"
                    value={dashboardStats.activeLoans}
                    icon={FileText}
                    trend={{ value: 12, isPositive: true }}
                />
                <StatCard
                    title="Menunggu Verifikasi"
                    value={dashboardStats.pendingRequests}
                    icon={Clock}
                    variant="warning"
                />
                <StatCard
                    title="Keterlambatan"
                    value={dashboardStats.overdueLoans}
                    icon={AlertTriangle}
                    variant="danger"
                />
            </div>

            {/* Pending Requests */}
            {pendingLoans.length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-foreground">
                            Permintaan Menunggu Verifikasi
                        </h2>
                        <Link
                            href="/loans"
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                            Lihat semua <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <RecentLoansTable
                        loans={pendingLoans}
                        showActions
                        onApprove={(id) => console.log("Approve:", id)}
                        onReject={(id) => console.log("Reject:", id)}
                    />
                </div>
            )}

            {/* Active & Overdue Loans */}
            <div className="grid lg:grid-cols-2 gap-6">
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-foreground">
                            Peminjaman Aktif
                        </h2>
                        <span className="text-sm text-muted-foreground">
                            {activeLoans.length} peminjaman
                        </span>
                    </div>
                    <RecentLoansTable loans={activeLoans.slice(0, 5)} />
                </div>

                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                            Keterlambatan
                        </h2>
                    </div>
                    {overdueLoans.length > 0 ? (
                        <RecentLoansTable loans={overdueLoans} />
                    ) : (
                        <div className="stat-card text-center py-8">
                            <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
                            <p className="text-muted-foreground">
                                Tidak ada keterlambatan
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    const renderGuruDashboard = () => (
        <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <StatCard
                    title="Total Peralatan"
                    value={dashboardStats.totalEquipment}
                    icon={Box}
                    variant="primary"
                />
                <StatCard
                    title="Peminjaman Siswa Aktif"
                    value={dashboardStats.activeLoans}
                    icon={FileText}
                />
                <StatCard
                    title="Keterlambatan"
                    value={dashboardStats.overdueLoans}
                    icon={AlertTriangle}
                    variant="danger"
                />
            </div>

            {/* Recent Student Loans */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">
                        Peminjaman Siswa Terbaru
                    </h2>
                    <Link
                        href="/loans"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                        Lihat semua <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
                <RecentLoansTable loans={loansData.slice(0, 5)} />
            </div>

            {/* Popular Equipment */}
            <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">
                    Peralatan Populer
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {equipmentData.slice(0, 3).map((eq) => (
                        <EquipmentCard
                            key={eq.id}
                            equipment={eq}
                            showBorrowButton={false}
                        />
                    ))}
                </div>
            </div>
        </>
    );

    const renderSiswaDashboard = () => {
        // Mock data borrower matches user.id '3' for testing
        const myLoans = loansData.filter(
            (l) => l.borrowerId === (user?.id?.toString() || "3"),
        );
        const myActiveLoans = myLoans.filter(
            (l) => l.status === "dipinjam" || l.status === "disetujui",
        );
        const myOverdue = myLoans.filter((l) => l.status === "terlambat");

        return (
            <>
                {/* Notifications Banner */}
                {userNotifications.length > 0 && (
                    <div className="mb-6 p-4 rounded-xl bg-warning/10 border border-warning/20 flex items-start gap-4">
                        <Bell className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-foreground">
                                Kamu memiliki {userNotifications.length}{" "}
                                notifikasi baru
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {userNotifications[0]?.message}
                            </p>
                        </div>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <StatCard
                        title="Peminjaman Aktif"
                        value={myActiveLoans.length}
                        icon={FileText}
                        variant="primary"
                    />
                    <StatCard
                        title="Total Riwayat"
                        value={myLoans.length}
                        icon={Clock}
                    />
                    <StatCard
                        title="Keterlambatan"
                        value={myOverdue.length}
                        icon={AlertTriangle}
                        variant={myOverdue.length > 0 ? "danger" : "default"}
                    />
                </div>

                {/* My Active Loans */}
                {myActiveLoans.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-foreground mb-4">
                            Peminjaman Aktif Saya
                        </h2>
                        <RecentLoansTable loans={myActiveLoans} />
                    </div>
                )}

                {/* Available Equipment */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-foreground">
                            Peralatan Tersedia
                        </h2>
                        <Link
                            href="/equipment"
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                            Lihat semua <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {equipmentData
                            .filter((e) => e.available > 0)
                            .slice(0, 4)
                            .map((eq) => (
                                <EquipmentCard
                                    key={eq.id}
                                    equipment={eq}
                                    onBorrow={() =>
                                        console.log("Borrow:", eq.id)
                                    }
                                />
                            ))}
                    </div>
                </div>
            </>
        );
    };

    return (
        <AppLayout title="Dashboard" subtitle="Ringkasan aktivitas peminjaman & peralatan">
            <Head title="Dashboard" />

            <div className="animate-fade-in max-w-7xl mx-auto">
                {/* Page Header */}
                <div className="page-header">
                    <div>
                        <h1 className="section-title">
                            {user?.role === "admin"
                                ? "Dashboard Admin"
                                : user?.role === "guru"
                                  ? "Dashboard Guru"
                                  : "Dashboard Siswa"}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Selamat datang kembali, {user?.name}
                        </p>
                    </div>
                </div>

                {/* Role-specific content */}
                {user?.role === "admin" && renderAdminDashboard()}
                {user?.role === "guru" && renderGuruDashboard()}
                {user?.role === "siswa" && renderSiswaDashboard()}

                {/* Default fallback if user has no matching role */}
                {(!user?.role ||
                    (user.role !== "admin" &&
                        user.role !== "guru" &&
                        user.role !== "siswa")) &&
                    renderAdminDashboard()}
            </div>
        </AppLayout>
    );
}
