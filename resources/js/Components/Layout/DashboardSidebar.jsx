import { Link } from "@inertiajs/react";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Boxes, ChevronDown, ChevronRight } from "lucide-react";

export default function DashboardSidebar({
    menuItems,
    navExpanded,
    onNavigate,
    onRequestWiden,
    appName = "Manajemen Alat",
}) {
    const [expandedMenus, setExpandedMenus] = useState({});

    const showLabels = navExpanded;

    return (
        <aside
            className={cn(
                "flex h-full shrink-0 flex-col border-r border-primary/20 bg-primary text-primary-foreground",
                "transition-[width] duration-200 ease-out",
                navExpanded ? "w-64" : "w-[4.5rem]",
            )}
        >
            <div
                className={cn(
                    "flex h-14 items-center border-b border-primary-foreground/10 px-3",
                    !showLabels && "justify-center px-2",
                )}
            >
                <Link
                    href={route("dashboard")}
                    onClick={onNavigate}
                    className={cn(
                        "flex min-w-0 items-center gap-2 rounded-md py-2 text-primary-foreground transition hover:bg-primary-foreground/10",
                        showLabels ? "px-2" : "justify-center px-0",
                    )}
                >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-foreground/15">
                        <Boxes className="h-4 w-4" aria-hidden />
                    </span>
                    {showLabels && (
                        <span className="truncate font-display text-sm font-bold tracking-tight">
                            {appName}
                        </span>
                    )}
                </Link>
            </div>

            <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
                {menuItems.map((item) => (
                    <div key={item.label} className="px-2">
                        {item.children ? (
                            <div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!showLabels) {
                                            onRequestWiden?.();
                                            return;
                                        }
                                        setExpandedMenus((prev) => ({
                                            ...prev,
                                            [item.label]: !prev[item.label],
                                        }));
                                    }}
                                    className={cn(
                                        "flex w-full items-center gap-2 rounded-md py-2.5 text-sm font-medium text-primary-foreground/95 transition hover:bg-primary-foreground/10",
                                        showLabels
                                            ? "px-2"
                                            : "justify-center px-0",
                                    )}
                                    title={!showLabels ? item.label : undefined}
                                >
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center">
                                        <item.icon className="h-4 w-4" />
                                    </span>
                                    {showLabels && (
                                        <>
                                            <span className="min-w-0 flex-1 truncate text-left">
                                                {item.label}
                                            </span>
                                            {expandedMenus[item.label] ? (
                                                <ChevronDown className="h-4 w-4 shrink-0 opacity-80" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4 shrink-0 opacity-80" />
                                            )}
                                        </>
                                    )}
                                </button>
                                {showLabels &&
                                    item.children &&
                                    expandedMenus[item.label] && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{
                                                opacity: 1,
                                                height: "auto",
                                            }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-0.5 space-y-0.5 overflow-hidden border-l border-primary-foreground/15 pl-2 ml-3"
                                        >
                                            {item.children.map((child) => (
                                                <Link
                                                    key={child.label}
                                                    href={child.href}
                                                    onClick={onNavigate}
                                                    className="flex items-center gap-2 rounded-md py-2 pl-2 pr-2 text-sm text-primary-foreground/80 transition hover:bg-primary-foreground/10 hover:text-primary-foreground"
                                                >
                                                    <child.icon className="h-3.5 w-3.5 shrink-0 opacity-90" />
                                                    <span className="truncate">
                                                        {child.label}
                                                    </span>
                                                </Link>
                                            ))}
                                        </motion.div>
                                    )}
                            </div>
                        ) : (
                            <Link
                                href={item.href}
                                onClick={onNavigate}
                                title={!showLabels ? item.label : undefined}
                                className={cn(
                                    "mb-0.5 flex items-center gap-2 rounded-md py-2.5 text-sm font-medium text-primary-foreground/95 transition hover:bg-primary-foreground/10",
                                    showLabels ? "px-2" : "justify-center px-0",
                                )}
                            >
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center">
                                    <item.icon className="h-4 w-4" />
                                </span>
                                {showLabels && (
                                    <span className="truncate">
                                        {item.label}
                                    </span>
                                )}
                            </Link>
                        )}
                    </div>
                ))}
            </nav>
        </aside>
    );
}
