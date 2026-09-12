import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import EmptyState from "@/Components/EmptyState";
import { paginatorTotal } from "@/lib/paginator";
import { cn } from "@/lib/utils";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Select } from "@/Components/ui/select";
import { Head, router, useForm } from "@inertiajs/react";
import {
    CalendarDays,
    ClipboardList,
    ListOrdered,
    Search,
    SlidersHorizontal,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import InspectReturnDialog from "../Collateral/Components/InspectReturnDialog";
import LoanTable from "./Components/LoanTable";
import LoanWorkList from "./Components/LoanWorkList";
import RejectLoanDialog from "./Components/RejectLoanDialog";
import ReturnLoanDialog from "./Components/ReturnLoanDialog";

const SCOPE_TABS = [
    { key: "action", label: "Perlu diproses", icon: ClipboardList },
    { key: "queue", label: "Antrian", icon: ListOrdered },
    { key: "today", label: "Hari ini", icon: CalendarDays },
    { key: "all", label: "Semua", icon: Search },
];

const EMPTY_COPY = {
    action: {
        title: "Tidak ada yang perlu diproses",
        description:
            "Pengajuan menunggu persetujuan, serah terima, atau inspeksi akan muncul di sini.",
    },
    queue: {
        title: "Antrian kosong",
        description: "Tidak ada pengajuan yang sedang menunggu sisa stok.",
    },
    today: {
        title: "Tidak ada booking hari ini",
        description: "Pengajuan dengan tanggal booking hari ini tampil di tab ini.",
    },
    all: {
        title: "Tidak ada pengajuan ditemukan",
        description: "Coba ubah kata kunci atau filter arsip.",
    },
};

export default function Index({
    loans,
    filters,
    tabCounts = {},
    supervisorOptions = [],
    kelasOptions = [],
    statusOptions = {},
}) {
    const scope = filters.scope ?? "action";
    const isArchive = scope === "all";
    const { data, setData } = useForm({
        search: filters.search ?? "",
        status: filters.status ?? "all",
        item_type: filters.item_type ?? "all",
        supervisor_id: filters.supervisor_id ?? "all",
        kelas: filters.kelas ?? "all",
        date_from: filters.date_from ?? "",
        date_to: filters.date_to ?? "",
    });

    const isFirstRender = useRef(true);
    const [moreFilters, setMoreFilters] = useState(
        Boolean(
            (filters.status && filters.status !== "all") ||
                (filters.item_type && filters.item_type !== "all") ||
                (filters.supervisor_id && filters.supervisor_id !== "all") ||
                filters.date_from ||
                filters.date_to,
        ),
    );
    const [rejectTarget, setRejectTarget] = useState(null);
    const [returnTarget, setReturnTarget] = useState(null);
    const [inspectTarget, setInspectTarget] = useState(null);
    const [rejecting, setRejecting] = useState(false);
    const [returning, setReturning] = useState(false);
    const [inspecting, setInspecting] = useState(false);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const timeout = setTimeout(() => {
            router.get(
                route("admin.loans.index"),
                {
                    scope,
                    search: data.search,
                    kelas: data.kelas,
                    ...(isArchive
                        ? {
                              status: data.status,
                              item_type: data.item_type,
                              supervisor_id: data.supervisor_id,
                              date_from: data.date_from,
                              date_to: data.date_to,
                          }
                        : {}),
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
        data.supervisor_id,
        data.kelas,
        data.date_from,
        data.date_to,
        scope,
        isArchive,
    ]);

    const switchScope = (nextScope) => {
        router.get(
            route("admin.loans.index"),
            {
                scope: nextScope,
                search: data.search,
                kelas: data.kelas,
            },
            { preserveState: false, replace: true },
        );
    };

    const handleReject = (reason) => {
        if (!rejectTarget) return;
        setRejecting(true);
        router.post(
            route("admin.loans.reject", rejectTarget.id),
            { rejection_reason: reason },
            {
                preserveScroll: true,
                onFinish: () => {
                    setRejecting(false);
                    setRejectTarget(null);
                },
            },
        );
    };

    const handleReturn = (note) => {
        if (!returnTarget) return;
        setReturning(true);
        router.post(
            route("admin.loans.return", returnTarget.id),
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

    const handleInspect = (payload) => {
        if (!inspectTarget) return;
        setInspecting(true);
        router.post(route("admin.loans.inspect", inspectTarget.id), payload, {
            preserveScroll: true,
            onFinish: () => {
                setInspecting(false);
                setInspectTarget(null);
            },
        });
    };

    const list = loans.data ?? [];
    const total = paginatorTotal(loans);
    const empty = EMPTY_COPY[scope] ?? EMPTY_COPY.all;

    return (
        <AppLayout>
            <Head title="Peminjaman" />

            <div className="animate-fade-in">
                <PageHeader
                    title="Peminjaman"
                    subtitle="Kerjakan pengajuan yang menunggu tindakan, lalu cari arsip jika perlu"
                />

                <div className="mb-4 flex w-full flex-wrap items-center gap-1.5 rounded-[10px] border border-border bg-card p-1.5 shadow-[var(--shadow-card)]">
                    {SCOPE_TABS.map(({ key, label, icon: Icon }) => {
                        const count = tabCounts[key];
                        const active = scope === key;
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => switchScope(key)}
                                className={cn(
                                    "flex min-h-10 flex-1 items-center justify-center gap-2 rounded-[8px] px-3 py-2 text-sm font-medium transition-colors sm:flex-none sm:px-4",
                                    active
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                                {typeof count === "number" ? (
                                    <span
                                        className={cn(
                                            "rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                                            active
                                                ? "bg-primary-foreground/20"
                                                : "bg-muted text-muted-foreground",
                                        )}
                                    >
                                        {count}
                                    </span>
                                ) : null}
                            </button>
                        );
                    })}
                </div>

                <div className="mb-6 rounded-xl border bg-card p-4 shadow-sm sm:p-5">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="relative sm:col-span-2">
                            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={data.search}
                                onChange={(e) =>
                                    setData("search", e.target.value)
                                }
                                placeholder="Cari kode, nama siswa, atau barang..."
                                className="pl-10"
                            />
                        </div>
                        <Select
                            value={data.kelas}
                            onChange={(e) => setData("kelas", e.target.value)}
                        >
                            <option value="all">Semua kelas</option>
                            {kelasOptions.map((k) => (
                                <option key={k} value={k}>
                                    {k}
                                </option>
                            ))}
                        </Select>
                        {isArchive ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setMoreFilters((open) => !open)}
                            >
                                <SlidersHorizontal className="mr-2 h-4 w-4" />
                                Filter arsip
                            </Button>
                        ) : (
                            <p className="self-center text-xs text-muted-foreground">
                                {total} pengajuan di tab ini
                            </p>
                        )}
                    </div>

                    {isArchive && moreFilters ? (
                        <div className="mt-3 grid gap-3 border-t border-border/60 pt-3 sm:grid-cols-2 lg:grid-cols-4">
                            <Select
                                value={data.status}
                                onChange={(e) =>
                                    setData("status", e.target.value)
                                }
                            >
                                <option value="all">Semua status</option>
                                {Object.entries(statusOptions).map(
                                    ([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ),
                                )}
                            </Select>
                            <Select
                                value={data.item_type}
                                onChange={(e) =>
                                    setData("item_type", e.target.value)
                                }
                            >
                                <option value="all">Semua jenis</option>
                                <option value="alat">Alat</option>
                                <option value="bahan">Bahan</option>
                            </Select>
                            <Select
                                value={data.supervisor_id}
                                onChange={(e) =>
                                    setData("supervisor_id", e.target.value)
                                }
                            >
                                <option value="all">Semua guru</option>
                                {supervisorOptions.map((g) => (
                                    <option key={g.id} value={g.id}>
                                        {g.name}
                                    </option>
                                ))}
                            </Select>
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    type="date"
                                    value={data.date_from}
                                    onChange={(e) =>
                                        setData("date_from", e.target.value)
                                    }
                                />
                                <Input
                                    type="date"
                                    value={data.date_to}
                                    onChange={(e) =>
                                        setData("date_to", e.target.value)
                                    }
                                />
                            </div>
                        </div>
                    ) : null}
                </div>

                {total > 0 ? (
                    isArchive ? (
                        <LoanTable items={list} pagination={loans} />
                    ) : (
                        <LoanWorkList
                            items={list}
                            pagination={loans}
                            onReject={setRejectTarget}
                            onReturn={setReturnTarget}
                            onInspect={setInspectTarget}
                        />
                    )
                ) : (
                    <EmptyState
                        icon={ClipboardList}
                        title={empty.title}
                        description={empty.description}
                    />
                )}
            </div>

            <RejectLoanDialog
                open={Boolean(rejectTarget)}
                onOpenChange={(open) => {
                    if (!open) setRejectTarget(null);
                }}
                itemName={rejectTarget?.code}
                onConfirm={handleReject}
                loading={rejecting}
            />
            <ReturnLoanDialog
                open={Boolean(returnTarget)}
                onOpenChange={(open) => {
                    if (!open) setReturnTarget(null);
                }}
                itemName={returnTarget?.code}
                requiresInspection={returnTarget?.requires_return_inspection}
                onConfirm={handleReturn}
                loading={returning}
            />
            <InspectReturnDialog
                open={Boolean(inspectTarget)}
                onOpenChange={(open) => {
                    if (!open) setInspectTarget(null);
                }}
                loanCode={inspectTarget?.code}
                onConfirm={handleInspect}
                loading={inspecting}
            />
        </AppLayout>
    );
}
