import { cn } from "@/lib/utils";

const config = {
    tersedia: {
        label: "Tersedia",
        dot: "bg-emerald-500",
        className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
    },
    diambil: {
        label: "Sebagian Diambil",
        dot: "bg-blue-500",
        className: "border-blue-500/20 bg-blue-500/10 text-blue-700",
    },
    menipis: {
        label: "Stok Menipis",
        dot: "bg-amber-500",
        className: "border-amber-500/20 bg-amber-500/10 text-amber-800",
    },
    habis: {
        label: "Habis",
        dot: "bg-red-500",
        className: "border-red-500/20 bg-red-500/10 text-red-700",
    },
    tidak_tersedia: {
        label: "Tidak Tersedia",
        dot: "bg-slate-400",
        className: "border-slate-500/20 bg-slate-500/10 text-slate-600",
    },
    nonaktif: {
        label: "Tidak Tersedia",
        dot: "bg-slate-400",
        className: "border-slate-500/20 bg-slate-500/10 text-slate-600",
    },
};

export default function SupplyStockBadge({ label }) {
    const item = config[label] ?? config.tersedia;

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
