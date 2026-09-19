import DataPagination from "@/Components/DataPagination";
import LoanWorkCard from "./LoanWorkCard";

export default function LoanWorkList({
    items,
    pagination,
    scope,
    onDecide,
    onInspect,
}) {
    return (
        <div className="space-y-2">
            <div className="mx-auto w-full max-w-3xl space-y-2">
                {(items ?? []).map((submission) => (
                    <LoanWorkCard
                        key={submission.id ?? submission.code}
                        scope={scope}
                        submission={submission}
                        onDecide={onDecide}
                        onInspect={onInspect}
                    />
                ))}
            </div>
            <div className="mx-auto w-full max-w-3xl">
                <DataPagination pagination={pagination} />
            </div>
        </div>
    );
}
