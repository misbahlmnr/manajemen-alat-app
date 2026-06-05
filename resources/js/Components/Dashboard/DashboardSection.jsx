import { Button } from "@/Components/ui/button";
import { Link } from "@inertiajs/react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardSection({
    title,
    description,
    badge,
    actionLabel,
    actionHref = "#",
    actionVariant = "default",
    children,
    className,
}) {
    return (
        <section
            className={cn(
                "rounded-2xl border border-border bg-card p-4 sm:p-6",
                className,
            )}
        >
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                        {title}
                        {badge != null && badge > 0 && (
                            <span className="rounded-full bg-warning px-2 py-0.5 text-xs font-bold text-warning-foreground">
                                {badge}
                            </span>
                        )}
                    </h2>
                    {description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
                {actionLabel && (
                    <Button asChild variant={actionVariant}>
                        <Link href={actionHref}>
                            {actionLabel}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                )}
            </div>
            {children}
        </section>
    );
}
