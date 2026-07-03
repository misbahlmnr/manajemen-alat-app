import { Bell, CheckCheck } from "lucide-react";
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
import { useEffect, useState } from "react";

export default function NotificationDropdown({
    unreadCount = 0,
    notifications = [],
    indexUrl = null,
    className,
}) {
    const [items, setItems] = useState(
        Array.isArray(notifications) ? notifications : [],
    );
    const [unread, setUnread] = useState(Math.max(0, unreadCount));
    const [markingAll, setMarkingAll] = useState(false);

    useEffect(() => {
        setItems(Array.isArray(notifications) ? notifications : []);
        setUnread(Math.max(0, unreadCount));
    }, [notifications, unreadCount]);

    const syncSharedProps = () => {
        router.reload({
            only: ["notifications", "unreadNotifications"],
            preserveScroll: true,
        });
    };

    const openNotification = (item) => {
        const navigate = () => {
            if (item.action_url) {
                router.visit(item.action_url);
            }
        };

        if (item.read) {
            navigate();
            return;
        }

        setItems((prev) =>
            prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)),
        );
        setUnread((count) => Math.max(0, count - 1));

        router.post(route("notifications.read", item.id), {}, {
            preserveScroll: true,
            only: ["notifications", "unreadNotifications"],
            onSuccess: navigate,
            onError: () => syncSharedProps(),
        });
    };

    const markAllRead = (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (unread === 0 || markingAll) {
            return;
        }

        setMarkingAll(true);
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnread(0);

        router.post(route("notifications.read-all"), {}, {
            preserveScroll: true,
            only: ["notifications", "unreadNotifications"],
            onFinish: () => setMarkingAll(false),
            onError: () => syncSharedProps(),
        });
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

            <DropdownMenuContent
                align="end"
                className="w-[calc(100vw-1.5rem)] max-w-80 sm:w-80"
            >
                <DropdownMenuLabel className="flex items-center justify-between gap-2">
                    <span>Notifikasi</span>
                    <div className="flex items-center gap-2">
                        {unread > 0 && (
                            <button
                                type="button"
                                onClick={markAllRead}
                                disabled={markingAll}
                                className="inline-flex items-center gap-1 text-xs font-normal text-primary hover:underline disabled:opacity-50"
                            >
                                <CheckCheck className="h-3.5 w-3.5" />
                                {markingAll ? "..." : "Tandai semua"}
                            </button>
                        )}
                        {indexUrl && (
                            <Link
                                href={indexUrl}
                                className="text-xs font-normal text-primary hover:underline"
                            >
                                Lihat semua
                            </Link>
                        )}
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {items.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                        Belum ada notifikasi
                    </div>
                ) : (
                    items.map((item) => (
                        <DropdownMenuItem
                            key={item.id}
                            className={cn(
                                "cursor-pointer flex-col items-start gap-0.5",
                                !item.read && "bg-primary/5",
                            )}
                            onSelect={(event) => {
                                event.preventDefault();
                                openNotification(item);
                            }}
                        >
                            <span className="flex w-full items-center gap-2 text-sm font-medium">
                                {item.title}
                                {!item.read && (
                                    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                                        Baru
                                    </span>
                                )}
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
