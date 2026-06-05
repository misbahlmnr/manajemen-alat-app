import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import AvailabilityBadge from "@/Components/AvailabilityBadge";
import StatusBadge from "@/Components/StatusBadge";
import ConditionBadge from "@/Pages/Admin/Equipment/Components/ConditionBadge";
import { Button } from "@/Components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, FileText } from "lucide-react";

export default function Show({ equipment }) {
    return (
        <AppLayout>
            <Head title={equipment.name} />

            <div className="animate-fade-in mx-auto w-full min-w-0 max-w-5xl">
                <PageHeader title="Detail Alat" subtitle={equipment.code}>
                    <Button variant="outline" asChild>
                        <Link href={route("siswa.equipment.index")}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Link>
                    </Button>
                    {equipment.can_borrow && equipment.borrow_url && (
                        <Button asChild>
                            <Link href={equipment.borrow_url}>
                                <FileText className="mr-2 h-4 w-4" />
                                Ajukan Peminjaman
                            </Link>
                        </Button>
                    )}
                </PageHeader>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="rounded-2xl border-border/60 shadow-card lg:col-span-1">
                        <CardContent className="p-6">
                            <p className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                {equipment.code}
                            </p>
                            <h2 className="mt-2 font-display text-xl font-bold leading-tight text-foreground">
                                {equipment.name}
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {equipment.category}
                            </p>

                            <div className="mt-6 space-y-4 border-t border-border pt-6">
                                <MetaRow label="Ketersediaan">
                                    <AvailabilityBadge
                                        label={equipment.availability_label}
                                    />
                                </MetaRow>
                                <MetaRow label="Status alat">
                                    <StatusBadge status={equipment.status} />
                                </MetaRow>
                                <MetaRow label="Kondisi">
                                    <ConditionBadge
                                        condition={equipment.condition}
                                    />
                                </MetaRow>
                                <MetaRow label="Lokasi">
                                    <span className="text-sm font-medium text-foreground">
                                        {equipment.location}
                                    </span>
                                </MetaRow>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6 lg:col-span-2">
                        <Card className="rounded-2xl border-border/60 shadow-card">
                            <CardHeader>
                                <CardTitle>Informasi Alat</CardTitle>
                                <CardDescription>
                                    Detail peralatan laboratorium
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <Info
                                    label="Kode inventaris"
                                    value={equipment.code}
                                    mono
                                />
                                <Info
                                    label="Kategori"
                                    value={equipment.category}
                                />
                                {equipment.description ? (
                                    <div className="sm:col-span-2">
                                        <Info
                                            label="Deskripsi"
                                            value={equipment.description}
                                        />
                                    </div>
                                ) : null}
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl border-border/60 shadow-card">
                            <CardHeader>
                                <CardTitle>Stok & Ketersediaan</CardTitle>
                                <CardDescription>
                                    Unit tersedia untuk peminjaman
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <StockStat
                                        label="Tersedia"
                                        value={equipment.available}
                                        highlight
                                    />
                                    <StockStat
                                        label="Dipinjam"
                                        value={equipment.borrowed}
                                    />
                                    <StockStat
                                        label="Total stok"
                                        value={equipment.stock}
                                    />
                                </div>
                                <p className="mt-4 text-sm text-muted-foreground">
                                    Alat harus dikembalikan sebelum batas waktu
                                    setelah peminjaman disetujui.
                                </p>
                            </CardContent>
                        </Card>

                        {equipment.created_at_formatted && (
                            <Card className="rounded-2xl border-border/60 shadow-card">
                                <CardHeader>
                                    <CardTitle>Informasi Tambahan</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-4 sm:grid-cols-2">
                                    <Info
                                        label="Terdaftar"
                                        value={equipment.created_at_formatted}
                                    />
                                    <Info
                                        label="Terakhir diperbarui"
                                        value={
                                            equipment.updated_at_formatted ??
                                            "—"
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

function StockStat({ label, value, highlight = false }) {
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
            <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        </div>
    );
}
