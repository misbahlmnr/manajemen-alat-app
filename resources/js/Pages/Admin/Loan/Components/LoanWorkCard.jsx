import LoanStatusBadge from "@/Components/LoanStatusBadge";
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

function ItemPreview({ loan }) {
    const items = loan.items ?? [];
    if (items.length > 0) {
        return (
            <ul className="space-y-0.5">
                {items.slice(0, 3).map((item) => (
                    <li
                        key={item.id ?? item.equipment_id}
                        className="text-sm font-semibold text-foreground"
                    >
                        {item.quantity}× {item.equipment_name ?? "Item"}
                    </li>
                ))}
                {items.length > 3 ? (
                    <li className="text-xs text-muted-foreground">
                        +{items.length - 3} item lain
                    </li>
                ) : null}
            </ul>
        );
    }

    return (
        <p className="text-sm font-semibold text-foreground">
            {loan.items_summary || "—"}
        </p>
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
            {loan.can_reject && (
                <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10"
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
            <Button size="sm" variant="outline" asChild>
                <Link href={route("admin.loans.show", loan.id)}>
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    Detail
                </Link>
            </Button>
        </div>
    );
}

function MemberBlock({ loan, showStatus, onReject, onReturn, onInspect }) {
    const isBahan = loan.item_type === "bahan";
    const categoryLabel = isBahan ? null : loan.queue_type_label;
    const activityParts = [loan.slot_label, loan.schedule_title].filter(Boolean);

    return (
        <div className="space-y-3 rounded-[8px] border border-border/60 bg-muted/20 p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-secondary-foreground">
                    {loan.item_type_label || (isBahan ? "Bahan" : "Alat")}
                </span>
                {categoryLabel ? (
                    <span className="rounded-full bg-secondary/70 px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                        {categoryLabel}
                    </span>
                ) : null}
                {showStatus ? (
                    <LoanStatusBadge
                        status={loan.status}
                        itemType={loan.item_type}
                    />
                ) : null}
            </div>

            {activityParts.length > 0 ? (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 shrink-0" />
                    {activityParts.join(" | ")}
                </p>
            ) : null}

            {loan.status === "antrian" && loan.queue_position ? (
                <p className="text-xs text-amber-800">
                    Antrian #{loan.queue_position}
                </p>
            ) : null}
            {loan.mark_borrowed_blocked_reason ? (
                <p className="text-xs text-amber-800">
                    {loan.mark_borrowed_blocked_reason}
                </p>
            ) : null}

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
                    <p className="text-xs text-muted-foreground">
                        Booking: {submission.request_date_formatted || "—"}
                        {submission.supervisor_name
                            ? ` · Guru: ${submission.supervisor_name}`
                            : ""}
                    </p>
                </div>
            </div>
            <div className="space-y-3 p-4 sm:p-5">
                {members.length > 0 ? (
                    members.map((loan) => (
                        <MemberBlock
                            key={loan.id}
                            loan={loan}
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
