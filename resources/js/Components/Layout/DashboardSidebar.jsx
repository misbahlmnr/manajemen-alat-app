import BrandLogo from "@/Components/BrandLogo";
import { isNavItemActive, resolveMenuItems } from "@/Constant";
import { cn } from "@/lib/utils";
import { Link, usePage } from "@inertiajs/react";
import { X } from "lucide-react";

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

    return (
        <>
            {isOpen && (
                <button
                    type="button"
                    className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-[2px] transition-opacity lg:hidden"
                    aria-label="Tutup menu"
                    onClick={onClose}
                />
            )}

            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col gradient-hero",
                    "border-r border-sidebar-border/60",
                    "transform transition-transform duration-300 ease-out",
                    isOpen
                        ? "translate-x-0"
                        : "-translate-x-full lg:translate-x-0",
                )}
            >
                <div className="border-b border-sidebar-border/60 px-5 py-5">
                    <div className="flex items-center justify-between gap-2">
                        <Link
                            href={route("dashboard")}
                            onClick={onClose}
                            className="flex min-w-0 items-center gap-3 rounded-[8px] transition-opacity hover:opacity-90"
                        >
                            <BrandLogo
                                size={48}
                                variant="onDark"
                            />
                            <div className="min-w-0">
                                <h1 className="truncate font-display text-[13px] font-bold leading-snug text-sidebar-foreground">
                                    {appName}
                                </h1>
                                <p className="truncate text-[11px] text-sidebar-foreground/55">
                                    {appSubtitle}
                                </p>
                            </div>
                        </Link>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-10 w-10 items-center justify-center rounded-[8px] text-sidebar-foreground/60 transition-colors hover:bg-white/5 hover:text-sidebar-foreground lg:hidden"
                            aria-label="Tutup sidebar"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto px-3 py-4">
                    <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                        Menu
                    </p>
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
                                        <Icon
                                            className={cn(
                                                "h-5 w-5 shrink-0 transition-colors",
                                                active
                                                    ? "text-primary"
                                                    : "text-sidebar-foreground/50",
                                            )}
                                        />
                                        <span className="truncate">
                                            {item.label}
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="border-t border-sidebar-border/60 px-4 py-4">
                    <p className="px-1 text-[11px] leading-relaxed text-sidebar-foreground/40">
                        Laboratorium operasional jurusan Teknik Audio Video.
                    </p>
                </div>
            </aside>
        </>
    );
}
