import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import LoanStatusBadge from "@/Components/LoanStatusBadge";
import PracticumParticipants from "@/Components/PracticumParticipants";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";

function flattenItems(submission) {
    const loans = submission.package_members ?? submission.loans ?? [];
    const rows = [];

    loans.forEach((loan) => {
        (loan.items ?? []).forEach((item) => {
            rows.push({
                key: `${loan.id}-${item.id ?? item.equipment_id}`,
                name: item.equipment_name ?? "Barang",
                code: item.equipment_code,
                category: loan.item_type_label ?? (loan.item_type === "bahan" ? "Bahan" : "Alat"),
                item_type: loan.item_type,
                quantity: item.quantity,
                unit: item.unit ?? "unit",
                status: loan.status,
            });
        });
    });

    return rows;
}

function primaryTimeline(submission) {
    const alat = submission.alat;
    const bahan = submission.bahan;
    if (alat?.timeline?.length) {
        return { timeline: alat.timeline, itemType: "alat" };
    }
    if (bahan?.timeline?.length) {
        return { timeline: bahan.timeline, itemType: "bahan" };
    }
    return { timeline: [], itemType: "submission" };
}

function jenisPengajuan(submission) {
    const alat = submission.alat;
    return (
        alat?.queue_type_label ||
        alat?.borrow_scope_label ||
        (submission.is_praktikum ? "Praktik Lab" : "Pengajuan")
    );
}

function InfoCell({ label, children }) {
    if (children == null || children === "" || children === "—") {
        return null;
    }

    return (
        <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {label}
            </p>
            <div className="mt-1 text-sm font-medium text-foreground">
                {children}
            </div>
        </div>
    );
}

export default function Submission({ submission }) {
    const items = flattenItems(submission);
    const { timeline, itemType: timelineItemType } = primaryTimeline(submission);
    const schedule = submission.alat;
    const showPracticumInfo = Boolean(submission.is_praktikum);

    return (
        <AppLayout>
            <Head title={`Detail Pengajuan ${submission.code}`} />

            <div className="animate-fade-in mx-auto w-full min-w-0 max-w-5xl space-y-6">
                <PageHeader
                    title="Detail Pengajuan"
                    subtitle={submission.code}
                    breadcrumbs={[
                        { label: "Dashboard", href: route("dashboard") },
                        {
                            label: "Pengajuan Siswa",
                            href: route("guru.loans.index"),
                        },
                        { label: submission.code },
                    ]}
                >
                    <Button variant="outline" asChild>
                        <Link href={route("guru.loans.index")}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Link>
                    </Button>
                </PageHeader>

                <Card className="rounded-[10px] border-border/60 shadow-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">
                            Ringkasan Pengajuan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm font-semibold text-foreground">
                                {submission.code}
                            </span>
                            <LoanStatusBadge
                                status={submission.status}
                                itemType="submission"
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <InfoCell label="Siswa">
                                {submission.borrower_name}
                            </InfoCell>
                            <InfoCell label="Kelas">
                                {submission.borrower_class || "—"}
                            </InfoCell>
                            <InfoCell label="Guru Pembimbing">
                                {submission.supervisor_name || "—"}
                            </InfoCell>
                            <InfoCell label="Jenis Pengajuan">
                                {jenisPengajuan(submission)}
                            </InfoCell>
                            <InfoCell label="Tanggal Pengajuan">
                                {submission.request_date_formatted}
                            </InfoCell>
                            <InfoCell label="Deadline">
                                {schedule?.due_at_formatted &&
                                schedule.due_at_formatted !== "—"
                                    ? schedule.due_at_formatted
                                    : null}
                            </InfoCell>
                        </div>

                        {submission.status_summary ? (
                            <p className="text-xs text-muted-foreground">
                                {submission.status_summary}
                            </p>
                        ) : null}

                        <PracticumParticipants submission={submission} />
                    </CardContent>
                </Card>

                {showPracticumInfo ? (
                    <Card className="rounded-[10px] border-border/60 shadow-card">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">
                                Informasi Praktikum
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <InfoCell label="Nama Praktikum">
                                    {schedule?.schedule_title ||
                                        submission.purpose ||
                                        "—"}
                                </InfoCell>
                                <InfoCell label="Mata Pelajaran">
                                    {schedule?.schedule_mata_kuliah}
                                </InfoCell>
                                <InfoCell label="Jam">
                                    {schedule?.slot_label ||
                                        (schedule?.schedule_jam_mulai
                                            ? `${schedule.schedule_jam_mulai}–${schedule.schedule_jam_selesai ?? ""}`
                                            : null)}
                                </InfoCell>
                                <InfoCell label="Ruangan">
                                    {schedule?.usage_room ||
                                        schedule?.schedule_ruangan}
                                </InfoCell>
                                <div className="sm:col-span-2">
                                    <InfoCell label="Catatan">
                                        {submission.notes?.trim() ||
                                            submission.purpose}
                                    </InfoCell>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : null}

                <Card className="rounded-[10px] border-border/60 shadow-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">
                            Barang Dipinjam
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {items.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[520px] text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                            <th className="px-3 py-2 font-semibold">
                                                Barang
                                            </th>
                                            <th className="px-3 py-2 font-semibold">
                                                Kategori
                                            </th>
                                            <th className="px-3 py-2 font-semibold">
                                                Jumlah
                                            </th>
                                            <th className="px-3 py-2 font-semibold">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {items.map((row) => (
                                            <tr key={row.key}>
                                                <td className="px-3 py-3">
                                                    <p className="font-medium text-foreground">
                                                        {row.name}
                                                    </p>
                                                    {row.code ? (
                                                        <p className="font-mono text-xs text-muted-foreground">
                                                            {row.code}
                                                        </p>
                                                    ) : null}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <Badge
                                                        variant="muted"
                                                        className="text-[10px]"
                                                    >
                                                        {row.category}
                                                    </Badge>
                                                </td>
                                                <td className="px-3 py-3 tabular-nums text-muted-foreground">
                                                    {row.quantity} {row.unit}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <LoanStatusBadge
                                                        status={row.status}
                                                        itemType={row.item_type}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Tidak ada barang pada pengajuan ini.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card className="rounded-[10px] border-border/60 shadow-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Status Paket</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {submission.alat ? (
                            <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
                                <span className="text-sm font-medium text-foreground">
                                    Alat
                                </span>
                                <LoanStatusBadge
                                    status={submission.alat.status}
                                    itemType="alat"
                                />
                            </div>
                        ) : null}
                        {submission.bahan ? (
                            <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
                                <span className="text-sm font-medium text-foreground">
                                    Bahan
                                </span>
                                <LoanStatusBadge
                                    status={submission.bahan.status}
                                    itemType="bahan"
                                />
                            </div>
                        ) : null}
                        {!submission.alat && !submission.bahan ? (
                            <p className="text-sm text-muted-foreground">
                                Belum ada paket alat/bahan.
                            </p>
                        ) : null}
                    </CardContent>
                </Card>

                <Card className="rounded-[10px] border-border/60 shadow-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">
                            Riwayat Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {timeline.length > 0 ? (
                            <ol className="relative space-y-4 border-l border-border pl-6">
                                {timeline.map((entry, i) => (
                                    <li key={i} className="relative">
                                        <span className="absolute -left-[1.6rem] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                                        <LoanStatusBadge
                                            status={entry.status}
                                            itemType={timelineItemType}
                                        />
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {entry.created_at_formatted}
                                            {entry.user_name
                                                ? ` · ${entry.user_name}`
                                                : ""}
                                            {entry.note
                                                ? ` — ${entry.note}`
                                                : ""}
                                        </p>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Belum ada riwayat status.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
