import SchedulePriorityBadge from "@/Components/SchedulePriorityBadge";
import ScheduleStatusBadge from "@/Components/ScheduleStatusBadge";
import TableRowActions from "@/Components/TableRowActions";

export default function ScheduleTable({ items, onDelete }) {
    if (!items?.length) return null;

    return (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-sm">
                    <thead className="sticky top-0 z-10 border-b border-border bg-muted/50 backdrop-blur">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Kode
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Mata Pelajaran
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Guru
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Kelas
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Tanggal
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Waktu
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Ruang
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Prioritas
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
                                        {item.mata_kuliah}
                                    </p>
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                        {item.title}
                                    </p>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {item.guru_name}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {item.kelas}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    {item.tanggal_formatted}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                                    {item.waktu_label}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {item.ruangan || "—"}
                                </td>
                                <td className="px-4 py-3">
                                    <SchedulePriorityBadge
                                        priority={item.priority}
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <ScheduleStatusBadge
                                        status={item.status}
                                        displayStatus={item.display_status}
                                    />
                                </td>
                                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                                    {item.created_at_formatted}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <TableRowActions
                                        showHref={route(
                                            "admin.schedules.show",
                                            item.id,
                                        )}
                                        editHref={route(
                                            "admin.schedules.edit",
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
