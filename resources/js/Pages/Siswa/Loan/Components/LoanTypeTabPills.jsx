import { cn } from "@/lib/utils";
import { Package, Wrench } from "lucide-react";

const tabMeta = {
    all: { label: "Semua", icon: null },
    alat: { label: "Alat", icon: Wrench },
    bahan: { label: "Bahan", icon: Package },
};

export default function LoanTypeTabPills({ value, onChange, counts = {} }) {
    return (
        <div className="mb-6 flex w-full flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-card p-1 shadow-sm sm:w-fit">
            {(["all", "alat", "bahan"]).map((tab) => {
                const meta = tabMeta[tab];
                const Icon = meta.icon;
                return (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => onChange(tab)}
                        className={cn(
                            "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:flex-none",
                            value === tab
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                        )}
                    >
                        {Icon && <Icon className="h-4 w-4" />}
                        {meta.label}
                        <span className="opacity-60">
                            ({counts[tab] ?? 0})
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
