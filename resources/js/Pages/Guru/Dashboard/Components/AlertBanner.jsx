import { Button } from "@/Components/ui/button";
import { Link } from "@inertiajs/react";
import { Bell } from "lucide-react";

export default function AlertBanner({ notifications, indexUrl = null }) {
    if (!notifications?.length) return null;

    return (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-warning/20 bg-warning/10 p-4 sm:flex-row sm:items-start">
            <Bell className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
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
