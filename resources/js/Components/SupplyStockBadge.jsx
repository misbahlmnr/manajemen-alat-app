import { cn } from "@/lib/utils";

const config = {
    tersedia: {
        label: "Tersedia",
        secondary: null,
        dot: "bg-emerald-500",
        className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
    },
    diambil: {
        label: "Sebagian Diambil",
        secondary: null,
        dot: "bg-blue-500",
        className: "border-blue-500/20 bg-blue-500/10 text-blue-700",
    },
    menipis: {
        label: "Stok Menipis",
        secondary: null,
        dot: "bg-amber-500",
        className: "border-amber-500/20 bg-amber-500/10 text-amber-800",
    },
    habis: {
        label: "Stok Kosong",
        secondary: "Antrean Dibuka",
        dot: "bg-amber-500",
        className: "border-amber-500/20 bg-amber-500/10 text-amber-800",
    },
    tidak_tersedia: {
        label: "Tidak Tersedia",
        secondary: null,
        dot: "bg-slate-400",
        className: "border-slate-500/20 bg-slate-500/10 text-slate-600",
    },
    nonaktif: {
        label: "Tidak Tersedia",
        secondary: null,
        dot: "bg-slate-400",
        className: "border-slate-500/20 bg-slate-500/10 text-slate-600",
    },
};

export default function SupplyStockBadge({ label, dual = true }) {
    const item = config[label] ?? config.tersedia;

    if (dual && item.secondary) {
        return (
            <span
                className={cn(
                    "inline-flex flex-col gap-0.5 rounded-lg border px-2.5 py-1 text-xs font-medium",
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
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                item.className,
            )}
        >
            <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", item.dot)} />
            {item.label}
        </span>
    );
}
