import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import LoanStatusBadge from "@/Components/LoanStatusBadge";
import SubmissionTypeBadges from "@/Components/SubmissionTypeBadges";
import { Button } from "@/Components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Package, Wrench } from "lucide-react";

function ItemLines({ loan }) {
    const items = loan?.items ?? [];
    if (!items.length) {
        return (
            <p className="text-sm text-muted-foreground">
                {loan?.items_summary || "Tidak ada item"}
            </p>
        );
    }

    return (
        <ul className="space-y-1.5">
            {items.map((item) => (
                <li
                    key={item.id ?? item.equipment_id}
                    className="flex items-center justify-between gap-3 text-sm"
                >
                    <span className="font-medium">
                        {item.equipment_name ?? "Item"}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                        ×{item.quantity}
                    </span>
                </li>
            ))}
        </ul>
    );
}

function TypeCard({ title, icon: Icon, loan, emptyLabel, detailHref, accent }) {
    const hasLoan = Boolean(loan);

    return (
        <Card className={`rounded-2xl border-border/60 shadow-card ${accent}`}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Icon className="h-4 w-4" />
                            {title}
                        </CardTitle>
                        <CardDescription>
                            {hasLoan ? loan.item_type_label : emptyLabel}
                        </CardDescription>
                    </div>
                    {hasLoan && (
                        <LoanStatusBadge
                            status={loan.status}
                            itemType={loan.item_type}
                        />
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {hasLoan ? (
                    <>
                        <ItemLines loan={loan} />
                        <Button variant="outline" asChild className="w-full sm:w-auto">
                            <Link href={detailHref}>Lihat Detail {title}</Link>
                        </Button>
                    </>
                ) : (
                    <p className="text-sm text-muted-foreground">{emptyLabel}</p>
                )}
            </CardContent>
        </Card>
    );
}

export default function Submission({ submission }) {
    return (
        <AppLayout>
            <Head title={submission.code} />

            <div className="animate-fade-in mx-auto w-full min-w-0 max-w-5xl">
                <PageHeader
                    title={submission.code}
                    subtitle="Pengajuan alat & bahan"
                >
                    <Button variant="outline" asChild>
                        <Link href={route("siswa.loans.index")}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Link>
                    </Button>
                </PageHeader>

                <Card className="mb-6 rounded-2xl border-border/60 shadow-card">
                    <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
                        <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                Peminjam
                            </p>
                            <p className="mt-1 font-display text-xl font-bold">
                                {submission.borrower_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {submission.borrower_class || "—"}
                            </p>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                    Keperluan
                                </p>
                                <p className="mt-1 font-medium">
                                    {submission.notes?.trim() ||
                                        submission.purpose ||
                                        "—"}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                        Guru
                                    </p>
                                    <p className="mt-1 font-medium">
                                        {submission.supervisor_name || "—"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                        Tanggal
                                    </p>
                                    <p className="mt-1 font-medium">
                                        {submission.request_date_formatted}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                <SubmissionTypeBadges
                                    alatCount={submission.alat_count}
                                    bahanCount={submission.bahan_count}
                                />
                                <LoanStatusBadge
                                    status={submission.status}
                                    itemType="submission"
                                />
                            </div>
                            {submission.status_summary ? (
                                <p className="pt-1 text-xs text-muted-foreground">
                                    {submission.status_summary}
                                </p>
                            ) : null}
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                    <TypeCard
                        title="Alat"
                        icon={Wrench}
                        loan={submission.alat}
                        emptyLabel="Tidak ada alat"
                        detailHref={
                            submission.alat
                                ? route("siswa.loans.show", submission.alat.id)
                                : "#"
                        }
                        accent="border-violet-500/20"
                    />
                    <TypeCard
                        title="Bahan"
                        icon={Package}
                        loan={submission.bahan}
                        emptyLabel="Tidak ada bahan"
                        detailHref={
                            submission.bahan
                                ? route("siswa.loans.show", submission.bahan.id)
                                : "#"
                        }
                        accent="border-amber-500/20"
                    />
                </div>
            </div>
        </AppLayout>
    );
}
