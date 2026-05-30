import { cn } from "@/lib/utils";

const config = {
    draft: {
        label: "Draft",
        dot: "bg-slate-500",
        className: "border-slate-500/20 bg-slate-500/10 text-slate-700",
    },
    terjadwal: {
        label: "Terjadwal",
        dot: "bg-blue-500",
        className: "border-blue-500/20 bg-blue-500/10 text-blue-700",
    },
    berlangsung: {
        label: "Berlangsung",
        dot: "bg-emerald-500",
        className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
    },
    aktif: {
        label: "Aktif",
        dot: "bg-emerald-500",
        className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
    },
    selesai: {
        label: "Selesai",
        dot: "bg-slate-400",
        className: "border-slate-400/20 bg-slate-500/10 text-slate-600",
    },
    dibatalkan: {
        label: "Dibatalkan",
        dot: "bg-red-500",
        className: "border-red-500/20 bg-red-500/10 text-red-700",
    },
};

export default function ScheduleStatusBadge({ status, displayStatus }) {
    const key = displayStatus ?? status ?? "draft";
    const item = config[key] ?? config.draft;

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
