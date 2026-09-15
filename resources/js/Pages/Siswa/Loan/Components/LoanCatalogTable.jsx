import DataTable from "@/Components/DataTable";
import DataPagination from "@/Components/DataPagination";
import EquipmentImage from "@/Components/Equipment/EquipmentImage";
import { normalizePaginator } from "@/lib/paginator";
import { Button } from "@/Components/ui/button";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

function warehouseStock(item, isBahan) {
    const remain = Number(item.available ?? 0);
    const capacity = Number(isBahan ? item.stock : (item.qty_baik ?? item.stock) ?? 0);

    return { remain, capacity };
}

function slotStock(item) {
    const remain = Number(item.slot_remaining ?? item.available ?? 0);
    const capacity = Number(item.qty_baik ?? item.stock ?? 0);

    return { remain, capacity };
}

function StockBadge({ remain, capacity, unit, empty, low }) {
    const className = empty
        ? "bg-amber-500/10 text-amber-800"
        : low
          ? "bg-warning/10 text-warning"
          : "bg-success/10 text-success";

    return (
        <span
            className={cn(
                "inline-block rounded px-2 py-0.5 text-xs font-medium",
                className,
            )}
        >
            {unit ? `Stok: ${remain} ${unit}`.trim() : `${remain} / ${capacity}`}
        </span>
    );
}

function SlotBadge({ item, usageWindowLabel }) {
    if (!usageWindowLabel) {
        return (
            <p className="text-xs text-muted-foreground">
                Pilih tanggal dan tipe dulu
            </p>
        );
    }

    const { remain, capacity } = slotStock(item);
    const full = remain <= 0;

    return (
        <div className="space-y-1">
            <span
                className={cn(
                    "inline-block rounded px-2 py-0.5 text-xs font-medium",
                    full
                        ? "bg-amber-500/10 text-amber-800"
                        : "bg-primary/10 text-primary",
                )}
            >
                {full ? "Penuh" : `Sisa ${remain} / ${capacity}`}
            </span>
            <p
                className={cn(
                    "text-xs",
                    full ? "text-amber-800" : "text-muted-foreground",
                )}
            >
                {full
                    ? `${usageWindowLabel} sudah terpesan · antrean`
                    : `Jam ${usageWindowLabel}`}
            </p>
        </div>
    );
}

function CatalogMobileCard({ item, isBahan, cart, onAdd, maxQty, usageWindowLabel }) {
    const inCart = cart.find((i) => i.equipment.id === item.id);
    const remain = maxQty(item);
    const disabled =
        remain <= 0 || (inCart && inCart.quantity >= remain);
    const { remain: warehouseRemain, capacity } = warehouseStock(item, isBahan);
    const warehouseEmpty = warehouseRemain <= 0;
    const low = isBahan && item.is_low_stock;

    return (
        <div className="rounded-[8px] border border-border/60 bg-card p-4 shadow-sm">
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
            <div className="mb-3 grid grid-cols-2 gap-3">
                <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Stok
                    </p>
                    <StockBadge
                        remain={warehouseRemain}
                        capacity={capacity}
                        unit={isBahan ? (item.unit ?? "") : null}
                        empty={warehouseEmpty}
                        low={low}
                    />
                    {isBahan && warehouseEmpty && (
                        <p className="mt-1 text-xs text-amber-800">Antrean dibuka</p>
                    )}
                    {low && !warehouseEmpty && (
                        <p className="mt-1 text-xs text-warning">Stok menipis</p>
                    )}
                </div>
                {!isBahan && (
                    <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Jam pemakaian
                        </p>
                        <SlotBadge item={item} usageWindowLabel={usageWindowLabel} />
                    </div>
                )}
            </div>
            <Button
                type="button"
                size="sm"
                disabled={disabled}
                className="w-full"
                onClick={() => onAdd(item)}
            >
                Tambah
            </Button>
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
    usageWindowLabel = null,
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
                header: "Stok",
                enableSorting: false,
                cell: ({ row }) => {
                    const item = row.original;
                    const { remain, capacity } = warehouseStock(item, isBahan);
                    const empty = remain <= 0;
                    const low = isBahan && item.is_low_stock;

                    return (
                        <div className="space-y-1">
                            <StockBadge
                                remain={remain}
                                capacity={capacity}
                                unit={isBahan ? (item.unit ?? "") : null}
                                empty={empty}
                                low={low}
                            />
                            {isBahan && empty && (
                                <p className="text-xs text-amber-800">Antrean dibuka</p>
                            )}
                            {low && !empty && (
                                <p className="text-xs text-warning">Stok menipis</p>
                            )}
                        </div>
                    );
                },
            },
            ...(!isBahan
                ? [
                      {
                          id: "slot",
                          header: "Jam pemakaian",
                          enableSorting: false,
                          cell: ({ row }) => (
                              <SlotBadge
                                  item={row.original}
                                  usageWindowLabel={usageWindowLabel}
                              />
                          ),
                      },
                  ]
                : []),
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
                            Tambah
                        </Button>
                    );
                },
            },
        ],
        [isBahan, cart, onAdd, maxQty, usageWindowLabel],
    );

    if (!items?.length) {
        return (
            <p className="rounded-[8px] border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
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
                        usageWindowLabel={usageWindowLabel}
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
                    tableClassName={isBahan ? "min-w-[700px]" : "min-w-[860px]"}
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
