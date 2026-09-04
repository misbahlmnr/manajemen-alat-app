import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import LoanStatusBadge from "@/Components/LoanStatusBadge";
import CollateralStatusBadge from "@/Components/CollateralStatusBadge";
import StatusTimeline from "@/Components/StatusTimeline";
import { Button } from "@/Components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import { buildLoanProgressSteps } from "@/lib/loanTimeline";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";
import { useMemo } from "react";

export default function Show({ loan }) {
    const timeline = loan.timeline ?? [];
    const items = loan.items ?? [];
    const isBahan = loan.item_type === "bahan";
    const progressSteps = useMemo(
        () => buildLoanProgressSteps(loan),
        [loan],
    );
    const backRoute =
        loan.status &&
        ["dikembalikan", "ditolak", "dibatalkan"].includes(loan.status)
            ? route("guru.loans.index", { scope: "history" })
            : loan.item_type === "bahan" && loan.status === "dipinjam"
              ? route("guru.loans.index", { scope: "history" })
              : route("guru.loans.index");

    return (
        <AppLayout>
            <Head title={loan.code} />

            <div className="animate-fade-in mx-auto w-full min-w-0 max-w-5xl">
                <PageHeader
                    title={isBahan ? "Detail Bahan" : "Detail Alat"}
                    subtitle={`${loan.submission_code || loan.code} · ${loan.item_type_label}`}
                    breadcrumbs={[
                        { label: "Dashboard", href: route("dashboard") },
                        { label: "Pengajuan", href: backRoute },
                        { label: loan.code },
                    ]}
                >
                    <Button variant="outline" asChild>
                        <Link
                            href={
                                loan.submission_code
                                    ? route(
                                          "guru.loans.submission",
                                          loan.submission_code,
                                      )
                                    : backRoute
                            }
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Link>
                    </Button>
                </PageHeader>

                {loan.is_overdue && (
                    <div className="mb-6 rounded-[8px] border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                        Peminjaman ini terlambat. Koordinasikan dengan siswa
                        untuk pengembalian alat.
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>Peminjam</CardTitle>
                                <CardDescription>{loan.code}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <h2 className="font-display text-xl font-bold text-foreground">
                                    {loan.borrower_name}
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {loan.borrower_class
                                        ? `${loan.borrower_class} · `
                                        : ""}
                                    {loan.item_type_label}
                                </p>
                                <div className="mt-6 space-y-4 border-t border-border pt-6">
                                    <MetaRow label="Status">
                                        <LoanStatusBadge
                                            status={loan.status}
                                            itemType={loan.item_type}
                                        />
                                    </MetaRow>
                                    {loan.is_catch_up && (
                                        <MetaRow label="Jenis">
                                            <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                                                Lanjutan praktikum
                                            </span>
                                        </MetaRow>
                                    )}
                                    {loan.purpose && (
                                        <MetaRow label="Tujuan">
                                            <span className="max-w-[10rem] truncate text-sm font-medium">
                                                {loan.purpose}
                                            </span>
                                        </MetaRow>
                                    )}
                                </div>
                                {loan.rejection_reason && (
                                    <p className="mt-4 rounded-[8px] border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                                        <strong>Alasan ditolak:</strong>{" "}
                                        {loan.rejection_reason}
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Timeline</CardTitle>
                                <CardDescription>
                                    Progress hingga selesai
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <StatusTimeline steps={progressSteps} />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6 lg:col-span-2">
                        <Card>
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
                                    label={isBahan ? "Diambil" : "Dipinjam"}
                                    value={loan.borrowed_at_formatted}
                                />
                                {!isBahan && (
                                    <Info
                                        label="Dikembalikan"
                                        value={loan.returned_at_formatted}
                                    />
                                )}
                                {isBahan && loan.status === "dikembalikan" && (
                                    <Info
                                        label="Selesai"
                                        value={loan.returned_at_formatted}
                                    />
                                )}
                                {loan.notes && (
                                    <div className="sm:col-span-2">
                                        <Info label="Catatan" value={loan.notes} />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Barang</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="divide-y divide-border rounded-[8px] border border-border/50">
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
                            <Card>
                                <CardHeader>
                                    <CardTitle>Jaminan Kartu</CardTitle>
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
                            <Card className="border-destructive/30 bg-destructive/5">
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
                            <Card>
                                <CardHeader>
                                    <CardTitle>Riwayat</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ol className="relative space-y-4 border-l border-border pl-6">
                                        {timeline.map((entry, i) => (
                                            <li key={i} className="relative">
                                                <span className="absolute -left-[1.6rem] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                                                <LoanStatusBadge
                                                    status={entry.status}
                                                    itemType={loan.item_type}
                                                />
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {entry.created_at_formatted}
                                                    {entry.user_name &&
                                                        ` · ${entry.user_name}`}
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
        <div className="rounded-[8px] border border-border/50 bg-muted/20 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
        </div>
    );
}
