import AppLayout from "@/Layouts/AppLayout";
import DataPagination from "@/Components/DataPagination";
import { StatusBadge } from "@/Components/ui/StatusBadge";
import { cn } from "@/lib/utils";
import { Head, Link, router, usePage } from "@inertiajs/react";
import {
    AlertTriangle,
    Check,
    CheckCircle2,
    Clock,
    Eye,
    FileText,
    Package,
    Plus,
    Send,
    Wrench,
    X,
} from "lucide-react";
import { useEffect, useState } from "react";
import LoanDetailModal from "./Components/LoanDetailModal";
import LoanTypeTabPills from "./Components/LoanTypeTabPills";

function getRemaining(loan) {
    if (!loan.due_at_iso || loan.item_type !== "alat") return null;
    const due = new Date(loan.due_at_iso);
    const diffH = (due.getTime() - Date.now()) / 36e5;
    if (Math.abs(diffH) < 24) {
        return { value: Math.floor(diffH), unit: "jam" };
    }
    return { value: Math.floor(diffH / 24), unit: "hari" };
}

export default function Index({ loans, filters, tabCounts }) {
    const { auth, flash } = usePage().props;
    const [tab, setTab] = useState(
        filters.item_type === "alat" || filters.item_type === "bahan"
            ? filters.item_type
            : "all",
    );
    const [detail, setDetail] = useState(null);
    const [returnFor, setReturnFor] = useState(null);
    const [returnNotes, setReturnNotes] = useState("");
    const [returning, setReturning] = useState(false);
    const [success, setSuccess] = useState(flash?.success ?? "");

    const isHistory = filters.scope === "history";

    useEffect(() => {
        if (flash?.success) {
            setSuccess(flash.success);
            const t = setTimeout(() => setSuccess(""), 4000);
            return () => clearTimeout(t);
        }
    }, [flash?.success]);

    useEffect(() => {
        const itemType = tab === "all" ? "all" : tab;
        if (itemType === filters.item_type) return;
        router.get(
            route("siswa.loans.index"),
            { ...filters, item_type: itemType },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }, [tab]);

    const list = loans.data ?? [];

    const submitReturn = () => {
        if (!returnFor) return;
        setReturning(true);
        router.post(
            route("siswa.loans.request-return", returnFor.id),
            { note: returnNotes },
            {
                preserveScroll: true,
                onFinish: () => {
                    setReturning(false);
                    setReturnFor(null);
                    setReturnNotes("");
                    setSuccess(
                        "Permintaan pengembalian terkirim! Tunggu konfirmasi admin.",
                    );
                    setTimeout(() => setSuccess(""), 4000);
                },
            },
        );
    };

    return (
        <AppLayout>
            <Head
                title={isHistory ? "Riwayat Peminjaman" : "Peminjaman Saya"}
            />

            <div className="animate-fade-in">
                {success && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50">
                        <div className="max-w-sm animate-scale-in rounded-2xl bg-card p-8 text-center">
                            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                                <Check className="h-8 w-8 text-success" />
                            </div>
                            <h3 className="mb-2 font-bold">Berhasil</h3>
                            <p className="text-sm text-muted-foreground">
                                {success}
                            </p>
                        </div>
                    </div>
                )}

                {returnFor && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
                        <div className="w-full max-w-md animate-scale-in rounded-2xl bg-card p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-bold">
                                    Ajukan Pengembalian
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setReturnFor(null)}
                                >
                                    <X className="h-5 w-5 text-muted-foreground" />
                                </button>
                            </div>
                            <div className="mb-4 rounded-lg bg-secondary/50 p-3">
                                <p className="text-sm font-medium">
                                    {returnFor.display_title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Jumlah: {returnFor.total_quantity} unit
                                </p>
                                {returnFor.due_at_formatted !== "—" && (
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Jatuh tempo:{" "}
                                        {returnFor.due_at_formatted}
                                    </p>
                                )}
                            </div>
                            <label className="mb-2 block text-sm font-medium">
                                Catatan kondisi (opsional)
                            </label>
                            <textarea
                                value={returnNotes}
                                onChange={(e) => setReturnNotes(e.target.value)}
                                placeholder="Kondisi peralatan saat dikembalikan..."
                                className="form-input mb-4 min-h-[80px] resize-none"
                            />
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setReturnFor(null)}
                                    className="btn-outline flex-1"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={submitReturn}
                                    disabled={returning}
                                    className="btn-primary flex-1 disabled:opacity-50"
                                >
                                    <Send className="mr-2 h-4 w-4" />
                                    {returning ? "Mengirim..." : "Ajukan"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <LoanDetailModal
                    loan={detail}
                    borrower={auth?.user}
                    onClose={() => setDetail(null)}
                    footer={
                        detail?.can_request_return ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setReturnFor(detail);
                                    setDetail(null);
                                }}
                                className="btn-primary w-full"
                            >
                                <Send className="mr-2 h-4 w-4" />
                                Ajukan Pengembalian
                            </button>
                        ) : undefined
                    }
                />

                <div className="page-header">
                    <div>
                        <h1 className="section-title">
                            {isHistory
                                ? "Riwayat Peminjaman"
                                : "Peminjaman Saya"}
                        </h1>
                        <p className="mt-1 text-muted-foreground">
                            {isHistory
                                ? "Arsip pengajuan yang selesai"
                                : "Riwayat & status peminjaman Anda"}
                        </p>
                    </div>
                    {!isHistory && (
                        <Link
                            href={route("siswa.loans.create")}
                            className="btn-primary"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Ajukan Peminjaman
                        </Link>
                    )}
                </div>

                {!isHistory && (
                    <LoanTypeTabPills
                        value={tab}
                        onChange={setTab}
                        counts={tabCounts}
                    />
                )}

                {list.length > 0 ? (
                    <>
                        <div className="space-y-3">
                            {list.map((loan) => {
                                const remaining = getRemaining(loan);
                                const isOverdue =
                                    remaining !== null && remaining.value < 0;
                                const isUrgent =
                                    remaining !== null &&
                                    remaining.value >= 0 &&
                                    remaining.value <= 2;

                                return (
                                    <div
                                        key={loan.id}
                                        className={cn(
                                            "rounded-xl border bg-card p-4",
                                            loan.status === "terlambat"
                                                ? "border-destructive/30 bg-destructive/5"
                                                : "border-border",
                                        )}
                                    >
                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                                            <div className="flex min-w-0 flex-1 items-start gap-3">
                                                <div
                                                    className={cn(
                                                        "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg",
                                                        loan.item_type ===
                                                            "bahan"
                                                            ? "bg-warning/10"
                                                            : "bg-primary/10",
                                                    )}
                                                >
                                                    {loan.item_type ===
                                                    "bahan" ? (
                                                        <Package className="h-5 w-5 text-warning" />
                                                    ) : (
                                                        <Wrench className="h-5 w-5 text-primary" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="mb-1 flex flex-wrap items-center gap-2">
                                                        <h3 className="truncate font-semibold text-foreground">
                                                            {loan.display_title}
                                                        </h3>
                                                        <span
                                                            className={cn(
                                                                "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                                                                loan.item_type ===
                                                                    "bahan"
                                                                    ? "bg-warning/15 text-warning"
                                                                    : "bg-primary/15 text-primary",
                                                            )}
                                                        >
                                                            {loan.item_type}
                                                        </span>
                                                        <StatusBadge
                                                            status={loan.status}
                                                        />
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        Jumlah:{" "}
                                                        {loan.total_quantity} •{" "}
                                                        {loan.supervisor_name ??
                                                            "—"}
                                                    </p>
                                                    {loan.due_at_formatted !==
                                                        "—" && (
                                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                                            <Clock className="mr-1 inline h-3 w-3" />
                                                            Jatuh tempo:{" "}
                                                            {
                                                                loan.due_at_formatted
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {remaining !== null &&
                                                ![
                                                    "dikembalikan",
                                                    "ditolak",
                                                    "dibatalkan",
                                                ].includes(loan.status) && (
                                                    <div
                                                        className={cn(
                                                            "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium",
                                                            isOverdue
                                                                ? "bg-destructive/10 text-destructive"
                                                                : isUrgent
                                                                  ? "bg-warning/10 text-warning"
                                                                  : "bg-success/10 text-success",
                                                        )}
                                                    >
                                                        {isOverdue ? (
                                                            <AlertTriangle className="h-3.5 w-3.5" />
                                                        ) : (
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                        )}
                                                        {isOverdue
                                                            ? `Terlambat ${Math.abs(remaining.value)} ${remaining.unit}`
                                                            : `${remaining.value} ${remaining.unit} lagi`}
                                                    </div>
                                                )}

                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setDetail(loan)
                                                    }
                                                    className="inline-flex items-center rounded-lg bg-secondary px-3 py-1.5 text-sm text-foreground hover:bg-secondary/80"
                                                >
                                                    <Eye className="mr-1 h-4 w-4" />
                                                    Detail
                                                </button>
                                                {loan.can_request_return && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setReturnFor(loan)
                                                        }
                                                        className="btn-primary px-3 py-1.5 text-sm"
                                                    >
                                                        <Send className="mr-1 h-4 w-4" />
                                                        Kembalikan
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-8">
                            <DataPagination
                                links={loans.links}
                                meta={loans.meta}
                            />
                        </div>
                    </>
                ) : (
                    <div className="rounded-xl border border-border bg-card py-12 text-center">
                        <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                        <p className="mb-1 font-medium">
                            {isHistory
                                ? "Belum ada riwayat"
                                : "Belum ada peminjaman"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {isHistory
                                ? "Riwayat pengajuan yang selesai akan muncul di sini."
                                : "Ajukan peminjaman dari menu Ajukan Peminjaman"}
                        </p>
                        {!isHistory && (
                            <Link
                                href={route("siswa.loans.create")}
                                className="btn-primary mt-4 inline-flex"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Ajukan Peminjaman
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
