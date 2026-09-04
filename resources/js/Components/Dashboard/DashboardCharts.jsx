import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

const STATUS_COLORS = {
    diminta: "hsl(var(--chart-3))",
    antrian: "hsl(var(--chart-4))",
    disetujui: "hsl(var(--chart-2))",
    dipinjam: "hsl(var(--chart-1))",
    terlambat: "hsl(var(--destructive))",
    dikembalikan: "hsl(var(--muted-foreground))",
    ditolak: "hsl(var(--destructive))",
    dibatalkan: "hsl(215 12% 58%)",
    menunggu_inspeksi: "hsl(var(--chart-4))",
};

const STATUS_LABELS = {
    diminta: "Menunggu",
    antrian: "Antrian",
    disetujui: "Disetujui",
    dipinjam: "Dipinjam",
    terlambat: "Terlambat",
    dikembalikan: "Dikembalikan",
    ditolak: "Ditolak",
    dibatalkan: "Dibatalkan",
    menunggu_inspeksi: "Inspeksi",
};

export function buildStatusChartData(loans = []) {
    const counts = {};
    loans.forEach((loan) => {
        const s = loan.status || "diminta";
        counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts)
        .map(([status, value]) => ({
            status,
            label: STATUS_LABELS[status] || status,
            value,
            fill: STATUS_COLORS[status] || "hsl(var(--primary))",
        }))
        .sort((a, b) => b.value - a.value);
}

export function buildPopularEquipmentData(loans = [], limit = 6) {
    const counts = {};
    loans.forEach((loan) => {
        const name = loan.equipmentName || loan.equipment_name || "Lainnya";
        const qty = Number(loan.quantity) || 1;
        counts[name] = (counts[name] || 0) + qty;
    });
    return Object.entries(counts)
        .map(([name, value]) => ({
            name: name.length > 22 ? `${name.slice(0, 20)}…` : name,
            fullName: name,
            value,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, limit);
}

function ChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-[8px] border border-border bg-card px-3 py-2 text-xs shadow-md">
            <p className="font-medium text-foreground">
                {payload[0]?.payload?.fullName || label}
            </p>
            <p className="mt-0.5 text-muted-foreground">
                {payload[0]?.value} transaksi
            </p>
        </div>
    );
}

export function StatusDistributionChart({ loans = [], className }) {
    const data = buildStatusChartData(loans);

    if (!data.length) {
        return (
            <p className="py-12 text-center text-sm text-muted-foreground">
                Belum ada data untuk grafik
            </p>
        );
    }

    return (
        <div className={cn("h-64 w-full", className)}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted))" }} />
                    <Bar dataKey="value" radius={[8, 8, 4, 4]} maxBarSize={40}>
                        {data.map((entry) => (
                            <Cell key={entry.status} fill={entry.fill} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export function PopularEquipmentChart({ loans = [], className }) {
    const data = buildPopularEquipmentData(loans);

    if (!data.length) {
        return (
            <p className="py-12 text-center text-sm text-muted-foreground">
                Belum ada data alat terpopuler
            </p>
        );
    }

    return (
        <div className={cn("h-64 w-full", className)}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis
                        type="number"
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        type="category"
                        dataKey="name"
                        width={100}
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted))" }} />
                    <Bar
                        dataKey="value"
                        fill="hsl(var(--secondary))"
                        radius={[0, 8, 8, 0]}
                        maxBarSize={22}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
