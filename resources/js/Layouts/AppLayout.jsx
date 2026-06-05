import { useState } from "react";
import FlashMessage from "@/Components/FlashMessage";
import DashboardSidebar from "@/Components/Layout/DashboardSidebar";
import DashboardHeader from "@/Components/Layout/DashboardHeader";
import DashboardContent from "@/Components/Layout/DashboardContent";
import useRealtimeNotifications from "@/hooks/useRealtimeNotifications";
import useWebPush from "@/hooks/useWebPush";
import { usePage } from "@inertiajs/react";

export default function AppLayout({ children }) {
    const {
        auth,
        unreadNotifications = 0,
        notifications = [],
        notificationsIndexUrl = null,
    } = usePage().props;
    const user = auth?.user;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useRealtimeNotifications();
    useWebPush();

    return (
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
                    notifications={notifications}
                    notificationsIndexUrl={notificationsIndexUrl}
                />

                <DashboardContent>{children}</DashboardContent>
            </div>
        </div>
    );
}
