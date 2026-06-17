import LoanStatusBadge from "@/Components/LoanStatusBadge";
import EquipmentImage from "@/Components/Equipment/EquipmentImage";
import { Button } from "@/Components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "@inertiajs/react";
import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    Clock,
    MapPin,
    User,
} from "lucide-react";
import {
    getLoanRemaining,
    shouldShowLoanDueCountdown,
} from "@/lib/loanRemaining";
import StudentLoanTableActions from "./StudentLoanTableActions";

const MAX_VISIBLE_ITEMS = 3;

function DueCountdown({ loan, isHistory }) {
    if (!shouldShowLoanDueCountdown(loan, isHistory)) return null;

    const remaining = getLoanRemaining(loan.due_at_iso);
    if (remaining === null) return null;

    const isOverdue = remaining.overdue;
    const isUrgent = !isOverdue && remaining.value <= 2;

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                isOverdue
                    ? "bg-destructive/10 text-destructive"
                    : isUrgent
                      ? "bg-warning/10 text-warning"
                      : "bg-success/10 text-success",
            )}
        >
            {isOverdue ? (
                <AlertTriangle className="h-3.5 w-3.5" />
            ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            {isOverdue
                ? `Terlambat ${remaining.value} ${remaining.unit}`
                : `${remaining.value} ${remaining.unit} lagi`}
        </span>
    );
}

export default function StudentLoanCard({
    loan,
    isHistory = false,
    onCancel,
    onRequestReturn,
}) {
    const isBahan = loan.item_type === "bahan";
    const items = loan.items ?? [];
    const visibleItems = items.slice(0, MAX_VISIBLE_ITEMS);
    const hiddenCount = items.length - visibleItems.length;
    const isTerlambat = loan.status === "terlambat" || loan.is_overdue;
    const previewItem = items[0];

    return (
        <article
            className={cn(
                "overflow-hidden rounded-2xl border bg-card shadow-card transition-shadow hover:shadow-md",
                isTerlambat
                    ? "border-destructive/30 ring-1 ring-destructive/10"
                    : "border-border/60",
            )}
        >
            <div className="flex flex-col gap-3 border-b border-border/60 bg-muted/20 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-5">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                    <EquipmentImage
                        imageUrl={previewItem?.image_url}
                        name={previewItem?.equipment_name ?? loan.code}
                        itemType={loan.item_type}
                        className="h-11 w-11 shrink-0 rounded-xl border border-border/60"
                        iconClassName="h-5 w-5"
                    />
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href={route("siswa.loans.show", loan.id)}
                                className="font-mono text-sm font-semibold text-primary hover:underline"
                            >
                                {loan.code}
                            </Link>
                            <span
                                className={cn(
                                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                                    isBahan
                                        ? "bg-warning/15 text-warning"
                                        : "bg-primary/15 text-primary",
                                )}
                            >
                                {loan.item_type_label}
                            </span>
                            <LoanStatusBadge
                                status={loan.status}
                                itemType={loan.item_type}
                            />
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Diajukan {loan.request_date_formatted}
                            {!isBahan && loan.borrow_scope_label && (
                                <>
                                    {" "}
                                    ·{" "}
                                    <MapPin className="mr-0.5 inline h-3 w-3" />
                                    {loan.borrow_scope_label}
                                </>
                            )}
                        </p>
                    </div>
                </div>
                <div className="flex shrink-0 self-stretch sm:self-auto">
                    <StudentLoanTableActions
                        loan={loan}
                        onCancel={onCancel}
                        onRequestReturn={onRequestReturn}
                    />
                </div>
            </div>

            <div className="space-y-4 px-4 py-4 sm:px-5">
                <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {isBahan ? "Bahan diambil" : "Barang dipinjam"}
                        <span className="ml-1 font-normal normal-case text-muted-foreground/80">
                            ({loan.items_count} jenis · {loan.total_quantity}{" "}
                            unit)
                        </span>
                    </p>
                    {items.length > 0 ? (
                        <ul className="space-y-1.5">
                            {visibleItems.map((item) => (
                                <li
                                    key={item.id ?? item.equipment_id}
                                    className="flex items-center gap-3 rounded-lg bg-secondary/40 px-3 py-2 text-sm"
                                >
                                    <EquipmentImage
                                        imageUrl={item.image_url}
                                        name={item.equipment_name ?? "Barang"}
                                        itemType={loan.item_type}
                                        className="h-9 w-9 shrink-0 rounded-lg border border-border/40"
                                        iconClassName="h-3.5 w-3.5"
                                    />
                                    <span className="min-w-0 flex-1 font-medium text-foreground">
                                        {item.equipment_name ?? "Barang"}
                                        {item.equipment_code && (
                                            <span className="ml-1.5 font-mono text-xs font-normal text-muted-foreground">
                                                {item.equipment_code}
                                            </span>
                                        )}
                                    </span>
                                    <span className="shrink-0 tabular-nums text-muted-foreground">
                                        ×{item.quantity}{" "}
                                        {item.unit ?? "unit"}
                                    </span>
                                </li>
                            ))}
                            {hiddenCount > 0 && (
                                <li className="px-3 text-xs text-muted-foreground">
                                    +{hiddenCount} barang lainnya —{" "}
                                    <Link
                                        href={route(
                                            "siswa.loans.show",
                                            loan.id,
                                        )}
                                        className="font-medium text-primary hover:underline"
                                    >
                                        lihat detail
                                    </Link>
                                </li>
                            )}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            {loan.items_summary}
                        </p>
                    )}
                </div>

                {loan.purpose && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                            Keperluan:{" "}
                        </span>
                        {loan.notes?.trim() || loan.purpose}
                    </p>
                )}

                {isHistory && loan.status === "ditolak" && loan.rejection_reason && (
                    <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                        Alasan ditolak: {loan.rejection_reason}
                    </p>
                )}

                <div className="flex flex-col gap-3 border-t border-border/60 pt-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {loan.supervisor_name ?? "—"}
                        </span>
                        {!isHistory && loan.item_type === "alat" && loan.due_at_formatted !== "—" && (
                            <span className="inline-flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                Batas: {loan.due_at_formatted}
                            </span>
                        )}
                        {isHistory && (
                            <span className="inline-flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {isBahan && loan.status === "dipinjam"
                                    ? `Diambil: ${loan.borrowed_at_formatted}`
                                    : `Selesai: ${
                                          loan.returned_at_formatted !== "—"
                                              ? loan.returned_at_formatted
                                              : loan.created_at_formatted
                                      }`}
                            </span>
                        )}
                    </div>
                    {!isHistory && (
                        <DueCountdown loan={loan} isHistory={isHistory} />
                    )}
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={route("siswa.loans.show", loan.id)}>
                            Lihat detail
                        </Link>
                    </Button>
                    {loan.can_edit && (
                        <Button variant="outline" size="sm" asChild>
                            <Link href={route("siswa.loans.edit", loan.id)}>
                                Ubah
                            </Link>
                        </Button>
                    )}
                    {loan.can_request_return && (
                        <Button
                            size="sm"
                            onClick={() => onRequestReturn(loan)}
                        >
                            Ajukan pengembalian
                        </Button>
                    )}
                </div>
            </div>
        </article>
    );
}
