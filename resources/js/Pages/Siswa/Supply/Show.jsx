import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import SupplyStockBadge from "@/Components/SupplyStockBadge";
import StatusBadge from "@/Components/StatusBadge";
import { Button } from "@/Components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, PackagePlus } from "lucide-react";

export default function Show({ supply }) {
    return (
        <AppLayout>
            <Head title={supply.name} />

            <div className="animate-fade-in mx-auto max-w-5xl">
                <PageHeader title="Detail Bahan" subtitle={supply.code}>
                    <Button variant="outline" asChild>
                        <Link href={route("siswa.supplies.index")}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Link>
                    </Button>
                    {supply.can_request && supply.request_url && (
                        <Button asChild>
                            <Link href={supply.request_url}>
                                <PackagePlus className="mr-2 h-4 w-4" />
                                Ajukan Penggunaan
                            </Link>
                        </Button>
                    )}
                </PageHeader>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="rounded-2xl border-border/60 shadow-card lg:col-span-1">
                        <CardContent className="p-6">
                            <p className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                {supply.code}
                            </p>
                            <h2 className="mt-2 font-display text-xl font-bold leading-tight text-foreground">
                                {supply.name}
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {supply.category}
                            </p>

                            <div className="mt-6 space-y-4 border-t border-border pt-6">
                                <MetaRow label="Ketersediaan">
                                    <SupplyStockBadge label={supply.stock_label} />
                                </MetaRow>
                                <MetaRow label="Status bahan">
                                    <StatusBadge status={supply.status} />
                                </MetaRow>
                                <MetaRow label="Satuan">
                                    <span className="text-sm font-medium text-foreground">
                                        {supply.unit}
                                    </span>
                                </MetaRow>
                                <MetaRow label="Lokasi">
                                    <span className="text-sm font-medium text-foreground">
                                        {supply.location}
                                    </span>
                                </MetaRow>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6 lg:col-span-2">
                        <Card className="rounded-2xl border-border/60 shadow-card">
                            <CardHeader>
                                <CardTitle>Informasi Bahan</CardTitle>
                                <CardDescription>
                                    Detail bahan habis pakai laboratorium
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <Info
                                    label="Kode inventaris"
                                    value={supply.code}
                                    mono
                                />
                                <Info
                                    label="Kategori"
                                    value={supply.category}
                                />
                                <Info label="Satuan" value={supply.unit} />
                                {supply.description ? (
                                    <div className="sm:col-span-2">
                                        <Info
                                            label="Deskripsi"
                                            value={supply.description}
                                        />
                                    </div>
                                ) : null}
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl border-border/60 shadow-card">
                            <CardHeader>
                                <CardTitle>Stok</CardTitle>
                                <CardDescription>
                                    Ketersediaan bahan untuk penggunaan praktikum
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <StockStat
                                        label="Tersedia"
                                        value={supply.available}
                                        unit={supply.unit}
                                        highlight
                                    />
                                    {supply.min_stock != null && (
                                        <StockStat
                                            label="Stok minimum"
                                            value={supply.min_stock}
                                            unit={supply.unit}
                                        />
                                    )}
                                    <StockStat
                                        label="Total stok"
                                        value={supply.stock}
                                        unit={supply.unit}
                                    />
                                </div>
                                {supply.is_low_stock && (
                                    <p className="mt-4 text-sm text-amber-700">
                                        Stok bahan menipis. Segera ajukan
                                        pengambilan jika diperlukan untuk
                                        praktikum.
                                    </p>
                                )}
                                <p className="mt-4 text-sm text-muted-foreground">
                                    Bahan habis pakai tidak perlu dikembalikan
                                    setelah digunakan.
                                </p>
                            </CardContent>
                        </Card>

                        {supply.created_at_formatted && (
                            <Card className="rounded-2xl border-border/60 shadow-card">
                                <CardHeader>
                                    <CardTitle>Informasi Tambahan</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-4 sm:grid-cols-2">
                                    <Info
                                        label="Terdaftar"
                                        value={supply.created_at_formatted}
                                    />
                                    <Info
                                        label="Terakhir diperbarui"
                                        value={
                                            supply.updated_at_formatted ?? "—"
                                        }
                                    />
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function MetaRow({ label, children }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">{label}</span>
            <div className="shrink-0">{children}</div>
        </div>
    );
}

function Info({ label, value, mono = false }) {
    return (
        <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </p>
            <p
                className={`mt-2 text-sm font-medium text-foreground ${mono ? "font-mono" : ""}`}
            >
                {value}
            </p>
        </div>
    );
}

function StockStat({ label, value, unit, highlight = false }) {
    return (
        <div
            className={`rounded-xl border p-4 text-center ${
                highlight
                    ? "border-primary/20 bg-primary/5"
                    : "border-border/50 bg-muted/20"
            }`}
        >
            <p
                className={`text-2xl font-bold tabular-nums ${
                    highlight ? "text-primary" : "text-foreground"
                }`}
            >
                {value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
                {label}
                {unit ? ` (${unit})` : ""}
            </p>
        </div>
    );
}
