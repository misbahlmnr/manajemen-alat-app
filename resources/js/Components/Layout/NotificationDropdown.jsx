import { Bell } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Link, router } from "@inertiajs/react";

export default function NotificationDropdown({
    unreadCount = 0,
    notifications = [],
    indexUrl = null,
    className,
}) {
    const unread = Math.max(0, unreadCount);

    const openNotification = (item) => {
        if (!item.read) {
            router.post(
                route("notifications.read", item.id),
                {},
                { preserveScroll: true, preserveState: true },
            );
        }

        if (item.action_url) {
            router.visit(item.action_url);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "relative rounded-lg p-2 hover:bg-secondary",
                        className,
                    )}
                    aria-label="Notifikasi"
                >
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    {unread > 0 && (
                        <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-destructive-foreground">
                            {unread > 9 ? "9+" : unread}
                        </span>
                    )}
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifikasi</span>
                    {indexUrl && (
                        <Link
                            href={indexUrl}
                            className="text-xs font-normal text-primary hover:underline"
                        >
                            Lihat semua
                        </Link>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {notifications.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                        Belum ada notifikasi
                    </div>
                ) : (
                    notifications.map((item) => (
                        <DropdownMenuItem
                            key={item.id}
                            className={cn(
                                "cursor-pointer flex-col items-start gap-0.5",
                                !item.read && "bg-primary/5",
                            )}
                            onClick={() => openNotification(item)}
                        >
                            <span className="text-sm font-medium">
                                {item.title}
                            </span>
                            {item.message && (
                                <span className="text-xs text-muted-foreground line-clamp-2">
                                    {item.message}
                                </span>
                            )}
                            <span className="text-[10px] text-muted-foreground">
                                {item.created_at_human}
                            </span>
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
