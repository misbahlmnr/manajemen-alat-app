function Metric({ label, value }) {
    return (
        <div className="rounded-xl bg-muted/40 px-4 py-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                {value ?? "—"}
            </p>
        </div>
    );
}

export default function ReportRoundRobinStats({ roundRobin = {} }) {
    const avgWait =
        roundRobin.avg_wait_hours != null
            ? `${roundRobin.avg_wait_hours} jam`
            : "—";

    const longest =
        roundRobin.longest_queue_label != null
            ? `${roundRobin.longest_queue_label}${
                  roundRobin.longest_queue_hours != null
                      ? ` (${roundRobin.longest_queue_hours} jam)`
                      : ""
              }`
            : "—";

    return (
        <section className="space-y-3">
            <div>
                <h3 className="text-base font-semibold text-foreground">
                    Statistik Round Robin
                </h3>
                <p className="text-sm text-muted-foreground">
                    Ringkasan antrian stok berdasarkan prioritas admin dan FIFO.
                </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    <Metric
                        label="Total masuk antrian"
                        value={roundRobin.total_entered_queue}
                    />
                    <Metric label="Sedang menunggu" value={roundRobin.waiting} />
                    <Metric
                        label="Prioritas admin aktif"
                        value={roundRobin.admin_priority_active}
                    />
                    <Metric label="Rata-rata waktu tunggu" value={avgWait} />
                    <Metric label="Antrian terlama" value={longest} />
                </div>
            </div>
        </section>
    );
}
