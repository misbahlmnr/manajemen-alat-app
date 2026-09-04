import LiveDate from "@/Components/Layout/LiveDate";
import NotificationDropdown from "@/Components/Layout/NotificationDropdown";
import { usePageMeta } from "@/Components/Layout/PageMetaContext";
import UserMenu from "@/Components/Layout/UserMenu";
import { roleSubtitle } from "@/Constant";
import { cn } from "@/lib/utils";
import { Link } from "@inertiajs/react";
import { ChevronRight, Menu } from "lucide-react";

export default function DashboardHeader({
    user,
    onMenuClick,
    unreadNotifications = 0,
    notifications = [],
    notificationsIndexUrl = null,
    className,
}) {
    const { title, breadcrumbs } = usePageMeta();

    return (
        <header
            className={cn(
                "sticky top-0 z-30 flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-card/90 px-3 backdrop-blur-md sm:min-h-16 sm:px-5 lg:px-7",
                className,
            )}
        >
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                <button
                    type="button"
                    onClick={onMenuClick}
                    className="flex h-10 w-10 items-center justify-center rounded-[8px] hover:bg-muted lg:hidden"
                    aria-label="Buka menu"
                >
                    <Menu className="h-5 w-5 text-foreground" />
                </button>

                <div className="min-w-0">
                    {breadcrumbs?.length > 0 ? (
                        <nav
                            aria-label="Breadcrumb"
                            className="mb-0.5 hidden items-center gap-1 text-xs text-muted-foreground sm:flex"
                        >
                            {breadcrumbs.map((crumb, index) => {
                                const isLast = index === breadcrumbs.length - 1;
                                return (
                                    <span
                                        key={`${crumb.label}-${index}`}
                                        className="inline-flex items-center gap-1"
                                    >
                                        {index > 0 && (
                                            <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                                        )}
                                        {crumb.href && !isLast ? (
                                            <Link
                                                href={crumb.href}
                                                className="truncate transition-colors hover:text-foreground"
                                            >
                                                {crumb.label}
                                            </Link>
                                        ) : (
                                            <span
                                                className={cn(
                                                    "truncate",
                                                    isLast && "text-foreground/80",
                                                )}
                                            >
                                                {crumb.label}
                                            </span>
                                        )}
                                    </span>
                                );
                            })}
                        </nav>
                    ) : null}

                    <h1 className="truncate font-display text-sm font-semibold tracking-tight text-foreground sm:text-base">
                        {title || "Dashboard"}
                    </h1>
                    <p className="truncate text-xs text-muted-foreground lg:hidden">
                        {roleSubtitle(user) || "Lab Audio Video"}
                    </p>
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
                <LiveDate className="hidden text-sm text-muted-foreground md:block" />

                <NotificationDropdown
                    unreadCount={unreadNotifications}
                    notifications={notifications}
                    indexUrl={notificationsIndexUrl}
                />

                <div className="flex items-center gap-2 sm:gap-3 sm:pl-1">
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
