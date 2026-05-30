import CollateralStatusBadge from "@/Components/CollateralStatusBadge";
import CollateralTableActions from "./CollateralTableActions";

export default function CollateralTable({ items, onDelete, onInspect }) {
    if (!items?.length) return null;

    return (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-sm">
                    <thead className="sticky top-0 z-10 border-b border-border bg-muted/50 backdrop-blur">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                No. Jaminan
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Siswa
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Jenis Kartu
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                No. Kartu
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Peminjaman
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Dititipkan
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Diambil Kembali
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
                                        {item.student_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {item.student_class}
                                    </p>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {item.card_type_label}
                                </td>
                                <td className="px-4 py-3 font-mono text-xs">
                                    {item.card_number || item.student_nisn || "—"}
                                </td>
                                <td className="px-4 py-3">
                                    <p className="font-mono text-xs">
                                        {item.loan_code}
                                    </p>
                                    <p className="line-clamp-1 text-xs text-muted-foreground">
                                        {item.equipment_summary}
                                    </p>
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                                    {item.held_at_formatted}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                                    {item.returned_at_formatted}
                                </td>
                                <td className="px-4 py-3">
                                    <CollateralStatusBadge status={item.status} />
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                                    {item.created_at_formatted}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <CollateralTableActions
                                        item={item}
                                        onDelete={onDelete}
                                        onInspect={onInspect}
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
