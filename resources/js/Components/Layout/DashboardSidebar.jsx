import BrandLogo from "@/Components/BrandLogo";
import {
    isNavGroupActive,
    isNavItemActive,
    resolveMenuItems,
} from "@/Constant";
import { cn } from "@/lib/utils";
import { Link, usePage } from "@inertiajs/react";
import { ChevronDown, X } from "lucide-react";
import { useEffect, useState } from "react";

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
                    "fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col bg-sidebar",
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
                            <BrandLogo size={48} variant="onDark" />
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
                            if (item.type === "group") {
                                return (
                                    <NavGroup
                                        key={item.key}
                                        item={item}
                                        currentUrl={currentUrl}
                                        onClose={onClose}
                                    />
                                );
                            }

                            return (
                                <NavItem
                                    key={item.key}
                                    item={item}
                                    currentUrl={currentUrl}
                                    onClose={onClose}
                                />
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

function NavGroup({ item, currentUrl, onClose }) {
    const childActive = isNavGroupActive(item, currentUrl);
    const [open, setOpen] = useState(childActive);
    const Icon = item.icon;

    useEffect(() => {
        if (childActive) {
            setOpen(true);
        }
    }, [childActive]);

    return (
        <li>
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="nav-link w-full"
                aria-expanded={open}
            >
                {Icon && (
                    <Icon
                        className={cn(
                            "h-5 w-5 shrink-0 transition-colors",
                            childActive
                                ? "text-primary"
                                : "text-sidebar-foreground/50",
                        )}
                    />
                )}
                <span className="min-w-0 flex-1 truncate text-left">
                    {item.label}
                </span>
                <ChevronDown
                    className={cn(
                        "h-4 w-4 shrink-0 text-sidebar-foreground/40 transition-transform",
                        open && "rotate-180",
                    )}
                />
            </button>
            {open && (
                <ul className="mt-1 space-y-1 border-l border-sidebar-border/50 ml-5 pl-2">
                    {(item.items ?? []).map((child) => (
                        <NavItem
                            key={child.key}
                            item={child}
                            currentUrl={currentUrl}
                            onClose={onClose}
                            nested
                        />
                    ))}
                </ul>
            )}
        </li>
    );
}

function NavItem({ item, currentUrl, onClose, nested = false }) {
    const Icon = item.icon;
    const active = isNavItemActive(item, currentUrl);

    return (
        <li>
            <Link
                href={item.href}
                onClick={onClose}
                className={cn(
                    "nav-link",
                    nested && "min-h-9 py-1.5 text-[13px]",
                    active && "nav-link-active",
                )}
            >
                {Icon && (
                    <Icon
                        className={cn(
                            "shrink-0 transition-colors",
                            nested ? "h-4 w-4" : "h-5 w-5",
                            active
                                ? "text-primary"
                                : "text-sidebar-foreground/50",
                        )}
                    />
                )}
                <span className="truncate">{item.label}</span>
            </Link>
        </li>
    );
}
