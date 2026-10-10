function RankingList({ items, formatCount, emptyLabel }) {
    if (!items?.length) {
        return (
            <p className="py-8 text-center text-sm text-muted-foreground">
                {emptyLabel}
            </p>
        );
    }

    return (
        <ul className="space-y-2">
            {items.map((item, index) => (
                <li
                    key={`${item.name}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-[8px] bg-muted/40 px-3 py-2.5"
                >
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-background text-xs font-semibold text-muted-foreground">
                            {index + 1}
                        </span>
                        <span className="truncate text-sm font-medium text-foreground">
                            {item.name}
                        </span>
                    </div>
                    <span className="shrink-0 text-right text-sm font-semibold tabular-nums text-foreground">
                        {formatCount(item.count)}
                    </span>
                </li>
            ))}
        </ul>
    );
}

export default function ReportInsights({
    insights = {},
    isGuruScope = false,
}) {
    const topAlat = insights.top_alat ?? [];
    const topBahan = insights.top_bahan ?? [];
    const emptyLabel = "Belum ada data pada periode ini.";
    const subtitle =
        "Item yang paling sering dipinjam atau digunakan pada periode yang dipilih.";

    const formatAlatCount = isGuruScope
        ? (count) => (
              <>
                  {count}{" "}
                  <span className="font-normal text-muted-foreground">
                      dipinjam
                  </span>
              </>
          )
        : (count) => (
              <span className="font-normal text-muted-foreground">
                  Dipinjam{" "}
                  <span className="font-semibold text-foreground">{count}</span>{" "}
                  kali
              </span>
          );

    const formatBahanCount = isGuruScope
        ? (count) => (
              <>
                  {count}{" "}
                  <span className="font-normal text-muted-foreground">
                      digunakan
                  </span>
              </>
          )
        : (count) => (
              <span className="font-normal text-muted-foreground">
                  Digunakan{" "}
                  <span className="font-semibold text-foreground">{count}</span>{" "}
                  kali
              </span>
          );

    return (
        <section className="space-y-3">
            <div>
                <h3 className="text-base font-semibold text-foreground">
                    Insight Operasional
                </h3>
                <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[10px] border border-border/60 bg-card p-5 shadow-sm">
                    <h4 className="mb-3 text-sm font-semibold text-foreground">
                        Top Alat
                    </h4>
                    <RankingList
                        items={topAlat}
                        formatCount={formatAlatCount}
                        emptyLabel={emptyLabel}
                    />
                </div>
                <div className="rounded-[10px] border border-border/60 bg-card p-5 shadow-sm">
                    <h4 className="mb-3 text-sm font-semibold text-foreground">
                        Top Bahan
                    </h4>
                    <RankingList
                        items={topBahan}
                        formatCount={formatBahanCount}
                        emptyLabel={emptyLabel}
                    />
                </div>
            </div>
        </section>
    );
}
