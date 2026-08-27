import DataPagination from "@/Components/DataPagination";
import LoanStatusBadge from "@/Components/LoanStatusBadge";
import SubmissionTypeBadges from "@/Components/SubmissionTypeBadges";
import { Link } from "@inertiajs/react";
import StudentLoanCard from "./StudentLoanCard";

function SubmissionCard({ loan, isHistory, onCancel, onRequestReturn }) {
    const members = loan.package_members || [];

    return (
        <div className="overflow-hidden rounded-[10px] border border-indigo-500/30 bg-card shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-500/20 bg-indigo-500/5 px-4 py-2">
                <div>
                    <Link
                        href={
                            loan.show_url ||
                            route("siswa.loans.submission", loan.code)
                        }
                        className="font-mono text-sm font-semibold text-indigo-700 hover:underline"
                    >
                        {loan.code}
                    </Link>
                    <div className="mt-1">
                        <SubmissionTypeBadges
                            alatCount={loan.alat_count}
                            bahanCount={loan.bahan_count}
                        />
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <LoanStatusBadge status={loan.status} itemType="submission" />
                    {loan.status_summary ? (
                        <p className="max-w-[16rem] text-right text-xs leading-snug text-muted-foreground">
                            {loan.status_summary}
                        </p>
                    ) : null}
                </div>
            </div>
            <div className="space-y-3 p-3">
                {members.map((member) => (
                    <div
                        key={member.id}
                        className="rounded-[8px] border border-border/60"
                    >
                        <StudentLoanCard
                            loan={member}
                            isHistory={isHistory}
                            onCancel={onCancel}
                            onRequestReturn={onRequestReturn}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function StudentLoanCardList({
    items,
    pagination,
    isHistory = false,
    onCancel,
    onRequestReturn,
}) {
    if (!items?.length) return null;

    return (
        <div className="space-y-4">
            {items.map((loan) =>
                loan.is_submission || loan.package_members?.length ? (
                    <SubmissionCard
                        key={`sub-${loan.id ?? loan.code}`}
                        loan={loan}
                        isHistory={isHistory}
                        onCancel={onCancel}
                        onRequestReturn={onRequestReturn}
                    />
                ) : (
                    <StudentLoanCard
                        key={loan.id}
                        loan={loan}
                        isHistory={isHistory}
                        onCancel={onCancel}
                        onRequestReturn={onRequestReturn}
                    />
                ),
            )}
            <div className="rounded-[10px] border border-border/60 bg-card shadow-card">
                <DataPagination paginator={pagination} />
            </div>
        </div>
    );
}
