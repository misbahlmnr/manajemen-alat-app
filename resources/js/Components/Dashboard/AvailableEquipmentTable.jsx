import AvailabilityBadge from "@/Components/AvailabilityBadge";
import DataPagination from "@/Components/DataPagination";
import ConditionBadge from "@/Pages/Admin/Equipment/Components/ConditionBadge";
import { Button } from "@/Components/ui/button";
import { Link } from "@inertiajs/react";
import { Eye, FileText } from "lucide-react";
import { useState } from "react";

export function AvailableEquipmentTable({ equipment = [], pageSize = 5 }) {
    const [page, setPage] = useState(1);

    const total = equipment.length;
    const lastPage = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, lastPage);
    const start = (safePage - 1) * pageSize;
    const pagedItems = equipment.slice(start, start + pageSize);

    const from = total ? (safePage - 1) * pageSize + 1 : 0;
    const to = total ? Math.min(safePage * pageSize, total) : 0;

    if (!equipment.length) {
        return (
            <p className="py-8 text-center text-sm text-muted-foreground">
                Tidak ada alat tersedia saat ini
            </p>
        );
    }

    return (
        <div className="data-table overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                    <thead>
                        <tr className="bg-secondary/50">
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Kode
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Nama Alat
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Kategori
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Stok
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Kondisi
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Ketersediaan
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Lokasi
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {pagedItems.map((item) => (
                            <tr
                                key={item.id}
                                className="transition-colors hover:bg-secondary/30"
                            >
                                <td className="px-4 py-4">
                                    <span className="font-mono text-xs text-muted-foreground">
                                        {item.code}
                                    </span>
                                </td>
                                <td className="px-4 py-4">
                                    <p className="text-sm font-medium text-foreground">
                                        {item.name}
                                    </p>
                                    {item.description && (
                                        <p className="line-clamp-1 text-xs text-muted-foreground">
                                            {item.description}
                                        </p>
                                    )}
                                </td>
                                <td className="px-4 py-4 text-sm text-muted-foreground">
                                    {item.category}
                                </td>
                                <td className="px-4 py-4 text-sm tabular-nums">
                                    <span className="font-medium text-foreground">
                                        {item.available}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {" "}
                                        / {item.stock}
                                    </span>
                                </td>
                                <td className="px-4 py-4">
                                    <ConditionBadge
                                        condition={item.condition}
                                    />
                                </td>
                                <td className="px-4 py-4">
                                    <AvailabilityBadge
                                        label={item.availability_label}
                                    />
                                </td>
                                <td className="px-4 py-4 text-sm text-muted-foreground whitespace-nowrap">
                                    {item.location || "—"}
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex flex-wrap justify-end gap-2">
                                        {item.show_url && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                            >
                                                <Link href={item.show_url}>
                                                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                                                    Detail
                                                </Link>
                                            </Button>
                                        )}
                                        {item.can_borrow && item.borrow_url && (
                                            <Button size="sm" asChild>
                                                <Link href={item.borrow_url}>
                                                    <FileText className="mr-1.5 h-3.5 w-3.5" />
                                                    Pinjam
                                                </Link>
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <DataPagination
                currentPage={safePage}
                lastPage={lastPage}
                from={from}
                to={to}
                total={total}
                onPageChange={setPage}
            />
        </div>
    );
}
