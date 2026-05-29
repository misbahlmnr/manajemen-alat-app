import { useEffect, useState } from "react";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
});

export default function LiveDate({ className }) {
    const [label, setLabel] = useState(() => dateFormatter.format(new Date()));

    useEffect(() => {
        const tick = () => setLabel(dateFormatter.format(new Date()));
        const id = window.setInterval(tick, 60_000);
        return () => window.clearInterval(id);
    }, []);

    return <time dateTime={new Date().toISOString()} className={className}>{label}</time>;
}
