import LoanStatusBadge from "@/Components/LoanStatusBadge";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { cn } from "@/lib/utils";
import { Link, router } from "@inertiajs/react";
import {
    Check,
    Clock,
    CreditCard,
    Eye,
    PackageCheck,
    RotateCcw,
    SearchCheck,
    X,
} from "lucide-react";

const LOAN_TYPE_BADGE = {
    praktikum: {
        label: "Praktik Lab",
        variant: "info",
    },
    pribadi: {
        label: "Pribadi",
        variant: "secondary",
    },
    bawa_pulang: {
        label: "Bawa Pulang",
        variant: "warning",
    },
    lomba: {
        label: "Lomba",
        variant: "default",
    },
};

function LoanTypeBadge({ loan }) {
    if (loan.item_type === "bahan") {
        return (
            <Badge variant="muted" className="font-semibold">
                Bahan
            </Badge>
        );
    }

    const key = loan.loan_type || loan.queue_type_key;
    const config = LOAN_TYPE_BADGE[key] ?? {
        label: loan.loan_type_label || loan.queue_type_label || "Alat",
        variant: "secondary",
    };

    return (
        <Badge variant={config.variant} className="font-semibold">
            {config.label}
        </Badge>
    );
}

function ItemPreview({ loan }) {
    const items = loan.items ?? [];
    const total = items.length;

    if (total === 0) {
        return (
            <p className="text-sm font-semibold text-foreground">
                {loan.items_summary || "—"}
            </p>
        );
    }

    const visible = items.slice(0, 2);
    const rest = total - visible.length;

    return (
        <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
                {total} item
            </p>
            <ul className="space-y-0.5">
                {visible.map((item) => (
                    <li
                        key={item.id ?? item.equipment_id}
                        className="text-sm font-semibold text-foreground"
                    >
                        {item.equipment_name ?? "Item"}
                        {item.quantity > 1 ? (
                            <span className="font-medium text-muted-foreground">
                                {" "}
                                ×{item.quantity}
                            </span>
                        ) : null}
                    </li>
                ))}
                {rest > 0 ? (
                    <li className="text-xs text-muted-foreground">
                        +{rest} item lainnya
                    </li>
                ) : null}
            </ul>
        </div>
    );
}

function ScheduleLine({ loan, bookingDate }) {
    const slot = loan.slot_label;
    const schedule = loan.schedule_title;
    const field = loan.slot_field_label;

    if (!bookingDate && !slot && !schedule) {
        return null;
    }

    const timeLine = slot
        ? `${field ? `${field}: ` : ""}${slot}${schedule ? ` · ${schedule}` : ""}`
        : schedule || null;

    return (
        <div className="flex gap-1.5 text-xs text-muted-foreground">
            <Clock className="mt-0.5 h-3 w-3 shrink-0" />
            <div className="min-w-0 space-y-0.5">
                {bookingDate ? (
                    <p>
                        <span className="font-medium text-foreground/80">
                            Booking
                        </span>{" "}
                        {bookingDate}
                    </p>
                ) : null}
                {timeLine ? <p>{timeLine}</p> : null}
            </div>
        </div>
    );
}

function InsightChips({ loan }) {
    const chips = [];

    if (loan.status === "antrian") {
        chips.push({
            key: "queue",
            label: loan.queue_position
                ? `Antrean #${loan.queue_position}`
                : "Dalam antrean",
            className: "bg-amber-50 text-amber-800",
        });
        if (loan.queue_waiting_stock || loan.queue_status_label) {
            chips.push({
                key: "wait",
                label: loan.queue_status_label || "Menunggu stok kembali",
                className: "bg-amber-50/80 text-amber-800",
            });
        }
    }

    if (loan.requires_collateral) {
        if (loan.can_receive_card) {
            chips.push({
                key: "card",
                label: "Perlu terima jaminan kartu",
                className: "bg-sky-50 text-sky-800",
            });
        } else if (loan.collateral_status === "ditahan") {
            chips.push({
                key: "held",
                label: "Kartu ditahan",
                className: "bg-muted text-muted-foreground",
            });
        } else if (loan.status === "diminta" || loan.status === "disetujui") {
            chips.push({
                key: "need-card",
                label: "Butuh jaminan kartu",
                className: "bg-sky-50 text-sky-800",
            });
        }
    }

    if (
        loan.status === "disetujui" &&
        loan.item_type === "alat" &&
        (loan.loan_type === "bawa_pulang" || loan.loan_type === "lomba")
    ) {
        chips.push({
            key: "reserve",
            label: "Reservasi stok",
            className: "bg-emerald-50 text-emerald-800",
        });
    }

    if (loan.mark_borrowed_blocked_reason) {
        chips.push({
            key: "blocked",
            label: loan.mark_borrowed_blocked_reason,
            className: "bg-amber-50 text-amber-900",
        });
    }

    // Max 3 chips agar tidak ramai
    const visible = chips.slice(0, 3);
    if (visible.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap gap-1.5">
            {visible.map((chip) => (
                <span
                    key={chip.key}
                    className={cn(
                        "inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium",
                        chip.className,
                    )}
                >
                    {chip.label}
                </span>
            ))}
        </div>
    );
}

function LoanActions({ loan, onReject, onReturn, onInspect }) {
    const isBahan = loan.item_type === "bahan";
    const post = (routeName) => {
        router.post(route(routeName, loan.id), {}, { preserveScroll: true });
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            {loan.can_approve && (
                <Button
                    size="sm"
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => post("admin.loans.approve")}
                >
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                    Setujui
                </Button>
            )}
            <Button size="sm" variant="outline" asChild>
                <Link href={route("admin.loans.show", loan.id)}>
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    Detail
                </Link>
            </Button>
            {loan.can_reject && (
                <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive/25 bg-destructive/5 text-destructive hover:bg-destructive/10"
                    onClick={() => onReject(loan)}
                >
                    <X className="mr-1.5 h-3.5 w-3.5" />
                    Tolak
                </Button>
            )}
            {loan.can_mark_borrowed && (
                <Button size="sm" onClick={() => post("admin.loans.mark-borrowed")}>
                    <PackageCheck className="mr-1.5 h-3.5 w-3.5" />
                    {isBahan ? "Tandai diambil" : "Serahkan"}
                </Button>
            )}
            {loan.can_receive_card && (
                <Button size="sm" variant="outline" asChild>
                    <Link href={route("admin.loans.show", loan.id)}>
                        <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                        Terima kartu
                    </Link>
                </Button>
            )}
            {loan.can_inspect && (
                <Button size="sm" onClick={() => onInspect(loan)}>
                    <SearchCheck className="mr-1.5 h-3.5 w-3.5" />
                    Inspeksi
                </Button>
            )}
            {loan.can_return && (
                <Button size="sm" variant="outline" onClick={() => onReturn(loan)}>
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    Ajukan inspeksi
                </Button>
            )}
        </div>
    );
}

function MemberBlock({
    loan,
    bookingDate,
    showStatus,
    onReject,
    onReturn,
    onInspect,
}) {
    return (
        <div className="space-y-3 rounded-[8px] border border-border/60 bg-muted/20 p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-1.5">
                <LoanTypeBadge loan={loan} />
                {showStatus ? (
                    <LoanStatusBadge
                        status={loan.status}
                        itemType={loan.item_type}
                    />
                ) : null}
            </div>

            <ScheduleLine loan={loan} bookingDate={bookingDate} />
            <InsightChips loan={loan} />
            <ItemPreview loan={loan} />
            <LoanActions
                loan={loan}
                onReject={onReject}
                onReturn={onReturn}
                onInspect={onInspect}
            />
        </div>
    );
}

export default function LoanWorkCard({
    submission,
    onReject,
    onReturn,
    onInspect,
}) {
    const members = (submission.package_members ?? []).filter(Boolean);
    const isUrgent = members.some(
        (loan) => loan.status === "terlambat" || loan.is_overdue,
    );
    const statuses = new Set(members.map((loan) => loan.status));
    const mixedStatus = statuses.size > 1;
    const bookingDate = submission.request_date_formatted || null;

    return (
        <article
            className={cn(
                "overflow-hidden rounded-[10px] border bg-card shadow-card",
                isUrgent
                    ? "border-destructive/30 ring-1 ring-destructive/10"
                    : "border-border/60",
            )}
        >
            <div className="border-b bg-muted/30 px-4 py-3 sm:px-5">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href={
                                submission.show_url ||
                                route("admin.loans.submission", submission.code)
                            }
                            className="font-mono text-sm font-semibold text-primary hover:underline"
                        >
                            {submission.code}
                        </Link>
                        <LoanStatusBadge
                            status={submission.status}
                            itemType="submission"
                        />
                    </div>
                    <p className="mt-1 font-medium text-foreground">
                        {submission.borrower_name}
                        {submission.borrower_class ? (
                            <span className="font-normal text-muted-foreground">
                                {" "}
                                · {submission.borrower_class}
                            </span>
                        ) : null}
                    </p>
                    {submission.supervisor_name ? (
                        <p className="text-xs text-muted-foreground">
                            Guru: {submission.supervisor_name}
                        </p>
                    ) : null}
                </div>
            </div>
            <div className="space-y-3 p-4 sm:p-5">
                {members.length > 0 ? (
                    members.map((loan) => (
                        <MemberBlock
                            key={loan.id}
                            loan={loan}
                            bookingDate={bookingDate}
                            showStatus={
                                mixedStatus || loan.status !== submission.status
                            }
                            onReject={onReject}
                            onReturn={onReturn}
                            onInspect={onInspect}
                        />
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Tidak ada item pada pengajuan ini.
                    </p>
                )}
            </div>
        </article>
    );
}
