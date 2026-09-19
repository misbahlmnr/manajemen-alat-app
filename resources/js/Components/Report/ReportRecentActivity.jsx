import LoanStatusBadge from "@/Components/LoanStatusBadge";

const adminHeaders = [
    "Submission",
    "Nama Siswa",
    "Jenis",
    "Status",
    "Tanggal",
];

const guruHeaders = [
    "Submission",
    "Nama Siswa",
    "Kelas",
    "Jumlah Barang",
    "Status Paket",
    "Tanggal",
];

export default function ReportRecentActivity({
    items = [],
    isGuruScope = false,
}) {
    const headers = isGuruScope ? guruHeaders : adminHeaders;
    const emptyLabel = isGuruScope
        ? "Belum ada aktivitas pada periode ini."
        : "Belum ada aktivitas pada periode ini.";

    return (
        <section className="space-y-3">
            <div>
                <h3 className="text-base font-semibold text-foreground">
                    Aktivitas Terbaru
                </h3>
                <p className="text-sm text-muted-foreground">
                    {isGuruScope
                        ? "5 pengajuan terakhir pada periode yang dipilih."
                        : "5 pengajuan terakhir pada periode filter."}
                </p>
            </div>
            <div className="overflow-hidden rounded-[10px] border border-border/60 bg-card shadow-sm">
                {items.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">
                        {emptyLabel}
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px]">
                            <thead className="bg-muted/40">
                                <tr>
                                    {headers.map((header) => (
                                        <th
                                            key={header}
                                            className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {items.map((row) =>
                                    isGuruScope ? (
                                        <tr
                                            key={row.id ?? row.submission_code}
                                            className="hover:bg-muted/30"
                                        >
                                            <td className="px-4 py-3 text-sm font-medium">
                                                {row.submission_code}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {row.borrower_name}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                                {row.borrower_class ?? "—"}
                                            </td>
                                            <td className="px-4 py-3 text-sm tabular-nums">
                                                {row.items_count ?? 0}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <LoanStatusBadge
                                                    status={row.status}
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                                {row.date_formatted}
                                            </td>
                                        </tr>
                                    ) : (
                                        <tr
                                            key={row.id}
                                            className="hover:bg-muted/30"
                                        >
                                            <td className="px-4 py-3 text-sm font-medium">
                                                {row.submission_code}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {row.borrower_name}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {row.item_type_label}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <LoanStatusBadge
                                                    status={row.status}
                                                    itemType={row.item_type}
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                                {row.date_formatted}
                                            </td>
                                        </tr>
                                    ),
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    );
}
