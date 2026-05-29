import { Link } from "@inertiajs/react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function QuickActionCard({
    href = "#",
    icon: Icon,
    title,
    description,
    accent = "primary",
}) {
    const accents = {
        primary: {
            icon: "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
            link: "text-primary",
            border: "hover:border-primary",
        },
        warning: {
            icon: "bg-warning/10 text-warning group-hover:bg-warning group-hover:text-warning-foreground",
            link: "text-warning",
            border: "hover:border-warning",
        },
    };

    const style = accents[accent] ?? accents.primary;

    return (
        <Link
            href={href}
            className={cn(
                "group rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-md",
                style.border,
            )}
        >
            <div
                className={cn(
                    "mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
                    style.icon,
                )}
            >
                <Icon className="h-6 w-6" />
            </div>
            <h3 className="mb-1 text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
            <span
                className={cn(
                    "mt-4 inline-flex items-center text-sm font-medium",
                    style.link,
                )}
            >
                Mulai <ArrowRight className="ml-1 h-4 w-4" />
            </span>
        </Link>
    );
}
