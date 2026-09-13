import AppLayout from "@/Layouts/AppLayout";
import { DashboardPageHeader } from "@/Components/Dashboard/DashboardPageHeader";
import { Head, usePage } from "@inertiajs/react";
import AdminDashboard from "./Components/AdminDashboard";

export default function Index({ loans = [], equipment = [], stats = {} }) {
    const user = usePage().props.auth?.user;
    const firstName = user?.name?.split(" ")[0] ?? "Pengguna";

    return (
        <AppLayout>
            <Head title="Dashboard Admin" />

            <div className="animate-fade-in mx-auto">
                <DashboardPageHeader
                    title={`Halo, ${firstName}`}
                    subtitle="Ringkasan operasional laboratorium hari ini."
                />

                <AdminDashboard
                    loans={loans}
                    equipment={equipment}
                    stats={stats}
                />
            </div>
        </AppLayout>
    );
}
