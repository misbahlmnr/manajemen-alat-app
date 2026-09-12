import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import LoanStatusBadge from "@/Components/LoanStatusBadge";
import SubmissionTypeBadges from "@/Components/SubmissionTypeBadges";
import SubmissionTypeCard from "@/Components/SubmissionTypeCard";
import { Button } from "@/Components/ui/button";
import { Card, CardContent } from "@/Components/ui/card";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Package, Wrench } from "lucide-react";

export default function Submission({ submission }) {
    const alat = submission.alat;
    const bahan = submission.bahan;
    const scheduleLabel = [alat?.schedule_title, alat?.slot_label]
        .filter(Boolean)
        .join(" · ");

    return (
        <AppLayout>
            <Head title={submission.code} />

            <div className="animate-fade-in mx-auto max-w-5xl">
                <PageHeader
                    title={submission.code}
                    subtitle="Satu pengajuan praktikum"
                >
                    <Button variant="outline" asChild>
                        <Link href={route("admin.loans.index")}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Link>
                    </Button>
                </PageHeader>

                <Card className="mb-6 rounded-[10px] border-border/60 shadow-card">
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
                            {alat?.schedule_title ? (
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                        Jadwal
                                    </p>
                                    <p className="mt-1 font-medium">
                                        {scheduleLabel}
                                    </p>
                                </div>
                            ) : null}
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
                    <SubmissionTypeCard
                        title="Alat"
                        icon={Wrench}
                        loan={alat}
                        emptyLabel="Tidak ada alat pada pengajuan ini"
                        actionHref={
                            alat ? route("admin.loans.show", alat.id) : null
                        }
                        actionLabel="Kelola Alat"
                        actionVariant="default"
                        accent="border-violet-500/20"
                    />
                    <SubmissionTypeCard
                        title="Bahan"
                        icon={Package}
                        loan={bahan}
                        emptyLabel="Tidak ada bahan pada pengajuan ini"
                        actionHref={
                            bahan ? route("admin.loans.show", bahan.id) : null
                        }
                        actionLabel="Kelola Bahan"
                        actionVariant="default"
                        accent="border-amber-500/20"
                    />
                </div>
            </div>
        </AppLayout>
    );
}
