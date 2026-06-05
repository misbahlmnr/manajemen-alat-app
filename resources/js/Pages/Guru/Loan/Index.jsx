import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import EmptyState from "@/Components/EmptyState";
import { paginatorTotal } from "@/lib/paginator";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Select } from "@/Components/ui/select";
import LoanTypeTabPills from "@/Pages/Siswa/Loan/Components/LoanTypeTabPills";
import { Head, router, useForm } from "@inertiajs/react";
import { ClipboardList, History, Search } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import GuruLoanCardList from "./Components/GuruLoanCardList";

const HISTORY_STATUSES = [
    "dikembalikan",
    "ditolak",
    "dibatalkan",
    "dipinjam",
];
const ACTIVE_STATUSES_EXCLUDE = ["dikembalikan", "ditolak", "dibatalkan"];

export default function Index({
    loans,
    filters,
    tabCounts,
    statusOptions,
    kelasOptions,
}) {
    const isHistory = filters.scope === "history";
    const isFirstRender = useRef(true);

    const { data, setData } = useForm({
        search: filters.search ?? "",
        status: filters.status ?? "all",
        item_type: filters.item_type ?? "all",
        kelas: filters.kelas ?? "all",
        date_from: filters.date_from ?? "",
        date_to: filters.date_to ?? "",
    });

    const tabValue =
        data.item_type === "alat" || data.item_type === "bahan"
            ? data.item_type
            : "all";

    const filteredStatusOptions = useMemo(() => {
        const entries = Object.entries(statusOptions ?? {});
        return Object.fromEntries(
            entries.filter(([key]) =>
                isHistory
                    ? HISTORY_STATUSES.includes(key)
                    : !ACTIVE_STATUSES_EXCLUDE.includes(key),
            ),
        );
    }, [statusOptions, isHistory]);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timeout = setTimeout(() => {
            router.get(
                route("guru.loans.index"),
                {
                    ...data,
                    scope: filters.scope,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 400);

        return () => clearTimeout(timeout);
    }, [
        data.search,
        data.status,
        data.item_type,
        data.kelas,
        data.date_from,
        data.date_to,
        filters.scope,
    ]);

    const list = loans.data ?? [];
    const total = paginatorTotal(loans);

    const resetFilters = () => {
        setData({
            search: "",
            status: "all",
            item_type: "all",
            kelas: "all",
            date_from: "",
            date_to: "",
        });
    };

    const hasActiveFilters =
        data.search !== "" ||
        data.status !== "all" ||
        data.item_type !== "all" ||
        data.kelas !== "all" ||
        data.date_from ||
        data.date_to;

    return (
        <AppLayout>
            <Head
                title={
                    isHistory
                        ? "Riwayat Peminjaman Siswa"
                        : "Peminjaman Siswa"
                }
            />

            <div className="animate-fade-in">
                <PageHeader
                    title={
                        isHistory
                            ? "Riwayat Peminjaman Siswa"
                            : "Peminjaman Siswa"
                    }
                    subtitle={
                        isHistory
                            ? `${total} arsip peminjaman yang Anda bimbing`
                            : `${total} peminjaman aktif siswa bimbingan Anda`
                    }
                />

                <LoanTypeTabPills
                    value={tabValue}
                    onChange={(tab) =>
                        setData("item_type", tab === "all" ? "all" : tab)
                    }
                    counts={tabCounts}
                />

                <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="relative sm:col-span-2">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={data.search}
                            onChange={(e) => setData("search", e.target.value)}
                            placeholder="Cari kode, siswa, barang..."
                            className="rounded-xl border-border/60 bg-card pl-10 shadow-sm"
                        />
                    </div>
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
                    <Select
                        value={data.status}
                        onChange={(e) => setData("status", e.target.value)}
                        className="rounded-xl border-border/60 bg-card shadow-sm"
                    >
                        <option value="all">Semua status</option>
                        {Object.entries(filteredStatusOptions).map(
                            ([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ),
                        )}
                    </Select>
                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            type="date"
                            value={data.date_from}
                            onChange={(e) =>
                                setData("date_from", e.target.value)
                            }
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
                </div>

                {total > 0 ? (
                    <GuruLoanCardList
                        items={list}
                        pagination={loans}
                        isHistory={isHistory}
                    />
                ) : (
                    <EmptyState
                        icon={isHistory ? History : ClipboardList}
                        title={
                            isHistory
                                ? "Belum ada riwayat"
                                : "Belum ada peminjaman aktif"
                        }
                        description={
                            isHistory
                                ? "Peminjaman alat yang selesai dan bahan yang sudah diambil akan tampil di sini."
                                : "Peminjaman siswa yang Anda bimbing akan muncul di halaman ini."
                        }
                        action={
                            hasActiveFilters && (
                                <Button variant="outline" onClick={resetFilters}>
                                    Reset filter
                                </Button>
                            )
                        }
                    />
                )}
            </div>
        </AppLayout>
    );
}
