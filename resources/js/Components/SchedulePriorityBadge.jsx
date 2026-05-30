import { cn } from "@/lib/utils";

const config = {
    normal: {
        label: "Normal",
        dot: "bg-slate-500",
        className: "border-slate-500/20 bg-slate-500/10 text-slate-700",
    },
    tinggi: {
        label: "Tinggi",
        dot: "bg-amber-500",
        className: "border-amber-500/20 bg-amber-500/10 text-amber-800",
    },
    lomba: {
        label: "Lomba",
        dot: "bg-red-500",
        className: "border-red-500/20 bg-red-500/10 text-red-700",
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
