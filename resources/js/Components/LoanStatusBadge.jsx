import { cn } from "@/lib/utils";

const config = {
    diminta: {
        label: "Menunggu Persetujuan",
        dot: "bg-blue-500",
        className: "border-blue-500/20 bg-blue-500/10 text-blue-700",
    },
    antrian: {
        label: "Antrian",
        dot: "bg-amber-500",
        className: "border-amber-500/20 bg-amber-500/10 text-amber-800",
    },
    disetujui: {
        label: "Disetujui",
        dot: "bg-emerald-500",
        className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
    },
    ditolak: {
        label: "Ditolak",
        dot: "bg-red-500",
        className: "border-red-500/20 bg-red-500/10 text-red-700",
    },
    dipinjam: {
        label: "Dipinjam",
        dot: "bg-violet-500",
        className: "border-violet-500/20 bg-violet-500/10 text-violet-700",
    },
    terlambat: {
        label: "Terlambat",
        dot: "bg-red-600",
        className: "border-red-600/20 bg-red-600/10 text-red-800",
    },
    dikembalikan: {
        label: "Dikembalikan",
        dot: "bg-slate-400",
        className: "border-slate-400/20 bg-slate-500/10 text-slate-600",
    },
    dibatalkan: {
        label: "Dibatalkan",
        dot: "bg-slate-500",
        className: "border-slate-500/20 bg-slate-500/10 text-slate-600",
    },
};

export default function LoanStatusBadge({ status }) {
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
