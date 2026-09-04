import { cn } from "@/lib/utils";
import {
    AlertTriangle,
    ClipboardList,
    Clock3,
    CreditCard,
    HandCoins,
    ListOrdered,
    PackageMinus,
} from "lucide-react";

function KpiCard({ label, value, subtitle, icon: Icon, accent }) {
    return (
        <div className="flex min-h-[132px] flex-col justify-between rounded-[10px] border border-border/60 bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">
                        {label}
                    </p>
                    <p
                        className={cn(
                            "mt-2 text-3xl font-bold tabular-nums tracking-tight",
                            accent ?? "text-foreground",
                        )}
                    >
                        {value ?? 0}
                    </p>
                </div>
                <div className="rounded-[8px] bg-muted/80 p-2.5 text-muted-foreground">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            {subtitle ? (
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    {subtitle}
                </p>
            ) : null}
        </div>
    );
}

export default function ReportKpiGrid({ stats = {}, isGuruScope = false }) {
    const cards = isGuruScope
        ? [
              {
                  label: "Total Pengajuan",
                  value: stats.total_loans,
                  subtitle: "Seluruh submission pada periode ini",
                  icon: ClipboardList,
              },
              {
                  label: "Sedang Dipinjam",
                  value: stats.active_borrows,
                  subtitle: "Alat/bahan bimbingan yang masih aktif",
                  icon: HandCoins,
                  accent: "text-primary",
              },
              {
                  label: "Dalam Antrian",
                  value: stats.queued ?? 0,
                  subtitle: "Menunggu stok Round Robin",
                  icon: ListOrdered,
              },
              {
                  label: "Menunggu Persetujuan",
                  value: stats.awaiting_approval ?? 0,
                  subtitle: "Belum diproses admin",
                  icon: Clock3,
              },
              {
                  label: "Keterlambatan",
                  value: stats.overdue,
                  subtitle: "Lewat jatuh tempo",
                  icon: AlertTriangle,
                  accent: "text-destructive",
              },
              {
                  label: "Bahan Menipis",
                  value: stats.low_stock_bahan,
                  subtitle: "Di bawah stok minimum",
                  icon: PackageMinus,
                  accent: "text-warning",
              },
          ]
        : [
              {
                  label: "Total Pengajuan",
                  value: stats.total_loans,
                  subtitle: "Seluruh submission pada periode ini",
                  icon: ClipboardList,
              },
              {
                  label: "Sedang Dipinjam",
                  value: stats.active_borrows,
                  subtitle: "Alat/bahan yang masih aktif",
                  icon: HandCoins,
                  accent: "text-primary",
              },
              {
                  label: "Dalam Antrian",
                  value: stats.queued ?? 0,
                  subtitle: "Menunggu stok Round Robin",
                  icon: ListOrdered,
              },
              {
                  label: "Menunggu Persetujuan",
                  value: stats.awaiting_approval ?? 0,
                  subtitle: "Belum diproses admin",
                  icon: Clock3,
              },
              {
                  label: "Keterlambatan",
                  value: stats.overdue,
                  subtitle: "Lewat jatuh tempo",
                  icon: AlertTriangle,
                  accent: "text-destructive",
              },
              {
                  label: "Kartu Ditahan",
                  value: stats.collateral_held,
                  subtitle: "Jaminan masih ditahan",
                  icon: CreditCard,
              },
              {
                  label: "Bahan Menipis",
                  value: stats.low_stock_bahan,
                  subtitle: "Di bawah stok minimum",
                  icon: PackageMinus,
                  accent: "text-warning",
              },
          ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
                <KpiCard key={card.label} {...card} />
            ))}
        </div>
    );
}
