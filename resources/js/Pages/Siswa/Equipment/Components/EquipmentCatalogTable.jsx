import DataTable from "@/Components/DataTable";
import AvailabilityBadge from "@/Components/AvailabilityBadge";
import { Button } from "@/Components/ui/button";
import ConditionBadge from "@/Pages/Admin/Equipment/Components/ConditionBadge";
import { Link } from "@inertiajs/react";
import { Eye, FileText } from "lucide-react";

export default function EquipmentCatalogTable({ items, pagination }) {
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
                <div className="min-w-[160px] max-w-xs">
                    <p className="font-medium text-foreground">
                        {row.original.name}
                    </p>
                    {row.original.description && (
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                            {row.original.description}
                        </p>
                    )}
                </div>
            ),
        },
        {
            accessorKey: "category",
            header: "Kategori",
            meta: { cellClassName: "text-muted-foreground" },
        },
        {
            id: "stock",
            header: "Stok",
            accessorFn: (row) => row.available,
            cell: ({ row }) => (
                <span className="tabular-nums">
                    <span className="font-medium text-foreground">
                        {row.original.available}
                    </span>
                    <span className="text-muted-foreground">
                        {" "}
                        / {row.original.stock}
                    </span>
                </span>
            ),
        },
        {
            accessorKey: "condition",
            header: "Kondisi",
            cell: ({ getValue }) => <ConditionBadge condition={getValue()} />,
        },
        {
            id: "availability",
            header: "Ketersediaan",
            accessorFn: (row) => row.availability_label,
            enableSorting: false,
            cell: ({ row }) => (
                <AvailabilityBadge label={row.original.availability_label} />
            ),
        },
        {
            accessorKey: "location",
            header: "Lokasi",
            meta: { cellClassName: "text-muted-foreground whitespace-nowrap" },
        },
        {
            id: "actions",
            header: "Aksi",
            enableSorting: false,
            meta: { align: "right", cellClassName: "text-right" },
            cell: ({ row }) => {
                const item = row.original;

                return (
                    <div className="flex flex-wrap justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={item.show_url} preserveScroll>
                                <Eye className="mr-1.5 h-3.5 w-3.5" />
                                Detail
                            </Link>
                        </Button>
                        <Button
                            size="sm"
                            disabled={!item.can_borrow || !item.borrow_url}
                            asChild
                        >
                            <Link href={item.borrow_url} preserveScroll>
                                <FileText className="mr-1.5 h-3.5 w-3.5" />
                                Pinjam
                            </Link>
                        </Button>
                    </div>
                );
            },
        },
    ];

    return (
        <DataTable
            data={items ?? []}
            columns={columns}
            pagination={pagination}
            tableClassName="min-w-[900px]"
            getRowId={(row) => String(row.id)}
            emptyState="Tidak ada alat ditemukan"
            initialSorting={[{ id: "name", desc: false }]}
        />
    );
}
