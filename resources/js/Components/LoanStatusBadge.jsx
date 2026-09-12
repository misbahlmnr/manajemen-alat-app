import { cn } from "@/lib/utils";

const tone = {
    neutral: {
        dot: "bg-muted-foreground",
        className: "border-transparent bg-muted text-muted-foreground",
    },
    pending: {
        dot: "bg-blue-500",
        className: "border-transparent bg-blue-50 text-blue-700",
    },
    warning: {
        dot: "bg-amber-500",
        className: "border-transparent bg-amber-50 text-amber-800",
    },
    success: {
        dot: "bg-emerald-500",
        className: "border-transparent bg-emerald-50 text-emerald-700",
    },
    active: {
        dot: "bg-sky-500",
        className: "border-transparent bg-sky-50 text-sky-700",
    },
    danger: {
        dot: "bg-red-500",
        className: "border-transparent bg-red-50 text-red-700",
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
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-none",
                item.className,
            )}
        >
            <span className={cn("mr-1.5 h-1.5 w-1.5 shrink-0 rounded-full", item.dot)} />
            {label}
        </span>
    );
}
