import DataTable from "@/Components/DataTable";
import StatusBadge from "@/Components/StatusBadge";
import TableRowActions from "@/Components/TableRowActions";
import { cn } from "@/lib/utils";

export default function SupplyTable({ items, pagination, onDelete }) {
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
            id: "name",
            header: "Nama Bahan",
            accessorFn: (row) => row.name,
            cell: ({ row }) => (
                <div>
                    <p className="font-medium text-foreground">{row.original.name}</p>
                    {row.original.is_low_stock && (
                        <p className="text-xs text-warning">Stok menipis</p>
                    )}
                </div>
            ),
        },
        { accessorKey: "category", header: "Kategori" },
        {
            id: "stock",
            header: "Stok",
            accessorFn: (row) => row.available,
            cell: ({ row }) => (
                <>
                    <span
                        className={cn(
                            "font-medium tabular-nums",
                            row.original.is_low_stock && "text-warning",
                        )}
                    >
                        {row.original.available}
                    </span>
                    <span className="text-muted-foreground"> / {row.original.stock}</span>
                </>
            ),
        },
        { accessorKey: "unit", header: "Satuan" },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ getValue }) => <StatusBadge status={getValue()} />,
        },
        { accessorKey: "created_at_formatted", header: "Dibuat" },
        {
            id: "actions",
            header: "Aksi",
            enableSorting: false,
            meta: { align: "right", cellClassName: "text-right" },
            cell: ({ row }) => (
                <TableRowActions
                    showHref={route("admin.supplies.show", row.original.id)}
                    editHref={route("admin.supplies.edit", row.original.id)}
                    onDelete={() => onDelete(row.original)}
                />
            ),
        },
    ];

    return (
        <DataTable
            data={items ?? []}
            columns={columns}
            pagination={pagination}
            tableClassName="min-w-[800px]"
            getRowId={(row) => String(row.id)}
            emptyState="Tidak ada bahan ditemukan"
            initialSorting={[{ id: "name", desc: false }]}
        />
    );
}
