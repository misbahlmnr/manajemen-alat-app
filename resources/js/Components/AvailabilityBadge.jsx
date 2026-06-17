import { cn } from "@/lib/utils";

const config = {
    tersedia: {
        label: "Tersedia",
        dot: "bg-emerald-500",
        className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
    },
    dipinjam: {
        label: "Sebagian Dipinjam",
        dot: "bg-blue-500",
        className: "border-blue-500/20 bg-blue-500/10 text-blue-700",
    },
    habis: {
        label: "Tidak Tersedia",
        dot: "bg-red-500",
        className: "border-red-500/20 bg-red-500/10 text-red-700",
    },
    rusak: {
        label: "Dalam Perbaikan",
        dot: "bg-amber-500",
        className: "border-amber-500/20 bg-amber-500/10 text-amber-800",
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

export default function AvailabilityBadge({ label }) {
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
