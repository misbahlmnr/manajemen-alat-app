import { cn } from "@/lib/utils";

const config = {
    normal: {
        label: "Normal",
        dot: "bg-slate-400",
        className: "border-slate-200 bg-slate-50 text-slate-600",
    },
    tinggi: {
        label: "Tinggi",
        dot: "bg-amber-600/80",
        className: "border-amber-200/80 bg-amber-50 text-amber-900/80",
    },
    lomba: {
        label: "Lomba",
        dot: "bg-red-600/70",
        className: "border-red-200/70 bg-red-50 text-red-800/80",
    },
};

export default function SchedulePriorityBadge({ priority }) {
    const item = config[priority] ?? config.normal;

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
