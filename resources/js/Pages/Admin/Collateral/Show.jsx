import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import CollateralStatusBadge from "@/Components/CollateralStatusBadge";
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
import { CreditCard, Pencil } from "lucide-react";
import { useState } from "react";
import DeleteCollateralDialog from "./Components/DeleteCollateralDialog";
import InspectReturnDialog from "./Components/InspectReturnDialog";
import ReceiveCardDialog from "./Components/ReceiveCardDialog";

export default function Show({ collateral }) {
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [inspectOpen, setInspectOpen] = useState(false);
    const [receiveOpen, setReceiveOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [inspecting, setInspecting] = useState(false);
    const [receiving, setReceiving] = useState(false);

    const post = (routeName) => {
        router.post(route(routeName, collateral.id), {}, { preserveScroll: true });
    };

    const handleDelete = () => {
        setDeleting(true);
        router.delete(route("admin.collaterals.destroy", collateral.id));
    };

    const handleInspect = (payload) => {
        setInspecting(true);
        router.post(route("admin.loans.inspect", collateral.loan_id), payload, {
            onFinish: () => {
                setInspecting(false);
                setInspectOpen(false);
            },
        });
    };

    const handleReceiveCard = (payload) => {
        setReceiving(true);
        router.post(route("admin.collaterals.hold", collateral.id), payload, {
            preserveScroll: true,
            onFinish: () => {
                setReceiving(false);
                setReceiveOpen(false);
            },
        });
    };

    return (
        <AppLayout>
            <Head title={collateral.code} />

            <div className="animate-fade-in mx-auto max-w-5xl">
                <PageHeader title="Detail Jaminan Kartu" subtitle={collateral.code}>
                    <Button variant="outline" asChild>
                        <Link href={route("admin.collaterals.edit", collateral.id)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </Button>
                    {collateral.can_hold && (
                        <Button
                            variant="outline"
                            onClick={() => setReceiveOpen(true)}
                        >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Terima Kartu Pelajar
                        </Button>
                    )}
                    {collateral.can_inspect && (
                        <Button onClick={() => setInspectOpen(true)}>
                            Inspeksi Pengembalian
                        </Button>
                    )}
                    {collateral.can_complete_compensation && (
                        <Button
                            onClick={() =>
                                post("admin.collaterals.complete-compensation")
                            }
                        >
                            Kompensasi Selesai
                        </Button>
                    )}
                    {collateral.can_return_card &&
                        !collateral.can_complete_compensation && (
                            <Button
                                variant="outline"
                                onClick={() =>
                                    post("admin.collaterals.return-card")
                                }
                            >
                                Kembalikan Kartu
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
                                {collateral.code}
                            </p>
                            <h2 className="mt-2 font-display text-xl font-bold text-foreground">
                                {collateral.student_name}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {collateral.student_class}
                                {collateral.student_nisn &&
                                    ` • NISN ${collateral.student_nisn}`}
                            </p>
                            <div className="mt-6 space-y-4 border-t border-border pt-6">
                                <MetaRow label="Status">
                                    <CollateralStatusBadge
                                        status={collateral.status}
                                    />
                                </MetaRow>
                                <MetaRow label="Jenis kartu">
                                    <span className="text-sm font-medium">
                                        {collateral.card_type_label}
                                    </span>
                                </MetaRow>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6 lg:col-span-2">
                        <Card className="rounded-2xl border-border/60 shadow-card">
                            <CardHeader>
                                <CardTitle>Kartu</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <Info
                                    label="Jenis"
                                    value={collateral.card_type_label}
                                />
                                <Info
                                    label="Nomor kartu"
                                    value={collateral.card_number || "—"}
                                />
                                <Info
                                    label="Status"
                                    value={
                                        <CollateralStatusBadge
                                            status={collateral.status}
                                        />
                                    }
                                />
                                <Info
                                    label="Tanggal diterima"
                                    value={collateral.held_at_formatted}
                                />
                                <Info
                                    label="Admin"
                                    value={collateral.held_by_name || "—"}
                                />
                                <Info
                                    label="Tanggal dikembalikan"
                                    value={collateral.returned_at_formatted}
                                />
                                <div className="sm:col-span-2">
                                    <Info
                                        label="Catatan"
                                        value={collateral.notes || "—"}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl border-border/60 shadow-card">
                            <CardHeader>
                                <CardTitle>Peminjaman Terkait</CardTitle>
                                <CardDescription>
                                    {collateral.submission_code &&
                                    collateral.submission_code !==
                                        collateral.loan_code ? (
                                        <span className="flex flex-col gap-1">
                                            <Link
                                                href={route(
                                                    "admin.loans.submission",
                                                    collateral.submission_code,
                                                )}
                                                className="text-primary hover:underline"
                                            >
                                                {collateral.submission_code}
                                            </Link>
                                            <Link
                                                href={route(
                                                    "admin.loans.show",
                                                    collateral.loan_id,
                                                )}
                                                className="text-xs text-muted-foreground hover:underline"
                                            >
                                                {collateral.loan_code}
                                            </Link>
                                        </span>
                                    ) : (
                                        <Link
                                            href={route(
                                                "admin.loans.show",
                                                collateral.loan_id,
                                            )}
                                            className="text-primary hover:underline"
                                        >
                                            {collateral.loan_code}
                                        </Link>
                                    )}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        Status peminjaman
                                    </span>
                                    <LoanStatusBadge
                                        status={collateral.loan_status}
                                    />
                                </div>
                                <Info
                                    label="Alat dipinjam"
                                    value={collateral.equipment_summary || "—"}
                                />
                            </CardContent>
                        </Card>

                        {collateral.compensation?.required && (
                            <Card className="rounded-2xl border-destructive/30 bg-destructive/5 shadow-card">
                                <CardHeader>
                                    <CardTitle className="text-destructive">
                                        Kompensasi
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm">
                                    <p>
                                        Status:{" "}
                                        <strong>
                                            {collateral.compensation.status}
                                        </strong>
                                    </p>
                                    {collateral.compensation.amount && (
                                        <p className="mt-1">
                                            Nominal: Rp{" "}
                                            {collateral.compensation.amount.toLocaleString(
                                                "id-ID",
                                            )}
                                        </p>
                                    )}
                                    {collateral.compensation.description && (
                                        <p className="mt-2 text-muted-foreground">
                                            {collateral.compensation.description}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {collateral.loan_timeline?.length > 0 && (
                            <Card className="rounded-2xl border-border/60 shadow-card">
                                <CardHeader>
                                    <CardTitle>Riwayat Peminjaman</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ol className="relative space-y-3 border-l border-border pl-6">
                                        {collateral.loan_timeline.map(
                                            (entry, i) => (
                                                <li key={i} className="relative">
                                                    <span className="absolute -left-[1.6rem] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                                                    <LoanStatusBadge
                                                        status={entry.status}
                                                    />
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {
                                                            entry.created_at_formatted
                                                        }
                                                        {entry.note &&
                                                            ` — ${entry.note}`}
                                                    </p>
                                                </li>
                                            ),
                                        )}
                                    </ol>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            <DeleteCollateralDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                itemName={collateral.code}
                onConfirm={handleDelete}
                loading={deleting}
            />
            <InspectReturnDialog
                open={inspectOpen}
                onOpenChange={setInspectOpen}
                loanCode={collateral.loan_code}
                onConfirm={handleInspect}
                loading={inspecting}
            />
            <ReceiveCardDialog
                open={receiveOpen}
                onOpenChange={setReceiveOpen}
                studentName={collateral.student_name}
                defaultCardNumber={collateral.card_number ?? ""}
                onConfirm={handleReceiveCard}
                loading={receiving}
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
            <div className="mt-2 text-sm font-medium text-foreground">
                {value}
            </div>
        </div>
    );
}
