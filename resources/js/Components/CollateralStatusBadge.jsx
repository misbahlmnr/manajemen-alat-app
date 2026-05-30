import { cn } from "@/lib/utils";

const config = {
    dititipkan: {
        label: "Dititipkan",
        dot: "bg-blue-500",
        className: "border-blue-500/20 bg-blue-500/10 text-blue-700",
    },
    ditahan: {
        label: "Digunakan Sebagai Jaminan",
        dot: "bg-violet-500",
        className: "border-violet-500/20 bg-violet-500/10 text-violet-700",
    },
    menunggu_kompensasi: {
        label: "Menunggu Kompensasi",
        dot: "bg-amber-500",
        className: "border-amber-500/20 bg-amber-500/10 text-amber-800",
    },
    dikembalikan: {
        label: "Sudah Diambil",
        dot: "bg-emerald-500",
        className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
    },
    dibatalkan: {
        label: "Dibatalkan",
        dot: "bg-slate-500",
        className: "border-slate-500/20 bg-slate-500/10 text-slate-600",
    },
};

export default function CollateralStatusBadge({ status }) {
    const item = config[status] ?? {
        label: status,
        dot: "bg-muted-foreground",
        className: "border-muted-foreground/20 bg-muted text-muted-foreground",
    };

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                item.className,
            )}
        >
            <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", item.dot)} />
            {item.label}
        </span>
    );
}
