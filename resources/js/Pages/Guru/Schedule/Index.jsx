import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import EmptyState from "@/Components/EmptyState";
import { paginatorTotal } from "@/lib/paginator";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Select } from "@/Components/ui/select";
import WeekScheduleOverview from "@/Pages/Admin/Schedule/Components/WeekScheduleOverview";
import { Head, router, useForm } from "@inertiajs/react";
import { CalendarDays, Search } from "lucide-react";
import { useEffect, useRef } from "react";
import GuruScheduleTable from "./Components/GuruScheduleTable";

export default function Index({
    schedules,
    weekSchedules,
    filters,
    kelasOptions,
    subjectOptions,
}) {
    const { data, setData } = useForm({
        search: filters.search ?? "",
        status: filters.status ?? "all",
        kelas: filters.kelas ?? "all",
        mata_kuliah: filters.mata_kuliah ?? "all",
        date_from: filters.date_from ?? "",
        date_to: filters.date_to ?? "",
    });

    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timeout = setTimeout(() => {
            router.get(route("guru.schedules.index"), data, {
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
        data.mata_kuliah,
        data.date_from,
        data.date_to,
    ]);

    const list = schedules.data ?? [];
    const total = paginatorTotal(schedules);

    const resetFilters = () => {
        setData({
            search: "",
            status: "all",
            kelas: "all",
            mata_kuliah: "all",
            date_from: "",
            date_to: "",
        });
    };

    return (
        <AppLayout>
            <Head title="Jadwal Praktikum" />

            <div className="animate-fade-in">
                <PageHeader
                    title="Jadwal Praktikum"
                    subtitle={`${total} jadwal Anda`}
                />

                <WeekScheduleOverview schedules={weekSchedules ?? []} />

                <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="relative sm:col-span-2">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={data.search}
                            onChange={(e) => setData("search", e.target.value)}
                            placeholder="Cari judul, kode, mata pelajaran..."
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

                <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                        title="Dari tanggal"
                    />
                    <Input
                        type="date"
                        value={data.date_to}
                        onChange={(e) => setData("date_to", e.target.value)}
                        className="rounded-xl border-border/60 bg-card shadow-sm"
                        title="Sampai tanggal"
                    />
                </div>

                {total > 0 ? (
                    <GuruScheduleTable items={list} pagination={schedules} />
                ) : (
                    <EmptyState
                        icon={CalendarDays}
                        title="Tidak ada jadwal ditemukan"
                        description="Ubah filter atau tunggu jadwal praktikum baru dari admin."
                        action={
                            <Button variant="outline" onClick={resetFilters}>
                                Reset filter
                            </Button>
                        }
                    />
                )}
            </div>
        </AppLayout>
    );
}
