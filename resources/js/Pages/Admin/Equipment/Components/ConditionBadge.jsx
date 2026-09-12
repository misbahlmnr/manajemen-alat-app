import { cn } from "@/lib/utils";

const config = {
    baik: { label: "Baik", className: "border-transparent bg-emerald-50 text-emerald-700" },
    rusak_ringan: { label: "Rusak Ringan", className: "border-transparent bg-amber-50 text-amber-800" },
    rusak_berat: { label: "Rusak Berat", className: "border-transparent bg-red-50 text-red-700" },
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
