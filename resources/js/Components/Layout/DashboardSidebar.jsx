import { Link, router, usePage } from "@inertiajs/react";
import { Camera, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { isNavItemActive, resolveMenuItems } from "@/Constant";

export default function DashboardSidebar({
    isOpen,
    onClose,
    appName = "Lab Audio Video",
    appSubtitle = "SMKN 7 Bekasi",
}) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const currentUrl = usePage().url;
    const menuItems = resolveMenuItems(user?.role);

    const handleLogout = () => {
        router.post(route("logout"));
    };

    return (
        <>
            {isOpen && (
                <button
                    type="button"
                    className="fixed inset-0 z-40 bg-foreground/50 lg:hidden"
                    aria-label="Tutup menu"
                    onClick={onClose}
                />
            )}

            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 flex w-64 flex-col gradient-hero",
                    "transform transition-transform duration-300 ease-in-out lg:static",
                    isOpen
                        ? "translate-x-0"
                        : "-translate-x-full lg:translate-x-0",
                )}
            >
                <div className="border-b border-sidebar-border p-6">
                    <div className="flex items-center justify-between">
                        <Link
                            href={route("dashboard")}
                            onClick={onClose}
                            className="flex min-w-0 items-center gap-3"
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
                                <Camera className="h-6 w-6 text-sidebar-primary-foreground" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="truncate font-display text-sm font-bold text-sidebar-foreground">
                                    {appName}
                                </h1>
                                <p className="truncate text-xs text-sidebar-foreground/60">
                                    {appSubtitle}
                                </p>
                            </div>
                        </Link>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1 text-sidebar-foreground/60 hover:text-sidebar-foreground lg:hidden"
                            aria-label="Tutup sidebar"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto p-4">
                    <ul className="space-y-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const active = isNavItemActive(item, currentUrl);

                            return (
                                <li key={item.key}>
                                    <Link
                                        href={item.href}
                                        onClick={onClose}
                                        className={cn(
                                            "nav-link",
                                            active && "nav-link-active",
                                        )}
                                    >
                                        <Icon className="h-5 w-5 shrink-0" />
                                        <span>{item.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </aside>
        </>
    );
}
