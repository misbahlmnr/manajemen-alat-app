import { usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import FlashMessage from "@/Components/FlashMessage";
import DashboardSidebar from "@/Components/Layout/DashboardSidebar";
import DashboardHeader from "@/Components/Layout/DashboardHeader";
import DashboardContent from "@/Components/Layout/DashboardContent";
import { cn } from "@/lib/utils";
import { NAVBAR_ITEMS } from "@/Constant";

export default function AppLayout({ children, title, subtitle }) {
    const user = usePage().props.auth.user;
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    const navExpanded = sidebarOpen || mobileNavOpen;

    useEffect(() => {
        const mq = window.matchMedia("(min-width: 768px)");
        const onChange = () => {
            if (mq.matches) {
                setMobileNavOpen(false);
            }
        };
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, []);

    const closeMobileNav = () => setMobileNavOpen(false);

    return (
        <div className="min-h-screen bg-background">
            <FlashMessage />

            {mobileNavOpen && (
                <button
                    type="button"
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] md:hidden"
                    aria-label="Tutup menu"
                    onClick={closeMobileNav}
                />
            )}

            <div className="flex min-h-screen">
                <div
                    className={cn(
                        "fixed inset-y-0 left-0 z-50 md:static md:z-auto",
                        "transition-transform duration-200 ease-out md:translate-x-0",
                        mobileNavOpen
                            ? "translate-x-0"
                            : "-translate-x-full md:translate-x-0",
                    )}
                >
                    <DashboardSidebar
                        menuItems={NAVBAR_ITEMS}
                        navExpanded={navExpanded}
                        onNavigate={closeMobileNav}
                        onRequestWiden={() => setSidebarOpen(true)}
                    />
                </div>

                <div className="flex min-w-0 flex-1 flex-col md:min-h-screen">
                    <DashboardHeader
                        user={user}
                        title={title}
                        subtitle={subtitle}
                        sidebarOpen={sidebarOpen}
                        onToggleSidebar={() => setSidebarOpen((o) => !o)}
                        onOpenMobileNav={() => setMobileNavOpen(true)}
                    />
                    <DashboardContent>{children}</DashboardContent>
                </div>
            </div>
        </div>
    );
}
