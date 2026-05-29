import AppLayout from "@/Layouts/AppLayout";
import { DashboardPageHeader } from "@/Components/Dashboard/DashboardPageHeader";
import { Head, usePage } from "@inertiajs/react";
import SiswaDashboard from "./Components/SiswaDashboard";

export default function Index({
    loans = [],
    equipment = [],
    notifications = [],
    upcomingSchedules = [],
}) {
    const user = usePage().props.auth?.user;
    const firstName = user?.name?.split(" ")[0] ?? "Pengguna";

    return (
        <AppLayout>
            <Head title="Dashboard Siswa" />

            <div className="animate-fade-in mx-auto max-w-7xl">
                <DashboardPageHeader
                    title={`Halo, ${firstName}`}
                    subtitle="Apa yang ingin kamu lakukan hari ini?"
                />

                <SiswaDashboard
                    user={user}
                    loans={loans}
                    equipment={equipment}
                    notifications={notifications}
                    upcomingSchedules={upcomingSchedules}
                />
            </div>
        </AppLayout>
    );
}
