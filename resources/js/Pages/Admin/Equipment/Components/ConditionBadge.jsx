import { cn } from "@/lib/utils";

const config = {
    baik: { label: "Baik", className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" },
    rusak_ringan: { label: "Rusak Ringan", className: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
    rusak_berat: { label: "Rusak Berat", className: "bg-red-500/10 text-red-700 border-red-500/20" },
};

export default function ConditionBadge({ condition }) {
    const item = config[condition] ?? { label: condition, className: "bg-muted text-muted-foreground" };

    return (
        <span
            className={cn(
                "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                item.className,
            )}
        >
            {item.label}
        </span>
    );
}
