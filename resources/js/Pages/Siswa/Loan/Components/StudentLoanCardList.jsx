import DataPagination from "@/Components/DataPagination";
import StudentLoanCard from "./StudentLoanCard";

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
            {items.map((loan) => (
                <StudentLoanCard
                    key={loan.id}
                    loan={loan}
                    isHistory={isHistory}
                    onCancel={onCancel}
                    onRequestReturn={onRequestReturn}
                />
            ))}
            <div className="rounded-2xl border border-border/60 bg-card shadow-card">
                <DataPagination paginator={pagination} />
            </div>
        </div>
    );
}
