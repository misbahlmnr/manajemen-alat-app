import Echo from "laravel-echo";
import Pusher from "pusher-js";

let echoInstance = null;

export function initEcho(config) {
    if (!config?.enabled || !config?.key || echoInstance) {
        return echoInstance;
    }

    window.Pusher = Pusher;

    echoInstance = new Echo({
        broadcaster: "pusher",
        key: config.key,
        cluster: config.cluster ?? "mt1",
        forceTLS: true,
        authEndpoint: "/broadcasting/auth",
        auth: {
            headers: {
                "X-CSRF-TOKEN":
                    document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute("content") ?? "",
            },
        },
    });

    return echoInstance;
}

export function getEcho() {
    return echoInstance;
}
