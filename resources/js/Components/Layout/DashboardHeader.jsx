import LiveDate from "@/Components/Layout/LiveDate";
import NotificationDropdown from "@/Components/Layout/NotificationDropdown";
import UserMenu from "@/Components/Layout/UserMenu";
import { roleSubtitle } from "@/Constant";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";

export default function DashboardHeader({
    user,
    onMenuClick,
    unreadNotifications = 0,
    notifications = [],
    notificationsIndexUrl = null,
    className,
}) {
    return (
        <header
            className={cn(
                "sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-3 sm:h-16 sm:px-4 lg:px-6",
                className,
            )}
        >
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <button
                    type="button"
                    onClick={onMenuClick}
                    className="rounded-lg p-2 hover:bg-secondary lg:hidden"
                    aria-label="Buka menu"
                >
                    <Menu className="h-5 w-5 text-foreground" />
                </button>
                <div className="min-w-0 lg:hidden">
                    <p className="truncate text-sm font-semibold text-foreground">
                        Lab Audio Video
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                        {roleSubtitle(user) || "Dashboard"}
                    </p>
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-4">
                <LiveDate className="hidden text-sm text-muted-foreground md:block" />

                <NotificationDropdown
                    unreadCount={unreadNotifications}
                    notifications={notifications}
                    indexUrl={notificationsIndexUrl}
                />

                <div className="flex items-center gap-1.5 sm:gap-3">
                    <UserMenu user={user} />
                    <div className="hidden min-w-0 lg:block">
                        <p className="truncate text-sm font-medium text-foreground">
                            {user?.name}
                        </p>
                        <p className="truncate text-xs capitalize text-muted-foreground">
                            {roleSubtitle(user)}
                        </p>
                    </div>
                </div>
            </div>
        </header>
    );
}
