import { router, usePage } from "@inertiajs/react";
import { useEffect, useRef } from "react";

function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}

export default function useWebPush() {
    const { webPush } = usePage().props;
    const prompted = useRef(false);

    useEffect(() => {
        if (
            !webPush?.enabled ||
            !webPush?.publicKey ||
            prompted.current ||
            !("serviceWorker" in navigator) ||
            !("PushManager" in window) ||
            Notification.permission === "denied"
        ) {
            return undefined;
        }

        prompted.current = true;

        const register = async () => {
            try {
                const registration = await navigator.serviceWorker.register("/sw.js");
                let subscription = await registration.pushManager.getSubscription();

                if (!subscription && Notification.permission === "default") {
                    const permission = await Notification.requestPermission();
                    if (permission !== "granted") {
                        return;
                    }
                }

                if (!subscription) {
                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(webPush.publicKey),
                    });
                }

                const payload = subscription.toJSON();

                await window.axios.post(route("notifications.push.subscribe"), {
                    endpoint: payload.endpoint,
                    keys: payload.keys,
                    contentEncoding: "aesgcm",
                });
            } catch {
                // Browser may block push without user gesture — ignore silently.
            }
        };

        register();

        return undefined;
    }, [webPush?.enabled, webPush?.publicKey]);
}
