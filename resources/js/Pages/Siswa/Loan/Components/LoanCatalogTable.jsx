import DataTable from "@/Components/DataTable";
import { Button } from "@/Components/ui/button";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

function StockIndicator({ item, isBahan }) {
    const remain = item.available;
    const low = isBahan && item.is_low_stock;

    const className =
        remain <= 0
            ? "bg-destructive/10 text-destructive"
            : low
              ? "bg-warning/10 text-warning"
              : "bg-success/10 text-success";

    return (
        <div className="space-y-1">
            <span
                className={cn(
                    "inline-block rounded px-2 py-0.5 text-xs font-medium",
                    className,
                )}
            >
                {isBahan
                    ? `Stok: ${remain} ${item.unit ?? ""}`
                    : `Tersedia: ${remain} / ${item.stock}`}
            </span>
            {low && (
                <p className="text-xs text-warning">Stok menipis</p>
            )}
        </div>
    );
}

export default function LoanCatalogTable({
    items,
    pagination,
    isBahan,
    cart,
    onAdd,
    maxQty,
}) {
    const columns = useMemo(
        () => [
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
                header: isBahan ? "Nama Bahan" : "Nama Alat",
                accessorFn: (row) => row.name,
                cell: ({ row }) => (
                    <div className="min-w-[140px] max-w-xs">
                        <p className="font-medium text-foreground">
                            {row.original.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {row.original.category ?? row.original.code}
                        </p>
                    </div>
                ),
            },
            {
                id: "stock",
                header: "Ketersediaan",
                enableSorting: false,
                cell: ({ row }) => (
                    <StockIndicator item={row.original} isBahan={isBahan} />
                ),
            },
            {
                id: "in_cart",
                header: "Keranjang",
                enableSorting: false,
                cell: ({ row }) => {
                    const inCart = cart.find(
                        (i) => i.equipment.id === row.original.id,
                    );
                    if (!inCart) {
                        return (
                            <span className="text-xs text-muted-foreground">
                                —
                            </span>
                        );
                    }
                    return (
                        <span className="inline-flex rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success">
                            ×{inCart.quantity}
                        </span>
                    );
                },
            },
            {
                id: "actions",
                header: "Aksi",
                enableSorting: false,
                meta: { align: "right", cellClassName: "text-right" },
                cell: ({ row }) => {
                    const item = row.original;
                    const inCart = cart.find(
                        (i) => i.equipment.id === item.id,
                    );
                    const remain = maxQty(item);
                    const disabled =
                        remain <= 0 ||
                        (inCart && inCart.quantity >= remain);

                    return (
                        <Button
                            type="button"
                            size="sm"
                            disabled={disabled}
                            onClick={() => onAdd(item)}
                        >
                            {isBahan ? "Ambil" : "Tambah"}
                        </Button>
                    );
                },
            },
        ],
        [isBahan, cart, onAdd, maxQty],
    );

    return (
        <DataTable
            data={items ?? []}
            columns={columns}
            pagination={pagination}
            tableClassName="min-w-[640px]"
            getRowId={(row) => String(row.id)}
            emptyState={
                isBahan
                    ? "Tidak ada bahan tersedia"
                    : "Tidak ada alat tersedia"
            }
            initialSorting={[{ id: "name", desc: false }]}
        />
    );
}
