import { cn } from "@/lib/utils";
import { Package, Wrench } from "lucide-react";

const tabMeta = {
    all: { label: "Semua", icon: null },
    alat: { label: "Alat", icon: Wrench },
    bahan: { label: "Bahan", icon: Package },
};

export default function LoanTypeTabPills({ value, onChange, counts = {} }) {
    return (
        <div className="mb-6 flex w-fit items-center gap-2 rounded-lg bg-secondary p-1">
            {(["all", "alat", "bahan"]).map((tab) => {
                const meta = tabMeta[tab];
                const Icon = meta.icon;
                return (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => onChange(tab)}
                        className={cn(
                            "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                            value === tab
                                ? "bg-card text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground",
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
