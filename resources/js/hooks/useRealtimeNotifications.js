import { initEcho } from "@/lib/echo";
import { router, usePage } from "@inertiajs/react";
import { useEffect } from "react";
import toast from "react-hot-toast";

export default function useRealtimeNotifications() {
    const { auth, broadcasting } = usePage().props;
    const userId = auth?.user?.id;

    useEffect(() => {
        if (!broadcasting?.enabled || !userId) {
            return undefined;
        }

        const echo = initEcho(broadcasting);
        if (!echo) {
            return undefined;
        }

        const channel = echo.private(`App.Models.User.${userId}`);

        channel.notification((notification) => {
            router.reload({
                only: ["notifications", "unreadNotifications"],
            });

            toast(notification.title ?? "Notifikasi baru", {
                icon: notification.severity === "error" ? "⚠️" : "🔔",
            });
        });

        return () => {
            echo.leave(`private-App.Models.User.${userId}`);
        };
    }, [broadcasting?.enabled, broadcasting?.key, userId]);
}
