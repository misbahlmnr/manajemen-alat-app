import AppLayout from "@/Layouts/AppLayout";
import { DashboardPageHeader } from "@/Components/Dashboard/DashboardPageHeader";
import { Head, usePage } from "@inertiajs/react";
import GuruDashboard from "./Components/GuruDashboard";

export default function Index({
    loans = [],
    equipment = [],
    stats = {},
    upcomingSchedules = [],
    notifications = [],
}) {
    const user = usePage().props.auth?.user;
    const firstName = user?.name?.split(" ")[0] ?? "Pengguna";

    return (
        <AppLayout>
            <Head title="Dashboard Guru" />

            <div className="animate-fade-in mx-auto">
                <DashboardPageHeader
                    title={`Halo, ${firstName}`}
                    subtitle="Pantauan peminjaman siswa Anda."
                />

                <GuruDashboard
                    loans={loans}
                    equipment={equipment}
                    stats={stats}
                    upcomingSchedules={upcomingSchedules}
                    notifications={notifications}
                />
            </div>
        </AppLayout>
    );
}
