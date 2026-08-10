import DataPagination from "@/Components/DataPagination";
import LoanStatusBadge from "@/Components/LoanStatusBadge";
import GuruLoanCard from "./GuruLoanCard";

function PackageCard({ loan, isHistory }) {
    const members = loan.package_members || [];

    return (
        <div className="overflow-hidden rounded-2xl border border-indigo-500/30 bg-card shadow-card">
            <div className="flex items-center justify-between border-b border-indigo-500/20 bg-indigo-500/5 px-4 py-2">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                        Paket Alat & Bahan
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                        {(loan.package_codes || []).join(" · ")}
                    </p>
                </div>
                <LoanStatusBadge status="paket" itemType="paket" />
            </div>
            <div className="space-y-3 p-3">
                {members.map((member) => (
                    <div key={member.id} className="rounded-xl border border-border/60">
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
                loan.is_package ? (
                    <PackageCard
                        key={`pkg-${loan.loan_group_id}`}
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
