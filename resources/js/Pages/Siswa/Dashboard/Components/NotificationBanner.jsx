import { Button } from "@/Components/ui/button";
import { Link } from "@inertiajs/react";
import { Bell } from "lucide-react";

export default function NotificationBanner({
    notifications = [],
    unreadCount = 0,
    indexUrl = null,
}) {
    const unread = unreadCount || notifications.filter((n) => !n.read).length;
    const latest = notifications.find((n) => !n.read) ?? notifications[0];

    if (!unread || !latest) return null;

    return (
        <div className="mb-6 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-start">
            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700">
                <Bell className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="font-medium">{unread} notifikasi belum dibaca</p>
                <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                    {latest.message}
                </p>
            </div>
            <Button asChild variant="outline" size="sm">
                <Link href={indexUrl ?? route("siswa.notifications.index")}>
                    Buka
                </Link>
            </Button>
        </div>
    );
}
