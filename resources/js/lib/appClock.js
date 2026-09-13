import { usePage } from "@inertiajs/react";

function pad(value) {
    return String(value).padStart(2, "0");
}

export function formatLocalDate(date) {
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) {
        return "";
    }

    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseAppClock(clock) {
    const now = clock?.now ? new Date(clock.now) : new Date();
    const validNow = Number.isNaN(now.getTime()) ? new Date() : now;

    return {
        now: validNow,
        today: clock?.today || formatLocalDate(validNow),
        isFake: Boolean(clock?.is_fake),
        label: clock?.label ?? "",
    };
}

export function useAppClock() {
    return parseAppClock(usePage().props.clock);
}
