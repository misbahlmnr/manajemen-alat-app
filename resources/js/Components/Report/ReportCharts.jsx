import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const STATUS_COLORS = [
    "#6366f1",
    "#f59e0b",
    "#0ea5e9",
    "#22c55e",
    "#ef4444",
    "#94a3b8",
    "#a855f7",
];

function ChartCard({ title, description, children, empty }) {
    return (
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                {description ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                        {description}
                    </p>
                ) : null}
            </div>
            {empty ? (
                <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                    Belum ada data untuk ditampilkan
                </div>
            ) : (
                <div className="h-[260px] w-full">{children}</div>
            )}
        </div>
    );
}

export default function ReportCharts({ charts = {} }) {
    const trend = charts.submission_trend ?? [];
    const distribution = charts.status_distribution ?? [];

    return (
        <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
                title="Tren Submission"
                description="Jumlah pengajuan sepanjang periode filter"
                empty={trend.length === 0}
            >
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11 }}
                            interval="preserveStartEnd"
                        />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
                        <Tooltip
                            contentStyle={{
                                borderRadius: 12,
                                border: "1px solid hsl(var(--border))",
                                background: "hsl(var(--card))",
                            }}
                        />
                        <Bar
                            dataKey="total"
                            name="Pengajuan"
                            fill="hsl(var(--primary))"
                            radius={[6, 6, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>

            <ChartCard
                title="Distribusi Status"
                description="Proporsi status peminjaman pada periode ini"
                empty={distribution.length === 0}
            >
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={distribution}
                            dataKey="value"
                            nameKey="label"
                            innerRadius={58}
                            outerRadius={90}
                            paddingAngle={2}
                        >
                            {distribution.map((entry, index) => (
                                <Cell
                                    key={entry.key ?? entry.label}
                                    fill={STATUS_COLORS[index % STATUS_COLORS.length]}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                borderRadius: 12,
                                border: "1px solid hsl(var(--border))",
                                background: "hsl(var(--card))",
                            }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            wrapperStyle={{ fontSize: 12 }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </ChartCard>
        </div>
    );
}
