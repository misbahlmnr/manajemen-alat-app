import { cn } from "@/lib/utils";

/** Soft semantic badge styles — slate / gold / green / red only */
const tone = {
    neutral: {
        dot: "bg-slate-400",
        className: "border-slate-200 bg-slate-50 text-slate-600",
    },
    pending: {
        dot: "bg-slate-500",
        className: "border-slate-200 bg-slate-100 text-slate-700",
    },
    warning: {
        dot: "bg-amber-600/80",
        className: "border-amber-200/80 bg-amber-50 text-amber-900/80",
    },
    success: {
        dot: "bg-slate-600",
        className: "border-slate-200 bg-slate-100 text-slate-700",
    },
    active: {
        dot: "bg-amber-600/70",
        className: "border-amber-200/60 bg-amber-50/80 text-amber-950/70",
    },
    danger: {
        dot: "bg-red-600/70",
        className: "border-red-200/70 bg-red-50 text-red-800/80",
    },
};

const loanConfig = {
    diminta: { label: "Menunggu Persetujuan", ...tone.pending },
    antrian: { label: "Antrian", ...tone.warning },
    disetujui: { label: "Disetujui", ...tone.success },
    ditolak: { label: "Ditolak", ...tone.danger },
    dipinjam: { label: "Dipinjam", ...tone.active },
    terlambat: { label: "Terlambat", ...tone.danger },
    menunggu_inspeksi: { label: "Menunggu Inspeksi", ...tone.warning },
    dikembalikan: { label: "Dikembalikan", ...tone.neutral },
    dibatalkan: { label: "Dibatalkan", ...tone.neutral },
};

const submissionConfig = {
    diminta: { label: "Menunggu Persetujuan", ...tone.pending },
    antrian: { label: "Antrian", ...tone.warning },
    diproses: { label: "Diproses", ...tone.active },
    selesai: { label: "Selesai", ...tone.success },
    dibatalkan: { label: "Dibatalkan", ...tone.neutral },
};

const bahanStatusLabels = {
    dipinjam: "Diambil",
    dikembalikan: "Selesai",
};

export default function LoanStatusBadge({ status, itemType }) {
    const config =
        itemType === "submission" ? submissionConfig : loanConfig;

    const item = config[status] ?? {
        label: status,
        ...tone.neutral,
    };

    const label =
        itemType === "bahan" && bahanStatusLabels[status]
            ? bahanStatusLabels[status]
            : item.label;

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none",
                item.className,
            )}
        >
            <span className={cn("mr-1.5 h-1.5 w-1.5 shrink-0 rounded-full", item.dot)} />
            {label}
        </span>
    );
}
