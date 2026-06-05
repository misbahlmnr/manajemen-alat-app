import LiveDate from "@/Components/Layout/LiveDate";
import NotificationDropdown from "@/Components/Layout/NotificationDropdown";
import UserMenu from "@/Components/Layout/UserMenu";
import { roleSubtitle } from "@/Constant";
import { cn } from "@/lib/utils";

export default function DashboardHeader({
    user,
    unreadNotifications = 0,
    notifications = [],
    notificationsIndexUrl = null,
    className,
}) {
    return (
        <header
            className={cn(
                "sticky top-0 z-30 flex h-16 shrink-0 items-center justify-end border-b border-border bg-card px-4 lg:px-6",
                className,
            )}
        >
            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
                <LiveDate className="hidden text-sm text-muted-foreground sm:block" />

                <NotificationDropdown
                    unreadCount={unreadNotifications}
                    notifications={notifications}
                    indexUrl={notificationsIndexUrl}
                />

                <div className="flex items-center gap-2 sm:gap-3">
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
