import { cn } from "@/lib/utils";
import { GraduationCap, UserCog, Users } from "lucide-react";

const tabs = [
    { key: "all", label: "Semua", icon: null },
    { key: "siswa", label: "Siswa", icon: GraduationCap },
    { key: "guru", label: "Guru", icon: Users },
    { key: "admin", label: "Admin", icon: UserCog },
];

export default function RoleFilterTabs({ value, onChange, counts, disabled }) {
    return (
        <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = value === tab.key;

                return (
                    <button
                        key={tab.key}
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange(tab.key)}
                        className={cn(
                            "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all",
                            active
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "border border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                        )}
                    >
                        {Icon && <Icon className="h-4 w-4" />}
                        {tab.label}
                        <span
                            className={cn(
                                "rounded-md px-1.5 py-0.5 text-xs",
                                active
                                    ? "bg-primary-foreground/20"
                                    : "bg-muted",
                            )}
                        >
                            {counts[tab.key] ?? 0}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
