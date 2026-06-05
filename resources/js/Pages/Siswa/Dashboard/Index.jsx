import AppLayout from "@/Layouts/AppLayout";
import { DashboardPageHeader } from "@/Components/Dashboard/DashboardPageHeader";
import { Head, usePage } from "@inertiajs/react";
import SiswaDashboard from "./Components/SiswaDashboard";

export default function Index({
    loans = [],
    equipment = [],
    notifications = [],
    upcomingSchedules = [],
    hasPendingCompensation = false,
    compensationLoanId = null,
}) {
    const user = usePage().props.auth?.user;
    const firstName = user?.name?.split(" ")[0] ?? "Pengguna";

    return (
        <AppLayout>
            <Head title="Dashboard Siswa" />

            <div className="animate-fade-in mx-auto w-full min-w-0 max-w-7xl">
                <DashboardPageHeader
                    title={`Halo, ${firstName}`}
                    subtitle="Apa yang ingin kamu lakukan hari ini?"
                />

                <SiswaDashboard
                    loans={loans}
                    equipment={equipment}
                    notifications={notifications}
                    upcomingSchedules={upcomingSchedules}
                    hasPendingCompensation={hasPendingCompensation}
                    compensationLoanId={compensationLoanId}
                />
            </div>
        </AppLayout>
    );
}
