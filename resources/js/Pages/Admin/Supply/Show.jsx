import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import SupplyStockBadge from "@/Components/SupplyStockBadge";
import EquipmentImage from "@/Components/Equipment/EquipmentImage";
import { Button } from "@/Components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import { Head, Link, router } from "@inertiajs/react";
import { ArrowLeft, Pencil } from "lucide-react";
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

            <div className="animate-fade-in mx-auto max-w-5xl">
                <PageHeader title="Detail Bahan" subtitle={supply.code}>
                    <Button variant="outline" asChild>
                        <Link href={route("admin.supplies.index")}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Link>
                    </Button>
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
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle>Identitas</CardTitle>
                            <CardDescription>Foto dan ketersediaan stok</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <EquipmentImage
                                imageUrl={supply.image_url}
                                name={supply.name}
                                itemType="bahan"
                                className="mb-4 aspect-square w-full rounded-[8px] border border-border/60"
                                iconClassName="h-12 w-12"
                            />
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
                                <SupplyStockBadge label={supply.stock_label} />
                                <StockLowBadge show={supply.is_low_stock} />
                            </div>

                            <div className="mt-6 space-y-4 border-t border-border pt-6">
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
                        <Card className="rounded-[10px] border-border/60 shadow-card">
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

                        <Card className="rounded-xl border shadow-sm">
                            <CardHeader>
                                <CardTitle>Stok Bahan</CardTitle>
                                <CardDescription>
                                    Stok di gudang berkurang otomatis saat pengajuan disetujui
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-3 sm:grid-cols-3">
                                    <div className="rounded-lg border bg-muted/40 p-3">
                                        <p className="text-xs text-muted-foreground">Total stok</p>
                                        <p className="mt-1 text-2xl font-bold tabular-nums">
                                            {supply.stock}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{supply.unit}</p>
                                    </div>
                                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3">
                                        <p className="text-xs text-emerald-800">Di gudang</p>
                                        <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-800">
                                            {supply.available}
                                        </p>
                                        <p className="text-xs text-emerald-800/80">siap diambil</p>
                                    </div>
                                    <div className="rounded-lg border border-sky-200 bg-sky-50/70 p-3">
                                        <p className="text-xs text-sky-800">Sudah diambil</p>
                                        <p className="mt-1 text-2xl font-bold tabular-nums text-sky-800">
                                            {used}
                                        </p>
                                        <p className="text-xs text-sky-800/80">dari peminjaman</p>
                                    </div>
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
        <div className="rounded-lg border bg-muted/50 p-4">
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

