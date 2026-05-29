import { cn } from "@/lib/utils";

export function EmptyState({ icon: Icon, title, description, className }) {
    return (
        <div className={cn("py-10 text-center", className)}>
            {Icon && (
                <Icon className="mx-auto mb-2 h-10 w-10 text-success" />
            )}
            {title && (
                <p className="text-sm font-medium text-foreground">{title}</p>
            )}
            {description && (
                <p className="mt-1 text-sm text-muted-foreground">
                    {description}
                </p>
            )}
        </div>
    );
}
