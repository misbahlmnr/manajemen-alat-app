import DataPagination from "@/Components/DataPagination";
import LoanWorkCard from "./LoanWorkCard";

export default function LoanWorkList({
    items,
    pagination,
    onReject,
    onReturn,
    onInspect,
}) {
    return (
        <div className="space-y-3">
            <div className="mx-auto w-full max-w-4xl space-y-3">
                {(items ?? []).map((submission) => (
                    <LoanWorkCard
                        key={submission.id ?? submission.code}
                        submission={submission}
                        onReject={onReject}
                        onReturn={onReturn}
                        onInspect={onInspect}
                    />
                ))}
            </div>
            <div className="mx-auto w-full max-w-4xl">
                <DataPagination pagination={pagination} />
            </div>
        </div>
    );
}
