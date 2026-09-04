import EquipmentImage from "@/Components/Equipment/EquipmentImage";
import AvailabilityBadge from "@/Components/AvailabilityBadge";
import { Button } from "@/Components/ui/button";
import { Link } from "@inertiajs/react";
import { Eye, FileText } from "lucide-react";
import DataPagination from "@/Components/DataPagination";
import { normalizePaginator } from "@/lib/paginator";

/**
 * Browse-first catalog cards for Siswa/Guru inventaris.
 */
export default function CatalogCardGrid({
    items = [],
    pagination,
    itemType = "alat",
    showBorrowCta = true,
}) {
    const pager = normalizePaginator(pagination);

    return (
        <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => {
                    const showHref =
                        item.show_url ||
                        (itemType === "bahan"
                            ? route("siswa.supplies.show", item.id)
                            : route("siswa.equipment.show", item.id));
                    const canPinjam = Boolean(
                        showBorrowCta && item.can_borrow && item.borrow_url,
                    );
                    const ctaLabel =
                        item.cta_label ??
                        (item.queue_open ? "Ajukan" : "Tambah");

                    return (
                        <div
                            key={item.id}
                            className="group flex flex-col overflow-hidden rounded-[10px] border border-[#E5E7EB] bg-card shadow-[var(--shadow-card)]"
                        >
                            <div className="aspect-[4/3] border-b border-border bg-muted/30 p-4">
                                <EquipmentImage
                                    imageUrl={item.image_url}
                                    name={item.name}
                                    itemType={itemType}
                                    className="h-full w-full rounded-[8px] object-contain"
                                    iconClassName="h-10 w-10"
                                />
                            </div>
                            <div className="flex flex-1 flex-col p-4">
                                <p className="font-mono text-[11px] text-muted-foreground">
                                    {item.code}
                                </p>
                                <h3 className="mt-1 line-clamp-2 font-display text-sm font-semibold text-foreground">
                                    {item.name}
                                </h3>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {item.category}
                                </p>
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    {item.availability_label && (
                                        <AvailabilityBadge
                                            label={item.availability_label}
                                        />
                                    )}
                                    {item.available != null && (
                                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium tabular-nums">
                                            Stok {item.available}
                                            {item.unit ? ` ${item.unit}` : ""}
                                        </span>
                                    )}
                                </div>
                                <div className="mt-auto flex gap-2 pt-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        asChild
                                    >
                                        <Link href={showHref} preserveScroll>
                                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                                            Detail
                                        </Link>
                                    </Button>
                                    {showBorrowCta &&
                                        (canPinjam ? (
                                            <Button size="sm" asChild>
                                                <Link
                                                    href={item.borrow_url}
                                                    preserveScroll
                                                >
                                                    <FileText className="mr-1.5 h-3.5 w-3.5" />
                                                    {ctaLabel}
                                                </Link>
                                            </Button>
                                        ) : (
                                            <Button size="sm" disabled>
                                                <FileText className="mr-1.5 h-3.5 w-3.5" />
                                                Tambah
                                            </Button>
                                        ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {pager && (
                <DataPagination links={pager.links} meta={pager.meta} />
            )}
        </div>
    );
}
