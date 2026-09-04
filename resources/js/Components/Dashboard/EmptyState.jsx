import { cn } from "@/lib/utils";

export function EmptyState({ icon: Icon, title, description, action, className }) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center rounded-[10px] border border-dashed border-border bg-muted/20 px-6 py-12 text-center",
                className,
            )}
        >
            {Icon && (
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[8px] bg-muted">
                    <Icon className="h-5 w-5 text-muted-foreground" />
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
