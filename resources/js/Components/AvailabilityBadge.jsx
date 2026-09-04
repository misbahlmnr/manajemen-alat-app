import { cn } from "@/lib/utils";

const config = {
    tersedia: {
        label: "Tersedia",
        secondary: null,
        dot: "bg-slate-600",
        className: "border-slate-200 bg-slate-100 text-slate-700",
    },
    dipinjam: {
        label: "Sebagian Dipinjam",
        secondary: null,
        dot: "bg-amber-600/70",
        className: "border-amber-200/60 bg-amber-50/80 text-amber-950/70",
    },
    habis: {
        label: "Stok Kosong",
        secondary: "Antrean Dibuka",
        dot: "bg-amber-600/80",
        className: "border-amber-200/80 bg-amber-50 text-amber-900/80",
    },
    rusak: {
        label: "Dalam Perbaikan",
        secondary: null,
        dot: "bg-amber-600/80",
        className: "border-amber-200/80 bg-amber-50 text-amber-900/80",
    },
    tidak_tersedia: {
        label: "Tidak Tersedia",
        secondary: null,
        dot: "bg-slate-400",
        className: "border-slate-200 bg-slate-50 text-slate-600",
    },
    nonaktif: {
        label: "Tidak Tersedia",
        secondary: null,
        dot: "bg-slate-400",
        className: "border-slate-200 bg-slate-50 text-slate-600",
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
                    "inline-flex flex-col gap-0.5 rounded-full border px-2 py-1 text-[11px] font-medium leading-tight",
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
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none",
                item.className,
            )}
        >
            <span className={cn("mr-1.5 h-1.5 w-1.5 shrink-0 rounded-full", item.dot)} />
            {item.label}
        </span>
    );
}
