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

export default function NotificationDropdown({
    unreadCount = 0,
    notifications = [],
    className,
}) {
    const unread = Math.max(0, unreadCount);

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
                <DropdownMenuLabel>Notifikasi</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {notifications.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                        Belum ada notifikasi
                    </div>
                ) : (
                    notifications.map((item) => (
                        <DropdownMenuItem
                            key={item.id}
                            className="cursor-pointer flex-col items-start gap-0.5"
                        >
                            <span className="text-sm font-medium">
                                {item.title}
                            </span>
                            {item.message && (
                                <span className="text-xs text-muted-foreground line-clamp-2">
                                    {item.message}
                                </span>
                            )}
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
