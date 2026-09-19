import AppLayout from "@/Layouts/AppLayout";
import { DashboardPageHeader } from "@/Components/Dashboard/DashboardPageHeader";
import { Head, usePage } from "@inertiajs/react";
import GuruDashboard from "./Components/GuruDashboard";

export default function Index({
    loans = [],
    equipment = [],
    stats = {},
    praktikumToday = null,
    inventorySummary = null,
    todaySchedules = [],
    upcomingSchedules = [],
    weekScheduleCount = 0,
    notifications = [],
}) {
    const user = usePage().props.auth?.user;
    const firstName = user?.name?.split(" ")[0] ?? "Pengguna";

    return (
        <AppLayout>
            <Head title="Dashboard Guru" />

            <div className="animate-fade-in mx-auto w-full min-w-0 max-w-7xl">
                <DashboardPageHeader
                    title={`Halo, ${firstName}`}
                    subtitle="Pantau aktivitas praktikum dan kondisi inventaris laboratorium."
                />

                <GuruDashboard
                    loans={loans}
                    equipment={equipment}
                    stats={stats}
                    praktikumToday={praktikumToday}
                    inventorySummary={inventorySummary}
                    todaySchedules={todaySchedules}
                    upcomingSchedules={upcomingSchedules}
                    weekScheduleCount={weekScheduleCount}
                    notifications={notifications}
                />
            </div>
        </AppLayout>
    );
}
