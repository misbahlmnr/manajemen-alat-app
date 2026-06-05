import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import LoanStatusBadge from "@/Components/LoanStatusBadge";
import CollateralStatusBadge from "@/Components/CollateralStatusBadge";
import { Button } from "@/Components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import { Head, Link, router } from "@inertiajs/react";
import { ArrowLeft, Pencil, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import CancelLoanDialog from "./Components/CancelLoanDialog";
import RequestReturnDialog from "./Components/RequestReturnDialog";

export default function Show({ loan }) {
    const [cancelOpen, setCancelOpen] = useState(false);
    const [returnOpen, setReturnOpen] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [returning, setReturning] = useState(false);

    const handleCancel = () => {
        setCancelling(true);
        router.post(route("siswa.loans.cancel", loan.id), {}, {
            onFinish: () => {
                setCancelling(false);
                setCancelOpen(false);
            },
        });
    };

    const handleReturn = (note) => {
        setReturning(true);
        router.post(
            route("siswa.loans.request-return", loan.id),
            { note: note ?? "" },
            {
                onFinish: () => {
                    setReturning(false);
                    setReturnOpen(false);
                },
            },
        );
    };

    const timeline = loan.timeline ?? [];
    const items = loan.items ?? [];

    return (
        <AppLayout>
            <Head title={loan.code} />

            <div className="animate-fade-in mx-auto w-full min-w-0 max-w-5xl">
                <PageHeader title="Detail Peminjaman" subtitle={loan.code}>
                    <Button variant="outline" asChild>
                        <Link href={route("siswa.loans.index")}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Link>
                    </Button>
                    {loan.can_edit && (
                        <Button variant="outline" asChild>
                            <Link href={route("siswa.loans.edit", loan.id)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Ubah Pengajuan
                            </Link>
                        </Button>
                    )}
                    {loan.can_request_return && (
                        <Button onClick={() => setReturnOpen(true)}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Ajukan Pengembalian
                        </Button>
                    )}
                    {loan.can_cancel && (
                        <Button
                            variant="destructive"
                            onClick={() => setCancelOpen(true)}
                        >
                            <X className="mr-2 h-4 w-4" />
                            Batalkan
                        </Button>
                    )}
                </PageHeader>

                {loan.is_overdue && (
                    <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                        Peminjaman ini terlambat. Segera ajukan pengembalian
                        alat.
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="rounded-2xl border-border/60 shadow-card lg:col-span-1">
                        <CardContent className="p-6">
                            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                                {loan.code}
                            </p>
                            <h2 className="mt-2 font-display text-xl font-bold text-foreground">
                                {loan.item_type_label}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {loan.purpose}
                            </p>
                            <div className="mt-6 space-y-4 border-t border-border pt-6">
                                <MetaRow label="Status">
                                    <LoanStatusBadge status={loan.status} />
                                </MetaRow>
                                <MetaRow label="Guru Pembimbing">
                                    <span className="text-sm font-medium">
                                        {loan.supervisor_name}
                                    </span>
                                </MetaRow>
                            </div>
                            {loan.rejection_reason && (
                                <p className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                                    <strong>Alasan ditolak:</strong>{" "}
                                    {loan.rejection_reason}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <div className="space-y-6 lg:col-span-2">
                        <Card className="rounded-2xl border-border/60 shadow-card">
                            <CardHeader>
                                <CardTitle>Informasi Pengajuan</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <Info
                                    label="Tanggal pengajuan"
                                    value={loan.request_date_formatted}
                                />
                                {loan.item_type === "alat" && (
                                    <>
                                        <Info
                                            label="Batas pengembalian"
                                            value={loan.due_at_formatted}
                                        />
                                        <Info
                                            label="Lokasi"
                                            value={loan.borrow_scope_label}
                                        />
                                        {loan.schedule_title && (
                                            <Info
                                                label="Jadwal praktikum"
                                                value={loan.schedule_title}
                                            />
                                        )}
                                    </>
                                )}
                                <Info
                                    label="Dipinjam"
                                    value={loan.borrowed_at_formatted}
                                />
                                <Info
                                    label="Dikembalikan"
                                    value={loan.returned_at_formatted}
                                />
                                {loan.notes && (
                                    <div className="sm:col-span-2">
                                        <Info label="Catatan" value={loan.notes} />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl border-border/60 shadow-card">
                            <CardHeader>
                                <CardTitle>Item yang Dipinjam</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="divide-y divide-border rounded-xl border border-border/50">
                                    {items.map((item) => (
                                        <li
                                            key={item.id}
                                            className="flex justify-between gap-4 px-4 py-3 text-sm"
                                        >
                                            <div>
                                                <p className="font-medium">
                                                    {item.equipment_name}
                                                </p>
                                                <p className="font-mono text-xs text-muted-foreground">
                                                    {item.equipment_code}
                                                </p>
                                            </div>
                                            <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                                                ×{item.quantity}
                                                {item.unit ? ` ${item.unit}` : ""}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        {loan.requires_collateral && (
                            <Card className="rounded-2xl border-border/60 shadow-card">
                                <CardHeader>
                                    <CardTitle>Jaminan Kartu</CardTitle>
                                    <CardDescription>
                                        {loan.collateral_code ?? "Menunggu penahanan kartu"}
                                    </CardDescription>
                                </CardHeader>
                                {loan.collateral_status && (
                                    <CardContent>
                                        <CollateralStatusBadge
                                            status={loan.collateral_status}
                                        />
                                    </CardContent>
                                )}
                            </Card>
                        )}

                        {loan.compensation?.required && (
                            <Card className="rounded-2xl border-destructive/30 bg-destructive/5 shadow-card">
                                <CardHeader>
                                    <CardTitle className="text-destructive">
                                        Kompensasi
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    Status:{" "}
                                    <strong>{loan.compensation.status}</strong>
                                    {loan.compensation.description && (
                                        <p className="mt-2">
                                            {loan.compensation.description}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {timeline.length > 0 && (
                            <Card className="rounded-2xl border-border/60 shadow-card">
                                <CardHeader>
                                    <CardTitle>Riwayat Status</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ol className="relative space-y-4 border-l border-border pl-6">
                                        {timeline.map((entry, i) => (
                                            <li key={i} className="relative">
                                                <span className="absolute -left-[1.6rem] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                                                <LoanStatusBadge
                                                    status={entry.status}
                                                />
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {entry.created_at_formatted}
                                                    {entry.note &&
                                                        ` — ${entry.note}`}
                                                </p>
                                            </li>
                                        ))}
                                    </ol>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            <CancelLoanDialog
                open={cancelOpen}
                onOpenChange={setCancelOpen}
                itemName={loan.code}
                onConfirm={handleCancel}
                loading={cancelling}
            />
            <RequestReturnDialog
                open={returnOpen}
                onOpenChange={setReturnOpen}
                itemName={loan.code}
                requiresInspection={loan.requires_collateral}
                onConfirm={handleReturn}
                loading={returning}
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

function Info({ label, value }) {
    return (
        <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
        </div>
    );
}
