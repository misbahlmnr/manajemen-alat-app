import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
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
import ConditionBadge from "./Components/ConditionBadge";
import EquipmentStatusBadge from "./Components/EquipmentStatusBadge";
import DeleteEquipmentDialog from "./Components/DeleteEquipmentDialog";

export default function Show({ equipment }) {
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const borrowed = Math.max(0, equipment.stock - equipment.available);

    const handleDelete = () => {
        setDeleting(true);
        router.delete(route("admin.equipment.destroy", equipment.id));
    };

    return (
        <AppLayout>
            <Head title={equipment.name} />

            <div className="animate-fade-in">
                <PageHeader title="Detail Alat" subtitle={equipment.code}>
                    <Button variant="outline" asChild>
                        <Link
                            href={route("admin.equipment.edit", equipment.id)}
                        >
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
                                {equipment.code}
                            </p>
                            <h2 className="mt-2 font-display text-xl font-bold leading-tight text-foreground">
                                {equipment.name}
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {equipment.category}
                            </p>

                            <div className="mt-6 space-y-4 border-t border-border pt-6">
                                <MetaRow label="Status alat">
                                    <EquipmentStatusBadge
                                        status={equipment.status}
                                    />
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
                                    Detail inventaris dan metadata
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
                                <Info
                                    label="Terdaftar"
                                    value={equipment.created_at_formatted}
                                />
                                <Info
                                    label="Terakhir diperbarui"
                                    value={equipment.updated_at_formatted}
                                />
                                {equipment.description && (
                                    <div className="sm:col-span-2">
                                        <Info
                                            label="Deskripsi"
                                            value={equipment.description}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl border-border/60 shadow-card">
                            <CardHeader>
                                <CardTitle>Stok</CardTitle>
                                <CardDescription>
                                    Ketersediaan unit di gudang
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
                                        value={borrowed}
                                    />
                                    <StockStat
                                        label="Total stok"
                                        value={equipment.stock}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <DeleteEquipmentDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                itemName={equipment.name}
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
