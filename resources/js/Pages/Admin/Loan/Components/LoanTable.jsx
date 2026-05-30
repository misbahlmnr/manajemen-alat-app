import LoanStatusBadge from "@/Components/LoanStatusBadge";
import LoanTableActions from "./LoanTableActions";

export default function LoanTable({ items, onDelete, onReject, onReturn }) {
    if (!items?.length) return null;

    return (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-sm">
                    <thead className="sticky top-0 z-10 border-b border-border bg-muted/50 backdrop-blur">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Kode
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Peminjam
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Item
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Jenis
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Guru
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Tanggal
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Batas Kembali
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
                                <td className="px-4 py-3">
                                    <p className="font-medium text-foreground">
                                        {loan.borrower_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {loan.borrower_class || loan.borrower_role}
                                    </p>
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
                                <td className="px-4 py-3 text-muted-foreground">
                                    {loan.supervisor_name}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3">
                                    {loan.request_date_formatted}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                                    {loan.item_type === "alat"
                                        ? loan.due_at_formatted
                                        : "—"}
                                </td>
                                <td className="px-4 py-3">
                                    <LoanStatusBadge status={loan.status} />
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                                    {loan.created_at_formatted}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <LoanTableActions
                                        loan={loan}
                                        onDelete={onDelete}
                                        onReject={onReject}
                                        onReturn={onReturn}
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
