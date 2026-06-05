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
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-warning/20 bg-warning/10 p-4 sm:flex-row sm:items-start">
            <Bell className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
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
