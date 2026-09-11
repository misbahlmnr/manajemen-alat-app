import { cn } from "@/lib/utils";

const config = {
    tersedia: {
        label: "Tersedia",
        secondary: null,
        dot: "bg-emerald-500",
        className: "border-transparent bg-emerald-50 text-emerald-700",
    },
    dipinjam: {
        label: "Sebagian Dipinjam",
        secondary: null,
        dot: "bg-sky-500",
        className: "border-transparent bg-sky-50 text-sky-700",
    },
    habis: {
        label: "Stok Kosong",
        secondary: "Antrean Dibuka",
        dot: "bg-amber-500",
        className: "border-transparent bg-amber-50 text-amber-800",
    },
    rusak: {
        label: "Dalam Perbaikan",
        secondary: null,
        dot: "bg-amber-500",
        className: "border-transparent bg-amber-50 text-amber-800",
    },
    tidak_tersedia: {
        label: "Tidak Tersedia",
        secondary: null,
        dot: "bg-muted-foreground",
        className: "border-transparent bg-muted text-muted-foreground",
    },
    nonaktif: {
        label: "Tidak Tersedia",
        secondary: null,
        dot: "bg-muted-foreground",
        className: "border-transparent bg-muted text-muted-foreground",
    },
};

/**
 * @param {{ label: string, dual?: boolean }} props
 */
export default function AvailabilityBadge({ label, dual = true }) {
    const item = config[label] ?? config.tersedia;

    if (dual && item.secondary) {
        return (
            <span
                className={cn(
                    "inline-flex flex-col gap-0.5 rounded-full border px-2.5 py-1 text-xs font-semibold leading-tight",
                    item.className,
                )}
            >
                <span className="inline-flex items-center">
                    <span
                        className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", item.dot)}
                    />
                    {item.label}
                </span>
                <span className="pl-3 text-[11px] font-normal opacity-90">
                    {item.secondary}
                </span>
            </span>
        );
    }

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-none",
                item.className,
            )}
        >
            <span className={cn("mr-1.5 h-1.5 w-1.5 shrink-0 rounded-full", item.dot)} />
            {item.label}
        </span>
    );
}
