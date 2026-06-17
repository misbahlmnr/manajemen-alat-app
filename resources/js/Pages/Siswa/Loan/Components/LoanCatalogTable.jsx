import DataTable from "@/Components/DataTable";
import DataPagination from "@/Components/DataPagination";
import EquipmentImage from "@/Components/Equipment/EquipmentImage";
import { normalizePaginator } from "@/lib/paginator";
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

function CatalogMobileCard({ item, isBahan, cart, onAdd, maxQty }) {
    const inCart = cart.find((i) => i.equipment.id === item.id);
    const remain = maxQty(item);
    const disabled =
        remain <= 0 || (inCart && inCart.quantity >= remain);

    return (
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-start gap-3">
                <EquipmentImage
                    imageUrl={item.image_url}
                    name={item.name}
                    itemType={isBahan ? "bahan" : "alat"}
                    className="h-11 w-11 shrink-0 rounded-lg border border-border/60"
                    iconClassName="h-4 w-4"
                />
                <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {item.code}
                    </p>
                    {item.category && (
                        <p className="mt-1 text-xs text-muted-foreground">
                            {item.category}
                        </p>
                    )}
                </div>
                {inCart && (
                    <span className="shrink-0 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success">
                        ×{inCart.quantity}
                    </span>
                )}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <StockIndicator item={item} isBahan={isBahan} />
                <Button
                    type="button"
                    size="sm"
                    disabled={disabled}
                    className="w-full sm:w-auto"
                    onClick={() => onAdd(item)}
                >
                    {isBahan ? "Ambil" : "Tambah"}
                </Button>
            </div>
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
    const normalizedPagination = normalizePaginator(pagination);

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
                    <div className="flex min-w-[120px] max-w-xs items-center gap-3">
                        <EquipmentImage
                            imageUrl={row.original.image_url}
                            name={row.original.name}
                            itemType={isBahan ? "bahan" : "alat"}
                            className="h-10 w-10 shrink-0 rounded-lg border border-border/60"
                            iconClassName="h-4 w-4"
                        />
                        <div>
                            <p className="font-medium text-foreground">
                                {row.original.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {row.original.category ?? row.original.code}
                            </p>
                        </div>
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

    if (!items?.length) {
        return (
            <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                {isBahan
                    ? "Tidak ada bahan tersedia"
                    : "Tidak ada alat tersedia"}
            </p>
        );
    }

    return (
        <div className="space-y-3">
            <div className="space-y-3 md:hidden">
                {items.map((item) => (
                    <CatalogMobileCard
                        key={item.id}
                        item={item}
                        isBahan={isBahan}
                        cart={cart}
                        onAdd={onAdd}
                        maxQty={maxQty}
                    />
                ))}
                {normalizedPagination && (
                    <DataPagination
                        links={normalizedPagination.links}
                        meta={normalizedPagination.meta}
                    />
                )}
            </div>

            <div className="hidden md:block">
                <DataTable
                    data={items ?? []}
                    columns={columns}
                    pagination={pagination}
                    tableClassName="min-w-[700px]"
                    getRowId={(row) => String(row.id)}
                    emptyState={
                        isBahan
                            ? "Tidak ada bahan tersedia"
                            : "Tidak ada alat tersedia"
                    }
                    initialSorting={[{ id: "name", desc: false }]}
                />
            </div>
        </div>
    );
}
