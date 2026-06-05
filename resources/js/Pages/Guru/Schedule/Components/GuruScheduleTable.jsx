import DataTable from "@/Components/DataTable";
import SchedulePriorityBadge from "@/Components/SchedulePriorityBadge";
import ScheduleStatusBadge from "@/Components/ScheduleStatusBadge";
import { Button } from "@/Components/ui/button";
import { Link } from "@inertiajs/react";
import { Eye } from "lucide-react";

export default function GuruScheduleTable({ items, pagination }) {
    const columns = [
        {
            accessorKey: "code",
            header: "Kode",
            cell: ({ getValue }) => (
                <span className="font-mono text-xs text-muted-foreground">
                    {getValue()}
                </span>
            ),
        },
        {
            id: "mata_kuliah",
            header: "Mata Pelajaran",
            accessorFn: (row) => row.mata_kuliah,
            cell: ({ row }) => (
                <div>
                    <p className="font-medium text-foreground">
                        {row.original.mata_kuliah}
                    </p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                        {row.original.title}
                    </p>
                </div>
            ),
        },
        { accessorKey: "kelas", header: "Kelas" },
        {
            accessorKey: "tanggal_formatted",
            header: "Tanggal",
            meta: { cellClassName: "whitespace-nowrap" },
        },
        {
            accessorKey: "waktu_label",
            header: "Waktu",
            meta: { cellClassName: "whitespace-nowrap text-muted-foreground" },
        },
        {
            accessorKey: "ruangan",
            header: "Ruang",
            cell: ({ getValue }) => getValue() || "—",
        },
        {
            accessorKey: "priority",
            header: "Prioritas",
            cell: ({ getValue }) => (
                <SchedulePriorityBadge priority={getValue()} />
            ),
        },
        {
            id: "status",
            header: "Status",
            accessorFn: (row) => row.status,
            cell: ({ row }) => (
                <ScheduleStatusBadge
                    status={row.original.status}
                    displayStatus={row.original.display_status}
                />
            ),
        },
        {
            id: "actions",
            header: "Aksi",
            enableSorting: false,
            meta: { align: "right", cellClassName: "text-right" },
            cell: ({ row }) => (
                <Button variant="outline" size="sm" asChild>
                    <Link
                        href={route("guru.schedules.show", row.original.id)}
                        preserveScroll
                    >
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        Detail
                    </Link>
                </Button>
            ),
        },
    ];

    return (
        <DataTable
            data={items ?? []}
            columns={columns}
            pagination={pagination}
            tableClassName="min-w-[900px]"
            getRowId={(row) => String(row.id)}
            emptyState="Tidak ada jadwal ditemukan"
            initialSorting={[{ id: "tanggal_formatted", desc: true }]}
        />
    );
}
