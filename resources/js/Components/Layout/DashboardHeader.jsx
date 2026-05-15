import { Button } from "@/components/ui/button";
import { Menu, PanelLeftClose, PanelLeft } from "lucide-react";
import UserMenu from "@/Components/Layout/UserMenu";
import { cn } from "@/lib/utils";

export default function DashboardHeader({
    user,
    title,
    subtitle,
    sidebarOpen,
    onToggleSidebar,
    onOpenMobileNav,
    className,
}) {
    return (
        <header
            className={cn(
                "sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:px-6",
                className,
            )}
        >
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={onOpenMobileNav}
                aria-label="Buka menu"
            >
                <Menu className="h-5 w-5" />
            </Button>

            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="hidden text-muted-foreground hover:text-foreground md:inline-flex"
                onClick={onToggleSidebar}
                aria-label={sidebarOpen ? "Ciutkan sidebar" : "Lebarkan sidebar"}
            >
                {sidebarOpen ? (
                    <PanelLeftClose className="h-5 w-5" />
                ) : (
                    <PanelLeft className="h-5 w-5" />
                )}
            </Button>

            <div className="min-w-0 flex-1">
                {title && (
                    <h1 className="truncate font-display text-lg font-semibold text-foreground md:text-xl">
                        {title}
                    </h1>
                )}
                {subtitle && (
                    <p className="truncate text-xs text-muted-foreground md:text-sm">
                        {subtitle}
                    </p>
                )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
                <UserMenu user={user} />
            </div>
        </header>
    );
}
