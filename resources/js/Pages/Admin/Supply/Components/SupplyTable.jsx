import StatusBadge from "@/Components/StatusBadge";
import TableRowActions from "@/Components/TableRowActions";
import { cn } from "@/lib/utils";

export default function SupplyTable({ items, onDelete }) {
    if (!items?.length) return null;

    return (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-sm">
                    <thead className="sticky top-0 z-10 border-b border-border bg-muted/50 backdrop-blur">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Kode
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Nama Bahan
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Kategori
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Stok
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Satuan
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Status
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Dibuat
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                                Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {items.map((item) => (
                            <tr
                                key={item.id}
                                className="transition-colors hover:bg-muted/30"
                            >
                                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                    {item.code}
                                </td>
                                <td className="px-4 py-3">
                                    <p className="font-medium text-foreground">
                                        {item.name}
                                    </p>
                                    {item.is_low_stock && (
                                        <p className="text-xs text-warning">
                                            Stok menipis
                                        </p>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {item.category}
                                </td>
                                <td className="px-4 py-3">
                                    <span
                                        className={cn(
                                            "font-medium tabular-nums",
                                            item.is_low_stock &&
                                                "text-warning",
                                        )}
                                    >
                                        {item.available}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {" "}
                                        / {item.stock}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {item.unit}
                                </td>
                                <td className="px-4 py-3">
                                    <StatusBadge status={item.status} />
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {item.created_at_formatted}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <TableRowActions
                                        showHref={route(
                                            "admin.supplies.show",
                                            item.id,
                                        )}
                                        editHref={route(
                                            "admin.supplies.edit",
                                            item.id,
                                        )}
                                        onDelete={() => onDelete(item)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
