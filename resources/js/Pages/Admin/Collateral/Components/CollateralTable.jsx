import DataTable from "@/Components/DataTable";
import CollateralStatusBadge from "@/Components/CollateralStatusBadge";
import CollateralTableActions from "./CollateralTableActions";
import { Link } from "@inertiajs/react";

export default function CollateralTable({
    items,
    pagination,
    onDelete,
    onInspect,
    onHold,
}) {
    const columns = [
        {
            id: "submission",
            header: "Submission",
            accessorFn: (row) => row.submission_code || row.loan_code,
            cell: ({ row }) => (
                <Link
                    href={route("admin.collaterals.show", row.original.id)}
                    className="font-mono text-xs text-primary hover:underline"
                >
                    {row.original.submission_code || row.original.loan_code}
                </Link>
            ),
        },
        {
            id: "student",
            header: "Siswa",
            accessorFn: (row) => row.student_name,
            cell: ({ row }) => (
                <div>
                    <p className="font-medium text-foreground">
                        {row.original.student_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {row.original.student_class}
                    </p>
                </div>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ getValue }) => (
                <CollateralStatusBadge status={getValue()} />
            ),
        },
        {
            accessorKey: "held_at_formatted",
            header: "Diterima",
            meta: { cellClassName: "whitespace-nowrap text-muted-foreground" },
        },
        {
            id: "actions",
            header: "Aksi",
            enableSorting: false,
            meta: { align: "right", cellClassName: "text-right" },
            cell: ({ row }) => (
                <CollateralTableActions
                    item={row.original}
                    onDelete={onDelete}
                    onInspect={onInspect}
                    onHold={onHold}
                />
            ),
        },
    ];

    return (
        <DataTable
            data={items ?? []}
            columns={columns}
            pagination={pagination}
            tableClassName="min-w-[720px]"
            getRowId={(row) => String(row.id)}
            emptyState="Tidak ada jaminan kartu ditemukan"
            initialSorting={[{ id: "held_at_formatted", desc: true }]}
        />
    );
}
