import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import StatusBadge from "@/Components/StatusBadge";
import { Button } from "@/Components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import { Head, Link, router } from "@inertiajs/react";
import { Pencil } from "lucide-react";
import { useState } from "react";
import DeleteSupplyDialog from "./Components/DeleteSupplyDialog";
import StockLowBadge from "./Components/StockLowBadge";

export default function Show({ supply }) {
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const used = Math.max(0, supply.stock - supply.available);

    const handleDelete = () => {
        setDeleting(true);
        router.delete(route("admin.supplies.destroy", supply.id));
    };

    return (
        <AppLayout>
            <Head title={supply.name} />

            <div className="animate-fade-in">
                <PageHeader title="Detail Bahan" subtitle={supply.code}>
                    <Button variant="outline" asChild>
                        <Link href={route("admin.supplies.edit", supply.id)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => setDeleteOpen(true)}
                    >
                        Hapus
                    </Button>
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

                            <div className="mt-4 flex flex-wrap gap-2">
                                <StockLowBadge show={supply.is_low_stock} />
                            </div>

                            <div className="mt-6 space-y-4 border-t border-border pt-6">
                                <MetaRow label="Status">
                                    <StatusBadge status={supply.status} />
                                </MetaRow>
                                <MetaRow label="Satuan">
                                    <span className="text-sm font-medium text-foreground">
                                        {supply.unit}
                                    </span>
                                </MetaRow>
                                {supply.location && (
                                    <MetaRow label="Lokasi">
                                        <span className="text-sm font-medium text-foreground">
                                            {supply.location}
                                        </span>
                                    </MetaRow>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6 lg:col-span-2">
                        <Card className="rounded-2xl border-border/60 shadow-card">
                            <CardHeader>
                                <CardTitle>Informasi Bahan</CardTitle>
                                <CardDescription>
                                    Detail inventaris dan metadata
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
                                <Info
                                    label="Terdaftar"
                                    value={supply.created_at_formatted}
                                />
                                <Info
                                    label="Terakhir diperbarui"
                                    value={supply.updated_at_formatted}
                                />
                                {supply.min_stock != null && (
                                    <Info
                                        label="Stok minimum"
                                        value={`${supply.min_stock} ${supply.unit}`}
                                    />
                                )}
                                {supply.description && (
                                    <div className="sm:col-span-2">
                                        <Info
                                            label="Deskripsi"
                                            value={supply.description}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl border-border/60 shadow-card">
                            <CardHeader>
                                <CardTitle>Stok Bahan</CardTitle>
                                <CardDescription>
                                    Ketersediaan bahan habis pakai di gudang
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <StockStat
                                        label="Tersisa"
                                        value={supply.available}
                                        unit={supply.unit}
                                        highlight
                                    />
                                    <StockStat
                                        label="Terpakai"
                                        value={used}
                                        unit={supply.unit}
                                    />
                                    <StockStat
                                        label="Total stok"
                                        value={supply.stock}
                                        unit={supply.unit}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <DeleteSupplyDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                itemName={supply.name}
                onConfirm={handleDelete}
                loading={deleting}
            />
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
                {label} ({unit})
            </p>
        </div>
    );
}
