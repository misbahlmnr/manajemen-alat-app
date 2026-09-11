import { cn } from "@/lib/utils";

const config = {
    draft: {
        label: "Draft",
        dot: "bg-muted-foreground",
        className: "border-transparent bg-muted text-muted-foreground",
    },
    terjadwal: {
        label: "Terjadwal",
        dot: "bg-blue-500",
        className: "border-transparent bg-blue-50 text-blue-700",
    },
    berlangsung: {
        label: "Berlangsung",
        dot: "bg-sky-500",
        className: "border-transparent bg-sky-50 text-sky-700",
    },
    aktif: {
        label: "Aktif",
        dot: "bg-emerald-500",
        className: "border-transparent bg-emerald-50 text-emerald-700",
    },
    selesai: {
        label: "Selesai",
        dot: "bg-muted-foreground",
        className: "border-transparent bg-muted text-muted-foreground",
    },
    dibatalkan: {
        label: "Dibatalkan",
        dot: "bg-red-500",
        className: "border-transparent bg-red-50 text-red-700",
    },
};

export default function ScheduleStatusBadge({ status, displayStatus }) {
    const key = displayStatus ?? status ?? "draft";
    const item = config[key] ?? config.draft;

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
