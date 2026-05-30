import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import LoanStatusBadge from "@/Components/LoanStatusBadge";
import { Button } from "@/Components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import { Head, Link, router } from "@inertiajs/react";
import {
    Check,
    PackageCheck,
    Pencil,
    RotateCcw,
    X,
} from "lucide-react";
import { useState } from "react";
import DeleteLoanDialog from "./Components/DeleteLoanDialog";
import RejectLoanDialog from "./Components/RejectLoanDialog";
import ReturnLoanDialog from "./Components/ReturnLoanDialog";

export default function Show({ loan }) {
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [returnOpen, setReturnOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [returning, setReturning] = useState(false);

    const post = (routeName, data = {}) => {
        router.post(route(routeName, loan.id), data, { preserveScroll: true });
    };

    const handleDelete = () => {
        setDeleting(true);
        router.delete(route("admin.loans.destroy", loan.id));
    };

    const handleReject = (reason) => {
        setRejecting(true);
        router.post(
            route("admin.loans.reject", loan.id),
            { rejection_reason: reason },
            {
                onFinish: () => {
                    setRejecting(false);
                    setRejectOpen(false);
                },
            },
        );
    };

    const handleReturn = (note) => {
        setReturning(true);
        router.post(
            route("admin.loans.return", loan.id),
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

            <div className="animate-fade-in mx-auto max-w-5xl">
                <PageHeader title="Detail Peminjaman" subtitle={loan.code}>
                    {loan.can_edit && (
                        <Button variant="outline" asChild>
                            <Link href={route("admin.loans.edit", loan.id)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                    )}
                    {loan.can_approve && (
                        <Button
                            variant="outline"
                            className="border-emerald-500/30 text-emerald-700"
                            onClick={() => post("admin.loans.approve")}
                        >
                            <Check className="mr-2 h-4 w-4" />
                            Setujui
                        </Button>
                    )}
                    {loan.can_reject && (
                        <Button
                            variant="outline"
                            className="text-destructive"
                            onClick={() => setRejectOpen(true)}
                        >
                            <X className="mr-2 h-4 w-4" />
                            Tolak
                        </Button>
                    )}
                    {loan.can_mark_borrowed && (
                        <Button
                            variant="outline"
                            onClick={() => post("admin.loans.mark-borrowed")}
                        >
                            <PackageCheck className="mr-2 h-4 w-4" />
                            Tandai Dipinjam
                        </Button>
                    )}
                    {loan.can_return && (
                        <Button onClick={() => setReturnOpen(true)}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Proses Pengembalian
                        </Button>
                    )}
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
                            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                                {loan.code}
                            </p>
                            <h2 className="mt-2 font-display text-xl font-bold text-foreground">
                                {loan.borrower_name}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {loan.borrower_class} • {loan.item_type_label}
                            </p>
                            <div className="mt-6 space-y-4 border-t border-border pt-6">
                                <MetaRow label="Status">
                                    <LoanStatusBadge status={loan.status} />
                                </MetaRow>
                                <MetaRow label="Guru">
                                    <span className="text-sm font-medium">
                                        {loan.supervisor_name}
                                    </span>
                                </MetaRow>
                            </div>
                            {loan.rejection_reason && (
                                <p className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                                    {loan.rejection_reason}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <div className="space-y-6 lg:col-span-2">
                        <Card className="rounded-2xl border-border/60 shadow-card">
                            <CardHeader>
                                <CardTitle>Informasi Peminjaman</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <Info
                                    label="Tanggal pengajuan"
                                    value={loan.request_date_formatted}
                                />
                                <Info
                                    label="Batas pengembalian"
                                    value={loan.due_at_formatted}
                                />
                                <Info
                                    label="Dipinjam"
                                    value={loan.borrowed_at_formatted}
                                />
                                <Info
                                    label="Dikembalikan"
                                    value={loan.returned_at_formatted}
                                />
                                {loan.schedule_title && (
                                    <Info
                                        label="Jadwal"
                                        value={loan.schedule_title}
                                    />
                                )}
                                {loan.purpose && (
                                    <Info
                                        label="Tujuan"
                                        value={loan.purpose}
                                    />
                                )}
                                {loan.notes && (
                                    <div className="sm:col-span-2">
                                        <Info
                                            label="Catatan"
                                            value={loan.notes}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl border-border/60 shadow-card">
                            <CardHeader>
                                <CardTitle>Item Dipinjam</CardTitle>
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
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        {timeline.length > 0 && (
                            <Card className="rounded-2xl border-border/60 shadow-card">
                                <CardHeader>
                                    <CardTitle>Riwayat Status</CardTitle>
                                    <CardDescription>
                                        Timeline perubahan status
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ol className="relative space-y-4 border-l border-border pl-6">
                                        {timeline.map((entry, i) => (
                                            <li key={i} className="relative">
                                                <span className="absolute -left-[1.6rem] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <LoanStatusBadge
                                                        status={entry.status}
                                                    />
                                                    <span className="text-xs text-muted-foreground">
                                                        {
                                                            entry.created_at_formatted
                                                        }
                                                    </span>
                                                </div>
                                                {entry.note && (
                                                    <p className="mt-1 text-sm text-muted-foreground">
                                                        {entry.note}
                                                    </p>
                                                )}
                                                {entry.user_name && (
                                                    <p className="text-xs text-muted-foreground">
                                                        oleh {entry.user_name}
                                                    </p>
                                                )}
                                            </li>
                                        ))}
                                    </ol>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            <DeleteLoanDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                itemName={loan.code}
                onConfirm={handleDelete}
                loading={deleting}
            />
            <RejectLoanDialog
                open={rejectOpen}
                onOpenChange={setRejectOpen}
                itemName={loan.code}
                onConfirm={handleReject}
                loading={rejecting}
            />
            <ReturnLoanDialog
                open={returnOpen}
                onOpenChange={setReturnOpen}
                itemName={loan.code}
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
