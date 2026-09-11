import { cn } from "@/lib/utils";

/**
 * Badge status aktif/nonaktif — dipakai di Kelola Pengguna, Alat, dan Bahan.
 */
export default function StatusBadge({ status }) {
    const active = status === "active";

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                active
                    ? "border-transparent bg-emerald-50 text-emerald-700"
                    : "border-transparent bg-muted text-muted-foreground",
            )}
        >
            <span
                className={cn(
                    "mr-1.5 h-1.5 w-1.5 rounded-full",
                    active ? "bg-emerald-500" : "bg-muted-foreground",
                )}
            />
            {active ? "Aktif" : "Nonaktif"}
        </span>
    );
}
