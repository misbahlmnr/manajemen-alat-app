import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

export default function StockLowBadge({ show }) {
    if (!show) return null;

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning",
            )}
        >
            <AlertTriangle className="h-3 w-3" />
            Stok menipis
        </span>
    );
}
