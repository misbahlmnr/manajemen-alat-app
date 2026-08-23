import { FileBarChart2 } from "lucide-react";

export default function ReportEmptyState({
    title = "Belum ada data laporan pada periode ini.",
    description = "Silakan ubah filter tanggal atau tunggu aktivitas peminjaman.",
}) {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-card px-6 py-16 text-center shadow-sm">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <FileBarChart2 className="h-7 w-7" />
            </div>
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {description}
            </p>
        </div>
    );
}
