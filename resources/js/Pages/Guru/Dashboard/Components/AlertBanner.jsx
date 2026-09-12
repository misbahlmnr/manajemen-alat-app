import { Button } from "@/Components/ui/button";
import { Link } from "@inertiajs/react";
import { AlertTriangle, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AlertBanner({ notifications, indexUrl = null }) {
    if (!notifications?.length) return null;

    const hasError = notifications.some((n) => n.type === "error");
    const Icon = hasError ? AlertTriangle : Bell;

    return (
        <div
            className={cn(
                "mb-6 flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start",
                hasError
                    ? "border-red-200 bg-red-50"
                    : "border-amber-200 bg-amber-50",
            )}
        >
            <span
                className={cn(
                    "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                    hasError
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700",
                )}
            >
                <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">
                    {notifications.length} alert penting
                </p>
                <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                    {notifications[0]?.message}
                </p>
            </div>
            <Button asChild variant="outline" size="sm">
                <Link href={indexUrl ?? route("guru.notifications.index")}>
                    Buka
                </Link>
            </Button>
        </div>
    );
}
