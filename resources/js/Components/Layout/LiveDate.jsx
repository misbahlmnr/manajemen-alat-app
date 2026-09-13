import { parseAppClock } from "@/lib/appClock";
import { usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
});

export default function LiveDate({ className }) {
    const clockProp = usePage().props.clock;
    const { now, isFake } = parseAppClock(clockProp);
    const [label, setLabel] = useState(() => dateFormatter.format(now));

    useEffect(() => {
        const current = parseAppClock(clockProp).now;
        setLabel(dateFormatter.format(current));

        if (isFake) {
            return undefined;
        }

        const tick = () => setLabel(dateFormatter.format(new Date()));
        const id = window.setInterval(tick, 60_000);
        return () => window.clearInterval(id);
    }, [isFake, clockProp?.now]);

    return (
        <time dateTime={now.toISOString()} className={className}>
            {label}
        </time>
    );
}
