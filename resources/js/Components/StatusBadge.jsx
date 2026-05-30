import { cn } from "@/lib/utils";

/**
 * Badge status aktif/nonaktif — dipakai di Kelola Pengguna, Alat, dan Bahan.
 */
export default function StatusBadge({ status }) {
    const active = status === "active";

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                active
                    ? "border-success/20 bg-success/10 text-success"
                    : "border-muted-foreground/20 bg-muted text-muted-foreground",
            )}
        >
            <span
                className={cn(
                    "mr-1.5 h-1.5 w-1.5 rounded-full",
                    active ? "bg-success" : "bg-muted-foreground",
                )}
            />
            {active ? "Aktif" : "Nonaktif"}
        </span>
    );
}
