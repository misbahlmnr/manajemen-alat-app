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
                "mb-6 rounded-[10px] border border-[#E5E7EB] bg-card p-5 shadow-[var(--shadow-card)]",
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
