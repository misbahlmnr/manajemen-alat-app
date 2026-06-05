import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import SchedulePriorityBadge from "@/Components/SchedulePriorityBadge";
import ScheduleStatusBadge from "@/Components/ScheduleStatusBadge";
import { Button } from "@/Components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";

export default function Show({ schedule }) {
    const equipment = schedule.required_equipment ?? [];

    return (
        <AppLayout>
            <Head title={schedule.title} />

            <div className="animate-fade-in mx-auto max-w-5xl">
                <PageHeader title="Detail Jadwal" subtitle={schedule.code}>
                    <Button variant="outline" asChild>
                        <Link href={route("guru.schedules.index")}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Link>
                    </Button>
                </PageHeader>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="rounded-2xl border-border/60 shadow-card lg:col-span-1">
                        <CardContent className="p-6">
                            <p className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                {schedule.code}
                            </p>
                            <h2 className="mt-2 font-display text-xl font-bold leading-tight text-foreground">
                                {schedule.title}
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {schedule.mata_kuliah} • {schedule.kelas}
                            </p>

                            <div className="mt-6 space-y-4 border-t border-border pt-6">
                                <MetaRow label="Status">
                                    <ScheduleStatusBadge
                                        status={schedule.status}
                                        displayStatus={schedule.display_status}
                                    />
                                </MetaRow>
                                <MetaRow label="Prioritas">
                                    <SchedulePriorityBadge
                                        priority={schedule.priority}
                                    />
                                </MetaRow>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6 lg:col-span-2">
                        <Card className="rounded-2xl border-border/60 shadow-card">
                            <CardHeader>
                                <CardTitle>Informasi Jadwal</CardTitle>
                                <CardDescription>
                                    Detail pelaksanaan praktikum
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <Info
                                    label="Mata pelajaran"
                                    value={schedule.mata_kuliah}
                                />
                                <Info
                                    label="Jurusan"
                                    value={schedule.jurusan}
                                />
                                <Info label="Kelas" value={schedule.kelas} />
                                <Info
                                    label="Ruang / Lab"
                                    value={schedule.ruangan || "—"}
                                />
                                <Info
                                    label="Tanggal"
                                    value={schedule.tanggal_formatted}
                                />
                                <Info
                                    label="Waktu"
                                    value={schedule.waktu_label}
                                />
                                {schedule.notes && (
                                    <div className="sm:col-span-2">
                                        <Info
                                            label="Catatan"
                                            value={schedule.notes}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl border-border/60 shadow-card">
                            <CardHeader>
                                <CardTitle>Kebutuhan Alat</CardTitle>
                                <CardDescription>
                                    Alat yang direncanakan untuk jadwal ini
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {equipment.length > 0 ? (
                                    <ul className="divide-y divide-border rounded-xl border border-border/50">
                                        {equipment.map((row) => (
                                            <li
                                                key={row.equipment_id}
                                                className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                                            >
                                                <div>
                                                    <p className="font-medium text-foreground">
                                                        {row.equipment_name}
                                                    </p>
                                                    <p className="font-mono text-xs text-muted-foreground">
                                                        {row.equipment_code}
                                                    </p>
                                                </div>
                                                <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                                                    {row.quantity} unit
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Tidak ada alat yang ditambahkan untuk
                                        jadwal ini.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
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
        <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
        </div>
    );
}
