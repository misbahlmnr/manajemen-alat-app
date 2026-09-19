import DataPagination from "@/Components/DataPagination";
import LoanStatusBadge from "@/Components/LoanStatusBadge";
import SubmissionTypeBadges from "@/Components/SubmissionTypeBadges";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Link } from "@inertiajs/react";
import { Calendar, Package, Users } from "lucide-react";

function submissionHref(submission) {
    return (
        submission.show_url ||
        route("guru.loans.submission", submission.code)
    );
}

function jenisLabel(submission) {
    const alat = submission.alat ?? submission.package_members?.find(
        (m) => m.item_type === "alat",
    );
    return (
        alat?.queue_type_label ||
        alat?.borrow_scope_label ||
        (submission.is_praktikum ? "Praktik Lab" : "Pengajuan")
    );
}

function itemCount(submission) {
    const members = submission.package_members ?? [];
    if (members.length > 0) {
        return members.reduce(
            (sum, m) => sum + (Number(m.items_count) || 0),
            0,
        );
    }
    return (submission.alat_count ?? 0) + (submission.bahan_count ?? 0);
}

function GroupBadge({ submission }) {
    if (!submission.is_praktikum) {
        return null;
    }

    const size = submission.group_size ?? 1;
    if (size > 1) {
        return (
            <Badge variant="muted" className="h-5 px-1.5 text-[10px] font-medium">
                Kelompok · {size} Orang
            </Badge>
        );
    }

    return (
        <Badge variant="muted" className="h-5 px-1.5 text-[10px] font-medium">
            Praktikum Individu
        </Badge>
    );
}

function SubmissionCard({ submission }) {
    const href = submissionHref(submission);
    const count = itemCount(submission);

    return (
        <article className="overflow-hidden rounded-[10px] border border-border/60 bg-card shadow-card transition-shadow hover:shadow-md">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b bg-muted/30 px-4 py-3 sm:px-5">
                <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href={href}
                            className="font-mono text-sm font-semibold text-primary hover:underline"
                        >
                            {submission.code}
                        </Link>
                        <GroupBadge submission={submission} />
                        <LoanStatusBadge
                            status={submission.status}
                            itemType="submission"
                        />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                        {submission.borrower_name ?? "—"}
                        {submission.borrower_class ? (
                            <span className="font-normal text-muted-foreground">
                                {" "}
                                · {submission.borrower_class}
                            </span>
                        ) : null}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {jenisLabel(submission)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <Package className="h-3.5 w-3.5" />
                            {count} Barang
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {submission.request_date_formatted ?? "—"}
                        </span>
                    </div>
                    <SubmissionTypeBadges
                        alatCount={submission.alat_count}
                        bahanCount={submission.bahan_count}
                    />
                </div>
                <Button variant="outline" size="sm" asChild>
                    <Link href={href}>Lihat Detail</Link>
                </Button>
            </div>
            {submission.status_summary ? (
                <p className="px-4 py-2 text-xs text-muted-foreground sm:px-5">
                    {submission.status_summary}
                </p>
            ) : null}
        </article>
    );
}

export default function GuruLoanCardList({
    items,
    pagination,
}) {
    if (!items?.length) return null;

    return (
        <div className="space-y-3">
            {items.map((item) => (
                <SubmissionCard
                    key={`sub-${item.id ?? item.code}`}
                    submission={item}
                />
            ))}
            <div className="rounded-[10px] border border-border/60 bg-card shadow-card">
                <DataPagination paginator={pagination} />
            </div>
        </div>
    );
}
