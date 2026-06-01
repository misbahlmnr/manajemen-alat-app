import DataTable from "@/Components/DataTable";
import StatusBadge from "@/Components/StatusBadge";
import TableRowActions from "@/Components/TableRowActions";
import ConditionBadge from "./ConditionBadge";

export default function EquipmentTable({ items, pagination, onDelete }) {
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
            header: "Nama Alat",
            accessorFn: (row) => row.name,
            cell: ({ row }) => (
                <div>
                    <p className="font-medium text-foreground">{row.original.name}</p>
                    <p className="text-xs text-muted-foreground">
                        {row.original.location}
                    </p>
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
                    <span className="font-medium">{row.original.available}</span>
                    <span className="text-muted-foreground"> / {row.original.stock}</span>
                </>
            ),
        },
        {
            accessorKey: "condition",
            header: "Kondisi",
            cell: ({ getValue }) => <ConditionBadge condition={getValue()} />,
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ getValue }) => <StatusBadge status={getValue()} />,
        },
        {
            id: "actions",
            header: "Aksi",
            enableSorting: false,
            meta: { align: "right", cellClassName: "text-right" },
            cell: ({ row }) => (
                <TableRowActions
                    showHref={route("admin.equipment.show", row.original.id)}
                    editHref={route("admin.equipment.edit", row.original.id)}
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
            tableClassName="min-w-[720px]"
            getRowId={(row) => String(row.id)}
            emptyState="Tidak ada alat ditemukan"
            initialSorting={[{ id: "name", desc: false }]}
        />
    );
}
