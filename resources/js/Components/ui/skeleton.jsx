import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }) {
    return (
        <div
            className={cn("skeleton", className)}
            aria-hidden
            {...props}
        />
    );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
    return (
        <div className="space-y-3 rounded-[10px] border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <div className="flex gap-3">
                {Array.from({ length: cols }).map((_, i) => (
                    <Skeleton key={`h-${i}`} className="h-4 flex-1" />
                ))}
            </div>
            {Array.from({ length: rows }).map((_, r) => (
                <div key={`r-${r}`} className="flex gap-3">
                    {Array.from({ length: cols }).map((_, c) => (
                        <Skeleton key={`c-${r}-${c}`} className="h-10 flex-1" />
                    ))}
                </div>
            ))}
        </div>
    );
}

export default Skeleton;
