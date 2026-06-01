import LoanStatusBadge from "@/Components/LoanStatusBadge";
import StudentLoanTableActions from "./StudentLoanTableActions";

export default function StudentLoanTable({
    items,
    onCancel,
    onRequestReturn,
}) {
    if (!items?.length) return null;

    return (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                    <thead className="sticky top-0 z-10 border-b border-border bg-muted/50 backdrop-blur">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                No. Peminjaman
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Item
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Jenis
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Tgl Pengajuan
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Tgl Pinjam
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Tgl Kembali
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Jumlah Item
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
                        {items.map((loan) => (
                            <tr
                                key={loan.id}
                                className="transition-colors hover:bg-muted/30"
                            >
                                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                    {loan.code}
                                </td>
                                <td className="max-w-[200px] px-4 py-3">
                                    <p className="line-clamp-2 text-muted-foreground">
                                        {loan.items_summary}
                                    </p>
                                </td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
                                            loan.item_type === "alat"
                                                ? "border-violet-500/20 bg-violet-500/10 text-violet-700"
                                                : "border-amber-500/20 bg-amber-500/10 text-amber-800"
                                        }`}
                                    >
                                        {loan.item_type_label}
                                    </span>
                                </td>
                                <td className="whitespace-nowrap px-4 py-3">
                                    {loan.request_date_formatted}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                                    {loan.borrowed_at_formatted}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                                    {loan.item_type === "alat"
                                        ? loan.returned_at_formatted
                                        : "—"}
                                </td>
                                <td className="px-4 py-3 text-center tabular-nums">
                                    {loan.items_count}
                                </td>
                                <td className="px-4 py-3">
                                    <LoanStatusBadge status={loan.status} />
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                                    {loan.created_at_formatted}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <StudentLoanTableActions
                                        loan={loan}
                                        onCancel={onCancel}
                                        onRequestReturn={onRequestReturn}
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
