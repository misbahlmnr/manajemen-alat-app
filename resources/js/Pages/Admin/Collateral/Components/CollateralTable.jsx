import DataTable from "@/Components/DataTable";
import CollateralStatusBadge from "@/Components/CollateralStatusBadge";
import CollateralTableActions from "./CollateralTableActions";

export default function CollateralTable({
    items,
    pagination,
    onDelete,
    onInspect,
}) {
    const columns = [
        {
            accessorKey: "code",
            header: "No. Jaminan",
            cell: ({ getValue }) => (
                <span className="font-mono text-xs text-muted-foreground">
                    {getValue()}
                </span>
            ),
        },
        {
            id: "student",
            header: "Siswa",
            accessorFn: (row) => row.student_name,
            cell: ({ row }) => (
                <div>
                    <p className="font-medium text-foreground">{row.original.student_name}</p>
                    <p className="text-xs text-muted-foreground">{row.original.student_class}</p>
                </div>
            ),
        },
        { accessorKey: "card_type_label", header: "Jenis Kartu" },
        {
            id: "card_no",
            header: "No. Kartu",
            accessorFn: (row) => row.card_number || row.student_nisn || "—",
            cell: ({ getValue }) => <span className="font-mono text-xs">{getValue()}</span>,
        },
        {
            id: "loan",
            header: "Peminjaman",
            accessorFn: (row) => row.loan_code,
            cell: ({ row }) => (
                <div>
                    <p className="font-mono text-xs">{row.original.loan_code}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                        {row.original.equipment_summary}
                    </p>
                </div>
            ),
        },
        {
            accessorKey: "held_at_formatted",
            header: "Dititipkan",
            meta: { cellClassName: "whitespace-nowrap text-muted-foreground" },
        },
        {
            accessorKey: "returned_at_formatted",
            header: "Diambil Kembali",
            meta: { cellClassName: "whitespace-nowrap text-muted-foreground" },
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ getValue }) => <CollateralStatusBadge status={getValue()} />,
        },
        {
            accessorKey: "created_at_formatted",
            header: "Dibuat",
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
                />
            ),
        },
    ];

    return (
        <DataTable
            data={items ?? []}
            columns={columns}
            pagination={pagination}
            tableClassName="min-w-[1050px]"
            getRowId={(row) => String(row.id)}
            emptyState="Tidak ada jaminan kartu ditemukan"
            initialSorting={[{ id: "created_at_formatted", desc: true }]}
        />
    );
}
