import { cn } from "@/lib/utils";

const config = {
    normal: {
        label: "Normal",
        dot: "bg-muted-foreground",
        className: "border-transparent bg-muted text-muted-foreground",
    },
    tinggi: {
        label: "Tinggi",
        dot: "bg-amber-500",
        className: "border-transparent bg-amber-50 text-amber-800",
    },
    lomba: {
        label: "Lomba",
        dot: "bg-red-500",
        className: "border-transparent bg-red-50 text-red-700",
    },
};

export default function SchedulePriorityBadge({ priority }) {
    const item = config[priority] ?? config.normal;

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                item.className,
            )}
        >
            <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", item.dot)} />
            {item.label}
        </span>
    );
}
