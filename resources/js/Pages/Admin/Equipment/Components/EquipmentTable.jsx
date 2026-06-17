import DataTable from "@/Components/DataTable";
import InventoryStatusBadge from "@/Components/InventoryStatusBadge";
import ConditionBreakdown from "@/Components/ConditionBreakdown";
import EquipmentImage from "@/Components/Equipment/EquipmentImage";
import TableRowActions from "@/Components/TableRowActions";

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
                <div className="flex items-center gap-3">
                    <EquipmentImage
                        imageUrl={row.original.image_url}
                        name={row.original.name}
                        className="h-10 w-10 shrink-0 rounded-lg border border-border/60"
                        iconClassName="h-4 w-4"
                    />
                    <div>
                        <p className="font-medium text-foreground">
                            {row.original.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {row.original.location}
                        </p>
                    </div>
                </div>
            ),
        },
        { accessorKey: "category", header: "Kategori" },
        {
            id: "stock",
            header: "Stok Baik",
            accessorFn: (row) => row.available,
            cell: ({ row }) => (
                <>
                    <span className="font-medium">{row.original.available}</span>
                    <span className="text-muted-foreground">
                        {" "}
                        / {row.original.qty_baik} baik ({row.original.stock} total)
                    </span>
                </>
            ),
        },
        {
            id: "condition",
            header: "Kondisi",
            cell: ({ row }) => (
                <ConditionBreakdown
                    breakdown={row.original.condition_breakdown}
                    compact
                />
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ getValue }) => (
                <InventoryStatusBadge status={getValue()} />
            ),
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
