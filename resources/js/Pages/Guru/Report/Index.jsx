import AppLayout from "@/Layouts/AppLayout";
import ReportWorkspace from "@/Components/Report/ReportWorkspace";
import { Head } from "@inertiajs/react";

export default function Index(props) {
    return (
        <AppLayout>
            <Head title="Laporan" />
            <ReportWorkspace
                indexRoute="guru.reports.index"
                pageSubtitle="Generate laporan peminjaman siswa bimbingan dan inventaris lab"
                showUsersTab={props.showUsersTab ?? false}
                {...props}
            />
        </AppLayout>
    );
}
