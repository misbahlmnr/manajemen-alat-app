import DataPagination from "@/Components/DataPagination";
import LoanWorkCard from "./LoanWorkCard";

export default function LoanWorkList({
    items,
    pagination,
    onReturn,
    onInspect,
}) {
    return (
        <div className="space-y-2">
            <div className="mx-auto w-full max-w-3xl space-y-2">
                {(items ?? []).map((submission) => (
                    <LoanWorkCard
                        key={submission.id ?? submission.code}
                        submission={submission}
                        onReturn={onReturn}
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
