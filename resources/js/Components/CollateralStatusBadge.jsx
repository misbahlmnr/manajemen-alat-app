import { cn } from "@/lib/utils";

const config = {
    dititipkan: {
        label: "Belum diterima",
        dot: "bg-blue-500",
        className: "border-transparent bg-blue-50 text-blue-700",
    },
    ditahan: {
        label: "Ditahan",
        dot: "bg-amber-500",
        className: "border-transparent bg-amber-50 text-amber-800",
    },
    menunggu_kompensasi: {
        label: "Menunggu Kompensasi",
        dot: "bg-amber-500",
        className: "border-transparent bg-amber-50 text-amber-800",
    },
    dikembalikan: {
        label: "Sudah dikembalikan",
        dot: "bg-emerald-500",
        className: "border-transparent bg-emerald-50 text-emerald-700",
    },
    dibatalkan: {
        label: "Dibatalkan",
        dot: "bg-muted-foreground",
        className: "border-transparent bg-muted text-muted-foreground",
    },
};

export default function CollateralStatusBadge({ status }) {
    const item = config[status] ?? {
        label: status,
        dot: "bg-muted-foreground",
        className: "border-transparent bg-muted text-muted-foreground",
    };

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-none",
                item.className,
            )}
        >
            <span className={cn("mr-1.5 h-1.5 w-1.5 shrink-0 rounded-full", item.dot)} />
            {item.label}
        </span>
    );
}
