import LoanStatusBadge from "@/Components/LoanStatusBadge";
import CollateralStatusBadge from "@/Components/CollateralStatusBadge";
import { cn } from "@/lib/utils";
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    Clock,
    FileText,
    MapPin,
    Package,
    User,
    Wrench,
    X,
} from "lucide-react";

const timelineSteps = [
    { key: "diminta", label: "Diminta" },
    { key: "disetujui", label: "Disetujui" },
    { key: "dipinjam", label: "Dipinjam" },
    { key: "dikembalikan", label: "Dikembalikan" },
];

const statusOrder = {
    diminta: 0,
    ditolak: 0,
    disetujui: 1,
    dipinjam: 2,
    terlambat: 2,
    dikembalikan: 3,
};

export default function LoanDetailModal({ loan, borrower, onClose, footer }) {
    if (!loan) return null;

    const isBahan = loan.item_type === "bahan";
    const currentStep = statusOrder[loan.status] ?? 0;
    const items = loan.items ?? [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-foreground/50 p-4">
            <div className="my-8 w-full max-w-lg animate-scale-in rounded-2xl bg-card p-6">
                <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-foreground">
                        Detail {isBahan ? "Pengambilan Bahan" : "Peminjaman"}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1 hover:bg-secondary"
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
                        {!isBahan && loan.borrow_scope && (
                            <span className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground">
                                <MapPin className="h-3 w-3" />
                                {loan.borrow_scope_label}
                            </span>
                        )}
                        {loan.collateral_status && (
                            <CollateralStatusBadge
                                status={loan.collateral_status}
                            />
                        )}
                    </div>

                    <div className="rounded-lg bg-secondary/50 p-4">
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

                    <div className="rounded-lg bg-secondary/50 p-4">
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
                            <div className="rounded-lg bg-secondary/50 p-3">
                                <div className="mb-1 flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                        Pinjam
                                    </span>
                                </div>
                                <p className="text-sm font-medium">
                                    {loan.borrowed_at_formatted !== "—"
                                        ? loan.borrowed_at_formatted
                                        : loan.request_date_formatted}
                                </p>
                            </div>
                            <div className="rounded-lg bg-secondary/50 p-3">
                                <div className="mb-1 flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                        Batas Kembali
                                    </span>
                                </div>
                                <p className="text-sm font-medium">
                                    {loan.due_at_formatted}
                                </p>
                            </div>
                        </div>
                    )}

                    {(loan.purpose || loan.notes) && (
                        <div className="rounded-lg bg-secondary/50 p-4">
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

                    {!isBahan && (
                        <div>
                            <p className="mb-3 text-sm font-medium">
                                Timeline Status
                            </p>
                            <div className="space-y-2">
                                {timelineSteps.map((step, idx) => {
                                    const active = currentStep >= idx;
                                    const isLate =
                                        loan.status === "terlambat" &&
                                        step.key === "dipinjam";
                                    return (
                                        <div
                                            key={step.key}
                                            className="flex items-center gap-3"
                                        >
                                            <div
                                                className={cn(
                                                    "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                                                    isLate
                                                        ? "bg-destructive text-destructive-foreground"
                                                        : active
                                                          ? "bg-success text-success-foreground"
                                                          : "bg-secondary text-muted-foreground",
                                                )}
                                            >
                                                {active ? (
                                                    <CheckCircle2 className="h-4 w-4" />
                                                ) : (
                                                    idx + 1
                                                )}
                                            </div>
                                            <span
                                                className={cn(
                                                    "text-sm",
                                                    active
                                                        ? "text-foreground"
                                                        : "text-muted-foreground",
                                                )}
                                            >
                                                {isLate
                                                    ? "Terlambat"
                                                    : step.label}
                                            </span>
                                        </div>
                                    );
                                })}
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
