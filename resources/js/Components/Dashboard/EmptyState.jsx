import { cn } from "@/lib/utils";

const iconTones = {
    default: "bg-muted text-muted-foreground",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
    info: "bg-sky-50 text-sky-700",
};

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className,
    tone = "default",
}) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/40 px-6 py-12 text-center",
                className,
            )}
        >
            {Icon && (
                <div
                    className={cn(
                        "mb-4 flex h-11 w-11 items-center justify-center rounded-md",
                        iconTones[tone] ?? iconTones.default,
                    )}
                >
                    <Icon className="h-5 w-5" />
                </div>
            )}
            {title && (
                <p className="text-sm font-semibold text-foreground">{title}</p>
            )}
            {description && (
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    {description}
                </p>
            )}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}
