import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import EmptyState from "@/Components/EmptyState";
import DataPagination from "@/Components/DataPagination";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Select } from "@/Components/ui/select";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { CalendarDays, Plus, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ScheduleTable from "./Components/ScheduleTable";
import DeleteScheduleDialog from "./Components/DeleteScheduleDialog";
import WeekScheduleOverview from "./Components/WeekScheduleOverview";

export default function Index({
    schedules,
    weekSchedules,
    filters,
    guruOptions,
    kelasOptions,
    subjectOptions,
}) {
    const { data, setData } = useForm({
        search: filters.search ?? "",
        status: filters.status ?? "all",
        kelas: filters.kelas ?? "all",
        guru_id: filters.guru_id ?? "all",
        mata_kuliah: filters.mata_kuliah ?? "all",
        date_from: filters.date_from ?? "",
        date_to: filters.date_to ?? "",
    });

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timeout = setTimeout(() => {
            router.get(route("admin.schedules.index"), data, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 400);

        return () => clearTimeout(timeout);
    }, [
        data.search,
        data.status,
        data.kelas,
        data.guru_id,
        data.mata_kuliah,
        data.date_from,
        data.date_to,
    ]);

    const handleDelete = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(route("admin.schedules.destroy", deleteTarget.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    const list = schedules.data ?? [];

    return (
        <AppLayout>
            <Head title="Jadwal Praktikum" />

            <div className="animate-fade-in">
                <PageHeader
                    title="Jadwal Praktikum"
                    subtitle={`${schedules.meta?.total ?? 0} jadwal terdaftar`}
                >
                    <Button asChild>
                        <Link href={route("admin.schedules.create")}>
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Jadwal
                        </Link>
                    </Button>
                </PageHeader>

                <WeekScheduleOverview schedules={weekSchedules ?? []} />

                <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="relative sm:col-span-2 lg:col-span-2">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={data.search}
                            onChange={(e) => setData("search", e.target.value)}
                            placeholder="Cari judul, kode, mata pelajaran, guru..."
                            className="rounded-xl border-border/60 bg-card pl-10 shadow-sm"
                        />
                    </div>
                    <Select
                        value={data.mata_kuliah}
                        onChange={(e) =>
                            setData("mata_kuliah", e.target.value)
                        }
                        className="rounded-xl border-border/60 bg-card shadow-sm"
                    >
                        <option value="all">Semua mapel</option>
                        {subjectOptions.map((subject) => (
                            <option key={subject} value={subject}>
                                {subject}
                            </option>
                        ))}
                    </Select>
                    <Select
                        value={data.kelas}
                        onChange={(e) => setData("kelas", e.target.value)}
                        className="rounded-xl border-border/60 bg-card shadow-sm"
                    >
                        <option value="all">Semua kelas</option>
                        {kelasOptions.map((kelas) => (
                            <option key={kelas} value={kelas}>
                                {kelas}
                            </option>
                        ))}
                    </Select>
                </div>

                <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Select
                        value={data.guru_id}
                        onChange={(e) => setData("guru_id", e.target.value)}
                        className="rounded-xl border-border/60 bg-card shadow-sm"
                    >
                        <option value="all">Semua guru</option>
                        {guruOptions.map((guru) => (
                            <option key={guru.id} value={guru.id}>
                                {guru.name}
                            </option>
                        ))}
                    </Select>
                    <Select
                        value={data.status}
                        onChange={(e) => setData("status", e.target.value)}
                        className="rounded-xl border-border/60 bg-card shadow-sm"
                    >
                        <option value="all">Semua status</option>
                        <option value="draft">Draft</option>
                        <option value="aktif">Aktif</option>
                        <option value="selesai">Selesai</option>
                        <option value="dibatalkan">Dibatalkan</option>
                    </Select>
                    <Input
                        type="date"
                        value={data.date_from}
                        onChange={(e) => setData("date_from", e.target.value)}
                        className="rounded-xl border-border/60 bg-card shadow-sm"
                        placeholder="Dari tanggal"
                    />
                    <Input
                        type="date"
                        value={data.date_to}
                        onChange={(e) => setData("date_to", e.target.value)}
                        className="rounded-xl border-border/60 bg-card shadow-sm"
                        placeholder="Sampai tanggal"
                    />
                </div>

                {list.length > 0 ? (
                    <>
                        <ScheduleTable
                            items={list}
                            onDelete={setDeleteTarget}
                        />
                        <DataPagination
                            links={schedules.links}
                            meta={schedules.meta}
                        />
                    </>
                ) : (
                    <EmptyState
                        icon={CalendarDays}
                        title="Tidak ada jadwal ditemukan"
                        description="Ubah filter atau tambahkan jadwal praktikum baru."
                        action={
                            <Button asChild variant="outline">
                                <Link href={route("admin.schedules.create")}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Tambah jadwal
                                </Link>
                            </Button>
                        }
                    />
                )}
            </div>

            <DeleteScheduleDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                itemName={deleteTarget?.title}
                onConfirm={handleDelete}
                loading={deleting}
            />
        </AppLayout>
    );
}
