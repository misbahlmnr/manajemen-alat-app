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
    actionVariant = "outline",
    children,
    className,
}) {
    return (
        <section
            className={cn(
                "rounded-[10px] border border-[#E5E7EB] bg-card p-5 shadow-[var(--shadow-card)] sm:p-6",
                className,
            )}
        >
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="flex flex-wrap items-center gap-2 font-display text-base font-semibold text-foreground sm:text-lg">
                        {title}
                        {badge != null && badge > 0 && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
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
                    <Button asChild variant={actionVariant} size="sm">
                        <Link href={actionHref}>
                            {actionLabel}
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                )}
            </div>
            {children}
        </section>
    );
}
