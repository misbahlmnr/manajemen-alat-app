import { Button } from "@/Components/ui/button";
import { Link } from "@inertiajs/react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const iconTones = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    info: "bg-sky-50 text-sky-700",
    warning: "bg-amber-50 text-amber-700",
    success: "bg-emerald-50 text-emerald-700",
    danger: "bg-red-50 text-red-700",
};

const badgeTones = {
    default: "bg-secondary text-secondary-foreground",
    warning: "bg-amber-50 text-amber-800",
    danger: "bg-red-50 text-red-700",
    success: "bg-emerald-50 text-emerald-700",
    info: "bg-sky-50 text-sky-700",
};

export function DashboardSection({
    title,
    description,
    badge,
    badgeTone = "default",
    icon: Icon,
    iconTone = "default",
    actionLabel,
    actionHref = "#",
    actionVariant = "outline",
    children,
    className,
}) {
    return (
        <section
            className={cn(
                "rounded-xl border bg-card p-6 shadow-sm",
                className,
            )}
        >
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="flex flex-wrap items-center gap-2 font-display text-base font-semibold text-foreground sm:text-lg">
                        {Icon && (
                            <span
                                className={cn(
                                    "inline-flex h-8 w-8 items-center justify-center rounded-md",
                                    iconTones[iconTone] ?? iconTones.default,
                                )}
                            >
                                <Icon className="h-4 w-4" />
                            </span>
                        )}
                        {title}
                        {badge != null && badge > 0 && (
                            <span
                                className={cn(
                                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                    badgeTones[badgeTone] ?? badgeTones.default,
                                )}
                            >
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
