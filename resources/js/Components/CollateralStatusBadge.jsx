import { cn } from "@/lib/utils";

const config = {
    dititipkan: {
        label: "Belum diterima",
        dot: "bg-slate-500",
        className: "border-slate-200 bg-slate-100 text-slate-700",
    },
    ditahan: {
        label: "Ditahan",
        dot: "bg-amber-600/70",
        className: "border-amber-200/60 bg-amber-50/80 text-amber-950/70",
    },
    menunggu_kompensasi: {
        label: "Menunggu Kompensasi",
        dot: "bg-amber-600/80",
        className: "border-amber-200/80 bg-amber-50 text-amber-900/80",
    },
    dikembalikan: {
        label: "Sudah dikembalikan",
        dot: "bg-slate-600",
        className: "border-slate-200 bg-slate-100 text-slate-700",
    },
    dibatalkan: {
        label: "Dibatalkan",
        dot: "bg-slate-400",
        className: "border-slate-200 bg-slate-50 text-slate-600",
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
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none",
                item.className,
            )}
        >
            <span className={cn("mr-1.5 h-1.5 w-1.5 shrink-0 rounded-full", item.dot)} />
            {item.label}
        </span>
    );
}
