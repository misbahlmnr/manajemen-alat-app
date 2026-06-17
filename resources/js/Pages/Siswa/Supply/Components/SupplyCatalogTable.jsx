import DataTable from "@/Components/DataTable";
import SupplyStockBadge from "@/Components/SupplyStockBadge";
import InventoryStatusBadge from "@/Components/InventoryStatusBadge";
import EquipmentImage from "@/Components/Equipment/EquipmentImage";
import { Button } from "@/Components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "@inertiajs/react";
import { Eye, PackagePlus } from "lucide-react";

export default function SupplyCatalogTable({ items, pagination }) {
    const columns = [
        {
            id: "preview",
            header: "",
            enableSorting: false,
            cell: ({ row }) => (
                <EquipmentImage
                    imageUrl={row.original.image_url}
                    name={row.original.name}
                    itemType="bahan"
                    className="h-10 w-10 rounded-lg border border-border/60"
                    iconClassName="h-4 w-4"
                />
            ),
        },
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
                <div>
                    <span
                        className={cn(
                            "tabular-nums font-medium",
                            row.original.is_low_stock && "text-warning",
                        )}
                    >
                        {row.original.available}
                    </span>
                    <span className="text-muted-foreground">
                        {" "}
                        {row.original.unit}
                    </span>
                    {row.original.min_stock != null && (
                        <p className="text-xs text-muted-foreground">
                            Min. {row.original.min_stock} {row.original.unit}
                        </p>
                    )}
                </div>
            ),
        },
        {
            id: "stock_status",
            header: "Ketersediaan",
            accessorFn: (row) => row.stock_label,
            enableSorting: false,
            cell: ({ row }) => (
                <SupplyStockBadge label={row.original.stock_label} />
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
                        {item.can_request && item.request_url && (
                            <Button size="sm" asChild>
                                <Link href={item.request_url} preserveScroll>
                                    <PackagePlus className="mr-1.5 h-3.5 w-3.5" />
                                    Ambil
                                </Link>
                            </Button>
                        )}
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
            tableClassName="min-w-[960px]"
            getRowId={(row) => String(row.id)}
            emptyState="Tidak ada bahan ditemukan"
            initialSorting={[{ id: "name", desc: false }]}
        />
    );
}
