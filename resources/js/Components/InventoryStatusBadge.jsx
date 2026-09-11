import { cn } from "@/lib/utils";

export default function InventoryStatusBadge({ status }) {
    const available = status === "tersedia";

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                available
                    ? "border-transparent bg-emerald-50 text-emerald-700"
                    : "border-transparent bg-muted text-muted-foreground",
            )}
        >
            <span
                className={cn(
                    "mr-1.5 h-1.5 w-1.5 rounded-full",
                    available ? "bg-emerald-500" : "bg-muted-foreground",
                )}
            />
            {available ? "Tersedia" : "Tidak Tersedia"}
        </span>
    );
}
