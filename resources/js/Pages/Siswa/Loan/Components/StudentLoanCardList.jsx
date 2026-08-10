import DataPagination from "@/Components/DataPagination";
import LoanStatusBadge from "@/Components/LoanStatusBadge";
import { Link } from "@inertiajs/react";
import StudentLoanCard from "./StudentLoanCard";

function PackageCard({ loan, isHistory, onCancel, onRequestReturn }) {
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
                        <StudentLoanCard
                            loan={member}
                            isHistory={isHistory}
                            onCancel={onCancel}
                            onRequestReturn={onRequestReturn}
                        />
                    </div>
                ))}
                {members[0] && (
                    <div className="px-2 pb-1 text-right">
                        <Link
                            href={route("siswa.loans.show", members[0].id)}
                            className="text-xs text-primary hover:underline"
                        >
                            Lihat detail anggota paket
                        </Link>
                    </div>
                )}
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
                loan.is_package ? (
                    <PackageCard
                        key={`pkg-${loan.loan_group_id}`}
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
            <div className="rounded-2xl border border-border/60 bg-card shadow-card">
                <DataPagination paginator={pagination} />
            </div>
        </div>
    );
}
