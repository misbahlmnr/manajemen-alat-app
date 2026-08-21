import DataPagination from "@/Components/DataPagination";
import LoanStatusBadge from "@/Components/LoanStatusBadge";
import SubmissionTypeBadges from "@/Components/SubmissionTypeBadges";
import { Link } from "@inertiajs/react";
import GuruLoanCard from "./GuruLoanCard";

function SubmissionCard({ loan, isHistory }) {
    const members = loan.package_members || [];

    return (
        <div className="overflow-hidden rounded-2xl border border-indigo-500/30 bg-card shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-500/20 bg-indigo-500/5 px-4 py-2">
                <div>
                    <Link
                        href={
                            loan.show_url ||
                            route("guru.loans.submission", loan.code)
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
                <LoanStatusBadge status={loan.status} />
            </div>
            <div className="space-y-3 p-3">
                {members.map((member) => (
                    <div
                        key={member.id}
                        className="rounded-xl border border-border/60"
                    >
                        <GuruLoanCard loan={member} isHistory={isHistory} />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function GuruLoanCardList({
    items,
    pagination,
    isHistory = false,
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
                    />
                ) : (
                    <GuruLoanCard
                        key={loan.id}
                        loan={loan}
                        isHistory={isHistory}
                    />
                ),
            )}
            <div className="rounded-2xl border border-border/60 bg-card shadow-card">
                <DataPagination paginator={pagination} />
            </div>
        </div>
    );
}
