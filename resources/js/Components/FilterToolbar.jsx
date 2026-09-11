import { cn } from "@/lib/utils";

/**
 * Panel filter workspace — card dengan padding lega.
 */
export default function FilterToolbar({
    title = "Filter",
    description,
    children,
    className,
}) {
    return (
        <div
            className={cn(
                "mb-6 rounded-xl border bg-card p-6 shadow-sm",
                className,
            )}
        >
            {(title || description) && (
                <div className="mb-4">
                    {title && (
                        <p className="text-sm font-semibold text-foreground">
                            {title}
                        </p>
                    )}
                    {description && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
            )}
            {children}
        </div>
    );
}
