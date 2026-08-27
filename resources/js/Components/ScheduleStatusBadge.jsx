import { cn } from "@/lib/utils";

const config = {
    draft: {
        label: "Draft",
        dot: "bg-slate-400",
        className: "border-slate-200 bg-slate-50 text-slate-600",
    },
    terjadwal: {
        label: "Terjadwal",
        dot: "bg-slate-500",
        className: "border-slate-200 bg-slate-100 text-slate-700",
    },
    berlangsung: {
        label: "Berlangsung",
        dot: "bg-slate-600",
        className: "border-slate-200 bg-slate-100 text-slate-700",
    },
    aktif: {
        label: "Aktif",
        dot: "bg-slate-600",
        className: "border-slate-200 bg-slate-100 text-slate-700",
    },
    selesai: {
        label: "Selesai",
        dot: "bg-slate-400",
        className: "border-slate-200 bg-slate-50 text-slate-600",
    },
    dibatalkan: {
        label: "Dibatalkan",
        dot: "bg-red-600/70",
        className: "border-red-200/70 bg-red-50 text-red-800/80",
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
