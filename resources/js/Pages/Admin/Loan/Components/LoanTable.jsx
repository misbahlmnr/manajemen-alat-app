import DataTable from "@/Components/DataTable";
import LoanStatusBadge from "@/Components/LoanStatusBadge";
import LoanTableActions from "./LoanTableActions";

export default function LoanTable({
    items,
    pagination,
    onDelete,
    onReject,
    onReturn,
}) {
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
            id: "borrower",
            header: "Peminjam",
            accessorFn: (row) => row.borrower_name,
            cell: ({ row }) => (
                <div>
                    <p className="font-medium text-foreground">
                        {row.original.borrower_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {row.original.borrower_class || row.original.borrower_role}
                    </p>
                </div>
            ),
        },
        {
            accessorKey: "items_summary",
            header: "Item",
            meta: { cellClassName: "max-w-[200px]" },
            cell: ({ getValue }) => (
                <p className="line-clamp-2 text-muted-foreground">{getValue()}</p>
            ),
        },
        {
            accessorKey: "item_type",
            header: "Jenis",
            cell: ({ row }) => (
                <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
                        row.original.item_type === "alat"
                            ? "border-violet-500/20 bg-violet-500/10 text-violet-700"
                            : "border-amber-500/20 bg-amber-500/10 text-amber-800"
                    }`}
                >
                    {row.original.item_type_label}
                </span>
            ),
        },
        { accessorKey: "supervisor_name", header: "Guru" },
        {
            accessorKey: "request_date_formatted",
            header: "Tanggal",
            meta: { cellClassName: "whitespace-nowrap" },
        },
        {
            id: "due",
            header: "Batas Kembali",
            accessorFn: (row) => row.due_at_formatted,
            meta: { cellClassName: "whitespace-nowrap text-muted-foreground" },
            cell: ({ row }) =>
                row.original.item_type === "alat"
                    ? row.original.due_at_formatted
                    : "—",
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ getValue }) => <LoanStatusBadge status={getValue()} />,
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
                <LoanTableActions
                    loan={row.original}
                    onDelete={onDelete}
                    onReject={onReject}
                    onReturn={onReturn}
                />
            ),
        },
    ];

    return (
        <DataTable
            data={items ?? []}
            columns={columns}
            pagination={pagination}
            tableClassName="min-w-[1000px]"
            getRowId={(row) => String(row.id)}
            emptyState="Tidak ada peminjaman ditemukan"
            initialSorting={[{ id: "created_at_formatted", desc: true }]}
        />
    );
}
