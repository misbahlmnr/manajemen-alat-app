import AppLayout from "@/Layouts/AppLayout";
import ReportWorkspace from "@/Components/Report/ReportWorkspace";
import { Head } from "@inertiajs/react";

export default function Index(props) {
    return (
        <AppLayout>
            <Head title="Laporan" />
            <ReportWorkspace
                indexRoute="admin.reports.index"
                pageSubtitle="Pantau ringkasan operasional laboratorium, kondisi inventaris, dan aktivitas peminjaman berdasarkan periode yang dipilih."
                {...props}
            />
        </AppLayout>
    );
}
