import LoanStatusBadge from "@/Components/LoanStatusBadge";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { cn } from "@/lib/utils";
import { Link, router } from "@inertiajs/react";
import {
    BookOpen,
    Calendar,
    Check,
    Clock,
    CreditCard,
    Eye,
    Package,
    PackageCheck,
    SearchCheck,
    X,
} from "lucide-react";

const LOAN_TYPE_STYLE = {
    praktikum: { label: "Praktik Lab", className: "bg-sky-50 text-sky-700" },
    pribadi: { label: "Pribadi", className: "bg-muted text-muted-foreground" },
    bawa_pulang: {
        label: "Bawa Pulang",
        className: "bg-amber-50 text-amber-800",
    },
    lomba: { label: "Lomba", className: "bg-primary/10 text-primary" },
};

function TypeChip({ loan }) {
    if (!loan) return null;

    if (loan.item_type === "bahan") {
        return (
            <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide bg-muted text-muted-foreground">
                Bahan
            </span>
        );
    }

    const key = loan.loan_type || loan.queue_type_key;
    const config = LOAN_TYPE_STYLE[key] ?? {
        label: loan.loan_type_label || "Alat",
        className: "bg-muted text-muted-foreground",
    };

    return (
        <span
            className={cn(
                "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                config.className,
            )}
        >
            {config.label}
        </span>
    );
}

function collectItems(members) {
    const rows = [];
    for (const loan of members) {
        const items = loan.items ?? [];
        if (items.length === 0 && loan.items_summary && loan.items_summary !== "—") {
            rows.push({
                key: `${loan.id}-summary`,
                name: loan.items_summary,
                quantity: null,
            });
            continue;
        }
        for (const item of items) {
            rows.push({
                key: `${loan.id}-${item.id ?? item.equipment_id}`,
                name: item.equipment_name ?? "Item",
                quantity: item.quantity,
            });
        }
    }
    return rows;
}

function ItemList({ members }) {
    const rows = collectItems(members);
    if (rows.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">Tidak ada item.</p>
        );
    }

    const visible = rows.slice(0, 3);
    const rest = rows.length - visible.length;

    return (
        <ul className="space-y-0.5">
            {visible.map((row) => (
                <li
                    key={row.key}
                    className="flex items-baseline gap-1.5 text-[15px] font-semibold leading-snug text-foreground"
                >
                    <Package className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span>
                        {row.name}
                        {row.quantity != null ? (
                            <span className="font-medium text-muted-foreground">
                                {" "}
                                ×{row.quantity}
                            </span>
                        ) : null}
                    </span>
                </li>
            ))}
            {rest > 0 ? (
                <li className="pl-5 text-xs text-muted-foreground">
                    +{rest} item lainnya
                </li>
            ) : null}
        </ul>
    );
}

function MetaLines({ members, bookingDate }) {
    const alat = members.find((m) => m.item_type === "alat") ?? members[0];
    const slot = alat?.slot_label;
    const schedule = alat?.schedule_title;
    const isTakeHome =
        alat?.loan_type === "bawa_pulang" || alat?.loan_type === "lomba";

    const lines = [];

    if (bookingDate) {
        lines.push({
            key: "date",
            icon: Calendar,
            text: bookingDate,
        });
    }

    if (slot) {
        lines.push({
            key: "slot",
            icon: Clock,
            text: slot,
        });
    } else if (isTakeHome && alat?.due_at_formatted && alat.due_at_formatted !== "—") {
        lines.push({
            key: "due",
            icon: Calendar,
            text: `Kembali ${alat.due_at_formatted}`,
        });
    }

    if (schedule) {
        lines.push({
            key: "schedule",
            icon: BookOpen,
            text: schedule,
        });
    }

    if (lines.length === 0) return null;

    return (
        <div className="space-y-0.5">
            {lines.map(({ key, icon: Icon, text }) => (
                <p
                    key={key}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                    <Icon className="h-3 w-3 shrink-0" />
                    <span className="truncate">{text}</span>
                </p>
            ))}
        </div>
    );
}

function InsightLine({ members }) {
    const parts = [];

    for (const loan of members) {
        if (loan.status === "antrian" && loan.queue_position) {
            parts.push(`Antrean #${loan.queue_position}`);
        } else if (loan.status === "antrian") {
            parts.push("Dalam antrean");
        }
        if (loan.status === "menunggu_alat") {
            parts.push("Menunggu Alat");
        }
        if (loan.queue_waiting_stock) {
            parts.push(loan.queue_status_label || "Menunggu stok");
        }
        if (loan.requires_collateral && loan.can_receive_card) {
            parts.push("Perlu terima jaminan kartu");
        } else if (
            loan.requires_collateral &&
            (loan.status === "diminta" || loan.status === "disetujui") &&
            loan.collateral_status !== "ditahan"
        ) {
            parts.push("Jaminan kartu pelajar");
        }
        if (loan.mark_borrowed_blocked_reason) {
            parts.push(loan.mark_borrowed_blocked_reason);
        }
    }

    const unique = [...new Set(parts)].slice(0, 2);
    if (unique.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-1">
            {unique.map((label) => (
                <span
                    key={label}
                    className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-900"
                >
                    {(label.includes("jaminan") || label.includes("kartu")) && (
                        <CreditCard className="h-2.5 w-2.5" />
                    )}
                    {label}
                </span>
            ))}
        </div>
    );
}

function CardActions({
    scope,
    submission,
    members,
    onDecide,
    onInspect,
}) {
    const canMarkBorrowed = submission.can_mark_borrowed === true;
    const markBorrowedBlockedReason =
        submission.mark_borrowed_blocked_reason || null;
    const showSerahkan =
        scope === "handover" &&
        (canMarkBorrowed || Boolean(markBorrowedBlockedReason));
    const cardLoan = members.find((m) => m.can_receive_card);
    const inspectLoan = members.find((m) => m.can_inspect);
    const detailHref =
        submission.show_url ||
        route("admin.loans.submission", submission.code);

    const post = (routeName, id) => {
        router.post(route(routeName, id), {}, { preserveScroll: true });
    };

    const showApprove = scope === "approval" && submission.can_approve;
    const showReject = scope === "approval" && submission.can_reject;
    const showHandover = scope === "handover";
    const showInspect = scope === "returns";

    return (
        <div className="flex flex-wrap items-center justify-end gap-2.5">
            <Button
                size="sm"
                variant="outline"
                className="h-8 border-border bg-white px-3 text-foreground shadow-none hover:bg-muted/60"
                asChild
            >
                <Link href={detailHref}>
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    Detail
                </Link>
            </Button>
            {showReject ? (
                <Button
                    size="sm"
                    variant="outline"
                    className="h-8 border-red-300 bg-white px-3 text-red-600 shadow-none hover:bg-red-50 hover:text-red-700"
                    onClick={() => onDecide?.(submission, "reject")}
                >
                    <X className="mr-1.5 h-3.5 w-3.5" />
                    Tolak
                </Button>
            ) : null}
            {showApprove ? (
                <Button
                    size="sm"
                    className="h-8 bg-emerald-600 px-3 text-white hover:bg-emerald-700"
                    onClick={() => onDecide?.(submission, "approve")}
                >
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                    Setujui
                </Button>
            ) : null}
            {showSerahkan ? (
                <Button
                    size="sm"
                    className="h-8 px-3"
                    disabled={!canMarkBorrowed}
                    title={markBorrowedBlockedReason || undefined}
                    onClick={() =>
                        post(
                            "admin.loans.submission.mark-borrowed",
                            submission.code,
                        )
                    }
                >
                    <PackageCheck className="mr-1.5 h-3.5 w-3.5" />
                    Serahkan
                </Button>
            ) : null}
            {showHandover && cardLoan ? (
                <Button
                    size="sm"
                    variant="outline"
                    className="h-8 border-border bg-white px-3 shadow-none hover:bg-muted/60"
                    asChild
                >
                    <Link href={route("admin.loans.show", cardLoan.id)}>
                        <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                        Terima kartu
                    </Link>
                </Button>
            ) : null}
            {showInspect && inspectLoan ? (
                <Button
                    size="sm"
                    className="h-8 px-3"
                    onClick={() => onInspect(inspectLoan)}
                >
                    <SearchCheck className="mr-1.5 h-3.5 w-3.5" />
                    Inspeksi
                </Button>
            ) : null}
        </div>
    );
}

export default function LoanWorkCard({
    scope,
    submission,
    onDecide,
    onInspect,
}) {
    const members = (submission.package_members ?? []).filter(Boolean);
    const isUrgent = members.some(
        (m) => m.status === "terlambat" || m.is_overdue,
    );
    const alat = members.find((m) => m.item_type === "alat");
    const bahan = members.find((m) => m.item_type === "bahan");
    const typeSource = alat ?? bahan ?? members[0];
    const bookingDate = submission.request_date_formatted || null;

    return (
        <article
            className={cn(
                "rounded-lg border bg-card px-3.5 py-3 shadow-sm",
                isUrgent
                    ? "border-destructive/30 ring-1 ring-destructive/10"
                    : "border-border/70",
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href={
                                submission.show_url ||
                                route(
                                    "admin.loans.submission",
                                    submission.code,
                                )
                            }
                            className="font-mono text-xs font-semibold text-primary hover:underline"
                        >
                            {submission.code}
                        </Link>
                        <LoanStatusBadge
                            status={submission.status}
                            itemType="submission"
                        />
                    </div>
                    <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <p className="text-sm font-medium text-foreground">
                            {submission.borrower_name}
                        </p>
                        {submission.borrower_class ? (
                            <p className="text-xs text-muted-foreground">
                                {submission.borrower_class}
                            </p>
                        ) : null}
                    </div>
                    {submission.supervisor_name ? (
                        <p className="text-[11px] text-muted-foreground">
                            Guru: {submission.supervisor_name}
                        </p>
                    ) : null}
                </div>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <TypeChip loan={typeSource} />
                {alat && bahan ? (
                    <Badge
                        variant="muted"
                        className="h-5 px-1.5 text-[10px] font-medium"
                    >
                        Paket alat + bahan
                    </Badge>
                ) : null}
            </div>

            <div className="mt-2">
                <ItemList members={members} />
            </div>

            <div className="mt-2 space-y-1.5">
                <MetaLines members={members} bookingDate={bookingDate} />
                <InsightLine members={members} />
            </div>

            {members.length > 0 ? (
                <div className="mt-2.5 border-t border-border/50 pt-2">
                    <CardActions
                        scope={scope}
                        submission={submission}
                        members={members}
                        onDecide={onDecide}
                        onInspect={onInspect}
                    />
                </div>
            ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                    Tidak ada item pada pengajuan ini.
                </p>
            )}
        </article>
    );
}
