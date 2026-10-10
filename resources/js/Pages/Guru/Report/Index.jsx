import AppLayout from "@/Layouts/AppLayout";
import ReportWorkspace from "@/Components/Report/ReportWorkspace";
import { Head } from "@inertiajs/react";

export default function Index(props) {
    return (
        <AppLayout>
            <Head title="Laporan" />
            <ReportWorkspace
                indexRoute="guru.reports.index"
                pageSubtitle="Pantau aktivitas peminjaman siswa bimbingan serta kondisi inventaris laboratorium berdasarkan periode yang dipilih."
                showUsersTab={props.showUsersTab ?? false}
                {...props}
            />
        </AppLayout>
    );
}
