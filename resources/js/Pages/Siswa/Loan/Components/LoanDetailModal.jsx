import LoanStatusBadge from "@/Components/LoanStatusBadge";
import CollateralStatusBadge from "@/Components/CollateralStatusBadge";
import { cn } from "@/lib/utils";
import {
    AlertCircle,
    Calendar,
    Clock,
    FileText,
    MapPin,
    Package,
    User,
    Wrench,
    X,
} from "lucide-react";

export default function LoanDetailModal({ loan, borrower, onClose, footer }) {
    if (!loan) return null;

    const isBahan = loan.item_type === "bahan";
    const items = loan.items ?? [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-foreground/50 p-4">
            <div className="my-8 w-full max-w-lg animate-scale-in rounded-lg border bg-card p-6 shadow-lg">
                <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-foreground">
                        Detail{" "}
                        {isBahan
                            ? "Pengambilan Bahan"
                            : "Peminjaman Alat"}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-[8px] p-1 hover:bg-secondary"
                    >
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={cn(
                                "inline-flex rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                                isBahan
                                    ? "bg-warning/15 text-warning"
                                    : "bg-primary/15 text-primary",
                            )}
                        >
                            {isBahan ? "Bahan" : "Alat"}
                        </span>
                        <LoanStatusBadge
                            status={loan.status}
                            itemType={loan.item_type}
                        />
                        {!isBahan && (loan.queue_type_label || loan.borrow_scope_label) && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {loan.queue_type_label || loan.borrow_scope_label}
                            </span>
                        )}
                        {loan.collateral_status && (
                            <CollateralStatusBadge
                                status={loan.collateral_status}
                            />
                        )}
                    </div>

                    <div className="rounded-lg border bg-muted/50 p-4">
                        <p className="mb-2 text-xs font-medium text-muted-foreground">
                            {loan.code}
                        </p>
                        {items.length > 0 ? (
                            <ul className="space-y-2">
                                {items.map((item) => (
                                    <li
                                        key={item.id}
                                        className="flex items-center gap-3"
                                    >
                                        <div
                                            className={cn(
                                                "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg",
                                                isBahan
                                                    ? "bg-warning/10"
                                                    : "bg-primary/10",
                                            )}
                                        >
                                            {isBahan ? (
                                                <Package className="h-5 w-5 text-warning" />
                                            ) : (
                                                <Wrench className="h-5 w-5 text-primary" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">
                                                {item.equipment_name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {item.quantity}{" "}
                                                {item.unit ?? "unit"}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                {loan.items_summary}
                            </p>
                        )}
                    </div>

                    <div className="rounded-lg border bg-muted/50 p-4">
                        <div className="mb-2 flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                                Peminjam & Pembimbing
                            </span>
                        </div>
                        <div className="ml-6 space-y-1 text-sm">
                            <p>
                                <span className="text-muted-foreground">
                                    Nama:
                                </span>{" "}
                                {borrower?.name ?? "—"}
                            </p>
                            {borrower?.class && (
                                <p>
                                    <span className="text-muted-foreground">
                                        Kelas:
                                    </span>{" "}
                                    {borrower.class}
                                </p>
                            )}
                            {loan.supervisor_name && (
                                <p>
                                    <span className="text-muted-foreground">
                                        Guru Pembimbing:
                                    </span>{" "}
                                    {loan.supervisor_name}
                                </p>
                            )}
                        </div>
                    </div>

                    {!isBahan && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="rounded-lg border bg-muted/50 p-3">
                                <div className="mb-1 flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                        Tanggal booking
                                    </span>
                                </div>
                                <p className="text-sm font-medium">
                                    {loan.request_date_formatted || "—"}
                                </p>
                            </div>
                            <div className="rounded-lg border bg-muted/50 p-3">
                                <div className="mb-1 flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                        {loan.slot_field_label ||
                                            (loan.slot_label
                                                ? "Slot"
                                                : "Batas kembali")}
                                    </span>
                                </div>
                                <p className="text-sm font-medium">
                                    {loan.slot_label || loan.due_at_formatted}
                                </p>
                                {loan.slot_hint ? (
                                    <p className="mt-1 text-xs leading-snug text-muted-foreground">
                                        {loan.slot_hint}
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    )}

                    {(loan.purpose || loan.notes) && (
                        <div className="rounded-lg border bg-muted/50 p-4">
                            <div className="mb-1 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                    Catatan / Keperluan
                                </span>
                            </div>
                            <p className="ml-6 whitespace-pre-line text-sm text-muted-foreground">
                                {loan.notes || loan.purpose}
                            </p>
                        </div>
                    )}

                    {loan.rejection_reason && (
                        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-4">
                            <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
                            <div>
                                <p className="text-sm font-medium text-destructive">
                                    Alasan Penolakan
                                </p>
                                <p className="text-sm text-destructive/80">
                                    {loan.rejection_reason}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {footer ? (
                    <div className="mt-4 border-t border-border pt-4">
                        {footer}
                    </div>
                ) : (
                    <div className="mt-4 border-t border-border pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-outline w-full"
                        >
                            Tutup
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
