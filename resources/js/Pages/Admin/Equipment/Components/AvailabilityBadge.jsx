import { cn } from "@/lib/utils";

const config = {
    tersedia: {
        label: "Tersedia",
        className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    },
    dipinjam: {
        label: "Sebagian Dipinjam",
        className: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    },
    habis: {
        label: "Habis",
        className: "bg-red-500/10 text-red-700 border-red-500/20",
    },
    rusak: {
        label: "Rusak",
        className: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    },
    nonaktif: {
        label: "Nonaktif",
        className: "bg-muted text-muted-foreground border-border",
    },
};

export default function AvailabilityBadge({ label }) {
    const item = config[label] ?? config.tersedia;

    return (
        <span
            className={cn(
                "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium max-w-max",
                item.className,
            )}
        >
            {item.label}
        </span>
    );
}
