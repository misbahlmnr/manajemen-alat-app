import { cn } from "@/lib/utils";

const config = {
    baik: { label: "Baik", className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" },
    rusak_ringan: { label: "Rusak Ringan", className: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
    rusak_berat: { label: "Rusak Berat", className: "bg-red-500/10 text-red-700 border-red-500/20" },
};

export default function ConditionBreakdown({ breakdown, compact = false }) {
    const data = breakdown ?? { baik: 0, rusak_ringan: 0, rusak_berat: 0 };
    const entries = Object.entries(data).filter(([, qty]) => Number(qty) > 0);

    if (entries.length === 0) {
        return <span className="text-xs text-muted-foreground">—</span>;
    }

    if (compact) {
        return (
            <span className="text-xs text-muted-foreground">
                {entries
                    .map(([key, qty]) => `${qty} ${config[key]?.label ?? key}`)
                    .join(" · ")}
            </span>
        );
    }

    return (
        <div className="flex flex-wrap gap-1.5">
            {entries.map(([key, qty]) => {
                const item = config[key] ?? {
                    label: key,
                    className: "bg-muted text-muted-foreground",
                };

                return (
                    <span
                        key={key}
                        className={cn(
                            "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                            item.className,
                        )}
                    >
                        {item.label}: {qty}
                    </span>
                );
            })}
        </div>
    );
}
