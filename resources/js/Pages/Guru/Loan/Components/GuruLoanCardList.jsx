import DataPagination from "@/Components/DataPagination";
import GuruLoanCard from "./GuruLoanCard";

export default function GuruLoanCardList({
    items,
    pagination,
    isHistory = false,
}) {
    if (!items?.length) return null;

    return (
        <div className="space-y-4">
            {items.map((loan) => (
                <GuruLoanCard
                    key={loan.id}
                    loan={loan}
                    isHistory={isHistory}
                />
            ))}
            <div className="rounded-2xl border border-border/60 bg-card shadow-card">
                <DataPagination paginator={pagination} />
            </div>
        </div>
    );
}
