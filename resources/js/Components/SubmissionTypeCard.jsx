import LoanStatusBadge from "@/Components/LoanStatusBadge";
import { Button } from "@/Components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Link } from "@inertiajs/react";

function ItemLines({ loan }) {
    const items = loan?.items ?? [];
    if (!items.length) {
        return (
            <p className="text-sm text-muted-foreground">
                {loan?.items_summary && loan.items_summary !== "—"
                    ? loan.items_summary
                    : "Tidak ada item"}
            </p>
        );
    }

    return (
        <ul className="space-y-1.5">
            {items.map((item) => (
                <li
                    key={item.id ?? item.equipment_id}
                    className="flex items-center justify-between gap-3 text-sm"
                >
                    <span className="font-medium">
                        {item.equipment_name ?? "Item"}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                        ×{item.quantity}
                    </span>
                </li>
            ))}
        </ul>
    );
}

export default function SubmissionTypeCard({
    title,
    icon: Icon,
    loan,
    emptyLabel,
    actionHref,
    actionLabel,
    actionVariant = "outline",
    accent,
}) {
    const hasLoan = Boolean(loan);
    const scheduleLine = hasLoan
        ? [loan.schedule_title, loan.slot_label].filter(Boolean).join(" · ")
        : "";

    return (
        <Card
            className={`rounded-[10px] border-border/60 shadow-card ${accent ?? ""}`}
        >
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        {Icon ? <Icon className="h-4 w-4" /> : null}
                        {title}
                    </CardTitle>
                    {hasLoan && (
                        <LoanStatusBadge
                            status={loan.status}
                            itemType={loan.item_type}
                        />
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {hasLoan ? (
                    <>
                        <ItemLines loan={loan} />
                        {scheduleLine ? (
                            <p className="text-xs text-muted-foreground">
                                {scheduleLine}
                            </p>
                        ) : null}
                        {loan.status === "antrian" && loan.queue_position ? (
                            <p className="text-xs text-amber-800">
                                Antrian #{loan.queue_position}
                                {loan.queue_type_label
                                    ? ` · ${loan.queue_type_label}`
                                    : ""}
                            </p>
                        ) : null}
                        {actionHref ? (
                            <Button
                                asChild
                                variant={actionVariant}
                                className="w-full sm:w-auto"
                            >
                                <Link href={actionHref}>
                                    {actionLabel || `Lihat Detail ${title}`}
                                </Link>
                            </Button>
                        ) : null}
                    </>
                ) : (
                    <p className="text-sm text-muted-foreground">{emptyLabel}</p>
                )}
            </CardContent>
        </Card>
    );
}
