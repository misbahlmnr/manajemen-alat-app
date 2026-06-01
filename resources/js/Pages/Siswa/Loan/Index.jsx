import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import EmptyState from "@/Components/EmptyState";
import { paginatorTotal } from "@/lib/paginator";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Select } from "@/Components/ui/select";
import CancelLoanDialog from "./Components/CancelLoanDialog";
import RequestReturnDialog from "./Components/RequestReturnDialog";
import StudentLoanCardList from "./Components/StudentLoanCardList";
import LoanTypeTabPills from "./Components/LoanTypeTabPills";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { ClipboardList, History, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const HISTORY_STATUSES = [
    "dikembalikan",
    "ditolak",
    "dibatalkan",
    "dipinjam",
];
const ACTIVE_STATUSES_EXCLUDE = ["dikembalikan", "ditolak", "dibatalkan"];

export default function Index({ loans, filters, tabCounts, statusOptions }) {
    const isHistory = filters.scope === "history";
    const isFirstRender = useRef(true);

    const { data, setData } = useForm({
        search: filters.search ?? "",
        status: filters.status ?? "all",
        item_type: filters.item_type ?? "all",
        date_from: filters.date_from ?? "",
        date_to: filters.date_to ?? "",
    });

    const [cancelTarget, setCancelTarget] = useState(null);
    const [returnTarget, setReturnTarget] = useState(null);
    const [cancelling, setCancelling] = useState(false);
    const [returning, setReturning] = useState(false);

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
                route("siswa.loans.index"),
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
        data.date_from,
        data.date_to,
        filters.scope,
    ]);

    const list = loans.data ?? [];
    const total = paginatorTotal(loans);

    const handleCancel = () => {
        if (!cancelTarget) return;
        setCancelling(true);
        router.post(route("siswa.loans.cancel", cancelTarget.id), {}, {
            preserveScroll: true,
            onFinish: () => {
                setCancelling(false);
                setCancelTarget(null);
            },
        });
    };

    const handleReturn = (note) => {
        if (!returnTarget) return;
        setReturning(true);
        router.post(
            route("siswa.loans.request-return", returnTarget.id),
            { note: note ?? "" },
            {
                preserveScroll: true,
                onFinish: () => {
                    setReturning(false);
                    setReturnTarget(null);
                },
            },
        );
    };

    const resetFilters = () => {
        setData({
            search: "",
            status: "all",
            item_type: "all",
            date_from: "",
            date_to: "",
        });
    };

    return (
        <AppLayout>
            <Head
                title={
                    isHistory
                        ? "Riwayat Peminjaman & Bahan"
                        : "Peminjaman Saya"
                }
            />

            <div className="animate-fade-in">
                <PageHeader
                    title={
                        isHistory
                            ? "Riwayat Peminjaman & Bahan"
                            : "Peminjaman Saya"
                    }
                    subtitle={
                        isHistory
                            ? `${total} arsip peminjaman alat & pengambilan bahan`
                            : `${total} pengajuan aktif (menunggu / sedang dipinjam)`
                    }
                >
                    {!isHistory && (
                        <Button asChild>
                            <Link href={route("siswa.loans.create")}>
                                <Plus className="mr-2 h-4 w-4" />
                                Ajukan Peminjaman
                            </Link>
                        </Button>
                    )}
                </PageHeader>

                <LoanTypeTabPills
                    value={tabValue}
                    onChange={(tab) =>
                        setData("item_type", tab === "all" ? "all" : tab)
                    }
                    counts={tabCounts}
                />

                <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="relative sm:col-span-2">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={data.search}
                            onChange={(e) => setData("search", e.target.value)}
                            placeholder="Cari kode, barang, keperluan..."
                            className="rounded-xl border-border/60 bg-card pl-10 shadow-sm"
                        />
                    </div>
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
                    <StudentLoanCardList
                        items={list}
                        pagination={loans}
                        isHistory={isHistory}
                        onCancel={setCancelTarget}
                        onRequestReturn={setReturnTarget}
                    />
                ) : (
                    <EmptyState
                        icon={isHistory ? History : ClipboardList}
                        title={
                            isHistory
                                ? "Belum ada riwayat"
                                : "Belum ada peminjaman"
                        }
                        description={
                            isHistory
                                ? "Peminjaman alat yang selesai dan bahan yang sudah diambil akan tampil di sini."
                                : "Ajukan peminjaman alat atau pengambilan bahan untuk melacak statusnya di halaman ini."
                        }
                        action={
                            !isHistory ? (
                                <div className="flex flex-wrap justify-center gap-2">
                                    <Button asChild>
                                        <Link
                                            href={route("siswa.loans.create")}
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Ajukan Peminjaman
                                        </Link>
                                    </Button>
                                    {(data.search !== "" ||
                                        data.status !== "all" ||
                                        data.item_type !== "all" ||
                                        data.date_from ||
                                        data.date_to) && (
                                        <Button
                                            variant="outline"
                                            onClick={resetFilters}
                                        >
                                            Reset filter
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                (data.search !== "" ||
                                    data.status !== "all" ||
                                    data.item_type !== "all" ||
                                    data.date_from ||
                                    data.date_to) && (
                                    <Button
                                        variant="outline"
                                        onClick={resetFilters}
                                    >
                                        Reset filter
                                    </Button>
                                )
                            )
                        }
                    />
                )}
            </div>

            <CancelLoanDialog
                open={!!cancelTarget}
                onOpenChange={(open) => !open && setCancelTarget(null)}
                itemName={
                    cancelTarget?.items_summary ??
                    cancelTarget?.display_title ??
                    cancelTarget?.code
                }
                onConfirm={handleCancel}
                loading={cancelling}
            />

            <RequestReturnDialog
                open={!!returnTarget}
                onOpenChange={(open) => !open && setReturnTarget(null)}
                itemName={
                    returnTarget?.display_title ??
                    returnTarget?.items_summary ??
                    returnTarget?.code
                }
                requiresInspection={returnTarget?.requires_collateral}
                onConfirm={handleReturn}
                loading={returning}
            />
        </AppLayout>
    );
}
