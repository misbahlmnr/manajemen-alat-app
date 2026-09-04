import { cn } from "@/lib/utils";

const variantStyles = {
    default: "bg-card",
    primary: "bg-card border-border",
    warning: "bg-card border-border",
    success: "bg-card border-border",
    danger: "bg-card border-border",
};

const iconVariantStyles = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-muted text-foreground",
    warning: "bg-amber-50 text-amber-800/80",
    success: "bg-slate-100 text-slate-600",
    danger: "bg-red-50 text-red-800/75",
};

export function StatCard({
    title,
    value,
    icon: Icon,
    trend,
    variant = "default",
    className,
}) {
    return (
        <div
            className={cn(
                "stat-card animate-fade-in",
                variantStyles[variant],
                className,
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">
                        {title}
                    </p>
                    <p className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground">
                        {value}
                    </p>
                    {trend && (
                        <p
                            className={cn(
                                "mt-2 text-sm",
                                trend.isPositive
                                    ? "text-success"
                                    : "text-destructive",
                            )}
                        >
                            {trend.isPositive ? "+" : ""}
                            {trend.value}% dari bulan lalu
                        </p>
                    )}
                </div>
                {Icon && (
                    <div
                        className={cn(
                            "rounded-[8px] p-2.5",
                            iconVariantStyles[variant],
                        )}
                    >
                        <Icon className="h-5 w-5" />
                    </div>
                )}
            </div>
        </div>
    );
}
