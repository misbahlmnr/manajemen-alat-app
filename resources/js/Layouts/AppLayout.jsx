import FlashMessage from "@/Components/FlashMessage";
import DashboardContent from "@/Components/Layout/DashboardContent";
import DashboardHeader from "@/Components/Layout/DashboardHeader";
import DashboardSidebar from "@/Components/Layout/DashboardSidebar";
import { PageMetaProvider } from "@/Components/Layout/PageMetaContext";
import useRealtimeNotifications from "@/hooks/useRealtimeNotifications";
import useWebPush from "@/hooks/useWebPush";
import { usePage } from "@inertiajs/react";
import { useState } from "react";

export default function AppLayout({ children }) {
    const {
        auth,
        unreadNotifications = 0,
        notifications,
        notificationsIndexUrl = null,
    } = usePage().props;
    const recentNotifications = Array.isArray(notifications)
        ? notifications
        : [];
    const user = auth?.user;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useRealtimeNotifications();
    useWebPush();

    return (
        <PageMetaProvider>
            <div className="flex min-h-screen w-full bg-background">
                <FlashMessage />

                <DashboardSidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />

                <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:ml-64">
                    <DashboardHeader
                        user={user}
                        onMenuClick={() => setSidebarOpen(true)}
                        unreadNotifications={unreadNotifications}
                        notifications={recentNotifications}
                        notificationsIndexUrl={notificationsIndexUrl}
                    />

                    <DashboardContent>
                        <div className="animate-fade-in">{children}</div>
                    </DashboardContent>
                </div>
            </div>
        </PageMetaProvider>
    );
}
