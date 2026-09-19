import AppLayout from "@/Layouts/AppLayout";
import LoanStatusBadge from "@/Components/LoanStatusBadge";
import CollateralStatusBadge from "@/Components/CollateralStatusBadge";
import { Button } from "@/Components/ui/button";
import { Head, Link, router } from "@inertiajs/react";
import {
    ArrowLeft,
    Check,
    CheckCircle,
    CreditCard,
    PackageCheck,
    RotateCcw,
    Trash2,
    X,
} from "lucide-react";
import { useState } from "react";
import DeleteLoanDialog from "./Components/DeleteLoanDialog";
import RejectLoanDialog from "./Components/RejectLoanDialog";
import ReturnLoanDialog from "./Components/ReturnLoanDialog";
import InspectReturnDialog from "../Collateral/Components/InspectReturnDialog";
import ReceiveCardDialog from "../Collateral/Components/ReceiveCardDialog";

function hasDisplayValue(value) {
    if (value == null) return false;
    const text = String(value).trim();
    return text !== "" && text !== "—";
}

function MetaRow({ label, value, children }) {
    if (!children && !hasDisplayValue(value)) return null;

    return (
        <div className="grid grid-cols-[110px_1fr] gap-3 text-sm sm:grid-cols-[120px_1fr]">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium text-foreground">
                {children ?? value}
            </dd>
        </div>
    );
}

function SectionCard({ title, children, className = "" }) {
    return (
        <div
            className={`rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm ${className}`}
        >
            {title ? (
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {title}
                </p>
            ) : null}
            <div className={title ? "mt-4" : undefined}>{children}</div>
        </div>
    );
}

export default function Show({ loan }) {
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [returnOpen, setReturnOpen] = useState(false);
    const [inspectOpen, setInspectOpen] = useState(false);
    const [inspecting, setInspecting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [returning, setReturning] = useState(false);
    const [receiveOpen, setReceiveOpen] = useState(false);
    const [receiving, setReceiving] = useState(false);
    const [returningCard, setReturningCard] = useState(false);

    const post = (routeName, data = {}) => {
        router.post(route(routeName, loan.id), data, { preserveScroll: true });
    };

    const handleDelete = () => {
        setDeleting(true);
        router.delete(route("admin.loans.destroy", loan.id));
    };

    const handleReject = (reason) => {
        setRejecting(true);
        router.post(
            route("admin.loans.reject", loan.id),
            { rejection_reason: reason },
            {
                onFinish: () => {
                    setRejecting(false);
                    setRejectOpen(false);
                },
            },
        );
    };

    const handleReturn = (note) => {
        setReturning(true);
        router.post(
            route("admin.loans.return", loan.id),
            { note: note ?? "" },
            {
                onFinish: () => {
                    setReturning(false);
                    setReturnOpen(false);
                },
            },
        );
    };

    const handleInspect = (payload) => {
        setInspecting(true);
        router.post(route("admin.loans.inspect", loan.id), payload, {
            onFinish: () => {
                setInspecting(false);
                setInspectOpen(false);
            },
        });
    };

    const handleReceiveCard = (payload) => {
        if (!loan.collateral_id) return;
        setReceiving(true);
        router.post(route("admin.collaterals.hold", loan.collateral_id), payload, {
            preserveScroll: true,
            onFinish: () => {
                setReceiving(false);
                setReceiveOpen(false);
            },
        });
    };

    const handleReturnCard = () => {
        if (!loan.collateral_id) return;
        setReturningCard(true);
        router.post(
            route("admin.collaterals.return-card", loan.collateral_id),
            {},
            {
                preserveScroll: true,
                onFinish: () => setReturningCard(false),
            },
        );
    };

    const timeline = loan.timeline ?? [];
    const items = loan.items ?? [];
    const isBahan = loan.item_type === "bahan";
    const unitLabel = isBahan ? "pcs" : "Unit";
    const pageTitle = isBahan ? "Detail Bahan" : "Detail Alat";
    const backHref = loan.submission_code
        ? route("admin.loans.submission", loan.submission_code)
        : route("admin.loans.index");

    const totalQty = items.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0,
    );

    const hasStickyActions =
        loan.can_approve ||
        loan.can_reject ||
        loan.can_mark_borrowed ||
        loan.mark_borrowed_blocked_reason ||
        loan.can_inspect ||
        loan.can_return ||
        loan.can_return_card ||
        loan.can_receive_card;

    return (
        <AppLayout>
            <Head title={loan.code} />

            <div className="animate-fade-in mx-auto w-full max-w-5xl">
            <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 border-[#E5E7EB] bg-white shadow-none hover:bg-muted/50"
                        asChild
                    >
                        <Link href={backHref}>
                            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                            Kembali
                        </Link>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 border-red-300 bg-white text-red-600 shadow-none hover:bg-red-50 hover:text-red-700"
                        onClick={() => setDeleteOpen(true)}
                    >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        Hapus
                    </Button>
                </div>

                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="font-mono text-sm font-semibold text-primary">
                            {loan.submission_code || loan.code}
                        </p>
                        <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                            {pageTitle}
                        </h1>
                    </div>
                    <LoanStatusBadge
                        status={loan.status}
                        itemType={loan.item_type}
                    />
                </div>

                <SectionCard>
                    <ul className="space-y-4">
                        {items.length === 0 ? (
                            <li className="text-sm text-muted-foreground">
                                Tidak ada item
                            </li>
                        ) : (
                            items.map((item) => (
                                <li
                                    key={item.id}
                                    className="flex items-start justify-between gap-4"
                                >
                                    <div className="min-w-0">
                                        <p className="text-base font-semibold text-foreground">
                                            {item.equipment_name}
                                        </p>
                                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                                            {item.equipment_code}
                                        </p>
                                    </div>
                                    <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                                        ×{item.quantity} {unitLabel}
                                    </p>
                                </li>
                            ))
                        )}
                    </ul>
                    {items.length > 1 ? (
                        <p className="mt-4 border-t border-[#E5E7EB] pt-3 text-xs text-muted-foreground">
                            Total {totalQty} {unitLabel} · {items.length} item
                        </p>
                    ) : null}
                    {(loan.loan_type_label || loan.queue_type_label) && (
                        <div className="mt-4 space-y-2 border-t border-[#E5E7EB] pt-4">
                            <MetaRow
                                label="Kategori"
                                value={
                                    loan.loan_type_label ||
                                    loan.queue_type_label
                                }
                            />
                        </div>
                    )}
                    {loan.status === "antrian" && loan.queue_position ? (
                        <p className="mt-3 text-xs text-amber-800">
                            Antrean #{loan.queue_position}
                            {loan.queue_status_label
                                ? ` · ${loan.queue_status_label}`
                                : ""}
                        </p>
                    ) : null}
                </SectionCard>

                <SectionCard title="Peminjam">
                    <p className="text-lg font-semibold text-foreground">
                        {loan.borrower_name}
                    </p>
                    {loan.borrower_class ? (
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {loan.borrower_class}
                        </p>
                    ) : null}
                    <dl className="mt-4 space-y-2.5">
                        <MetaRow label="Guru" value={loan.supervisor_name} />
                    </dl>
                    {loan.rejection_reason ? (
                        <p className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                            {loan.rejection_reason}
                        </p>
                    ) : null}
                </SectionCard>

                <SectionCard title="Informasi">
                    <dl className="space-y-2.5">
                        <MetaRow
                            label="Tanggal"
                            value={loan.request_date_formatted}
                        />
                        <MetaRow
                            label="Jenis"
                            value={
                                loan.loan_type_label || loan.queue_type_label
                            }
                        />
                        <MetaRow label="Jadwal" value={loan.schedule_title} />
                        <MetaRow
                            label={loan.slot_field_label || "Jam"}
                            value={loan.slot_label}
                        />
                        {!isBahan ? (
                            <MetaRow
                                label="Deadline"
                                value={loan.due_at_formatted}
                            />
                        ) : null}
                        <MetaRow
                            label={isBahan ? "Diambil" : "Dipinjam"}
                            value={loan.borrowed_at_formatted}
                        />
                        {!isBahan ? (
                            <MetaRow
                                label="Dikembalikan"
                                value={loan.returned_at_formatted}
                            />
                        ) : null}
                        {isBahan && loan.status === "dikembalikan" ? (
                            <MetaRow
                                label="Selesai"
                                value={loan.returned_at_formatted}
                            />
                        ) : null}
                        <MetaRow label="Keperluan" value={loan.purpose} />
                        <MetaRow label="Catatan" value={loan.notes} />
                        {loan.slot_hint ? (
                            <p className="text-xs text-muted-foreground">
                                {loan.slot_hint}
                            </p>
                        ) : null}
                    </dl>
                </SectionCard>

                {loan.requires_collateral ? (
                    <SectionCard title="Jaminan Kartu">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                {loan.collateral_id ? (
                                    <Link
                                        href={route(
                                            "admin.collaterals.show",
                                            loan.collateral_id,
                                        )}
                                        className="font-mono text-sm font-semibold text-primary hover:underline"
                                    >
                                        {loan.collateral_code}
                                    </Link>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Kartu pelajar sebagai jaminan bawa
                                        pulang
                                    </p>
                                )}
                            </div>
                            {loan.collateral_status ? (
                                <CollateralStatusBadge
                                    status={loan.collateral_status}
                                />
                            ) : (
                                <span className="text-sm text-muted-foreground">
                                    Belum diterima
                                </span>
                            )}
                        </div>
                        {loan.collateral_status === "ditahan" ? (
                            <div className="mt-4 space-y-1 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                                <p className="text-sm font-medium text-emerald-800">
                                    Kartu diterima
                                </p>
                                {loan.collateral_held_at_formatted ? (
                                    <p className="text-xs text-muted-foreground">
                                        {loan.collateral_held_at_formatted}
                                    </p>
                                ) : null}
                                {loan.collateral_held_by_name ? (
                                    <p className="text-xs text-muted-foreground">
                                        Penerima {loan.collateral_held_by_name}
                                    </p>
                                ) : null}
                            </div>
                        ) : null}
                        {loan.mark_borrowed_blocked_reason ? (
                            <p className="mt-3 text-xs text-amber-800">
                                {loan.mark_borrowed_blocked_reason}.
                            </p>
                        ) : null}
                        {loan.can_receive_card ? (
                            <Button
                                type="button"
                                size="sm"
                                className="mt-4 h-8"
                                onClick={() => setReceiveOpen(true)}
                            >
                                <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                                Terima Kartu Pelajar
                            </Button>
                        ) : null}
                    </SectionCard>
                ) : null}

                {loan.can_set_queue_priority ? (
                    <SectionCard title="Prioritas Antrian">
                        <form
                            className="flex flex-wrap items-end gap-3"
                            onSubmit={(e) => {
                                e.preventDefault();
                                const form = e.currentTarget;
                                router.post(
                                    route(
                                        "admin.loans.queue-priority",
                                        loan.id,
                                    ),
                                    {
                                        queue_priority: Number(
                                            form.queue_priority.value,
                                        ),
                                        queue_priority_note:
                                            form.queue_priority_note.value ||
                                            null,
                                    },
                                    { preserveScroll: true },
                                );
                            }}
                        >
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">
                                    Prioritas
                                </label>
                                <input
                                    name="queue_priority"
                                    type="number"
                                    min={0}
                                    max={1000}
                                    defaultValue={loan.queue_priority ?? 0}
                                    className="h-8 w-24 rounded-lg border border-[#E5E7EB] bg-white px-2 text-sm shadow-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">
                                    Catatan
                                </label>
                                <input
                                    name="queue_priority_note"
                                    type="text"
                                    defaultValue={
                                        loan.queue_priority_note ?? ""
                                    }
                                    className="h-8 w-44 rounded-lg border border-[#E5E7EB] bg-white px-2 text-sm shadow-sm"
                                />
                            </div>
                            <Button
                                type="submit"
                                variant="outline"
                                size="sm"
                                className="h-8 border-[#E5E7EB] bg-white shadow-none"
                            >
                                Simpan
                            </Button>
                        </form>
                    </SectionCard>
                ) : null}

                {timeline.length > 0 ? (
                    <SectionCard title="Riwayat">
                        <ol className="relative space-y-4 border-l border-[#E5E7EB] pl-5">
                            {timeline.map((entry, i) => (
                                <li key={i} className="relative">
                                    <span className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                                    <div className="flex flex-wrap items-center gap-2">
                                        <LoanStatusBadge
                                            status={entry.status}
                                            itemType={loan.item_type}
                                        />
                                        <span className="text-xs text-muted-foreground">
                                            {entry.created_at_formatted}
                                        </span>
                                    </div>
                                    {entry.note ? (
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {entry.note}
                                        </p>
                                    ) : null}
                                    {entry.user_name ? (
                                        <p className="text-xs text-muted-foreground">
                                            oleh {entry.user_name}
                                        </p>
                                    ) : null}
                                </li>
                            ))}
                        </ol>
                    </SectionCard>
                ) : null}
            </div>

            {hasStickyActions ? (
                <div className="sticky bottom-0 z-20 mt-6 border-t border-[#E5E7EB] bg-white/95 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/80 sm:rounded-t-xl sm:border sm:border-[#E5E7EB] sm:px-4 sm:shadow-sm">
                    <div className="flex flex-wrap items-center justify-end gap-2.5">
                        {loan.can_reject ? (
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-9 border-red-300 bg-white px-4 text-red-600 shadow-none hover:bg-red-50 hover:text-red-700"
                                onClick={() => setRejectOpen(true)}
                            >
                                <X className="mr-1.5 h-3.5 w-3.5" />
                                Tolak
                            </Button>
                        ) : null}
                        {loan.can_approve ? (
                            <Button
                                size="sm"
                                className="h-9 bg-emerald-600 px-4 text-white hover:bg-emerald-700"
                                onClick={() => post("admin.loans.approve")}
                            >
                                <Check className="mr-1.5 h-3.5 w-3.5" />
                                Setujui
                            </Button>
                        ) : null}
                        {(loan.can_mark_borrowed ||
                            loan.mark_borrowed_blocked_reason) &&
                        !loan.can_approve ? (
                            <Button
                                size="sm"
                                className="h-9 px-4"
                                disabled={!loan.can_mark_borrowed}
                                title={
                                    loan.mark_borrowed_blocked_reason ||
                                    undefined
                                }
                                onClick={() =>
                                    post("admin.loans.mark-borrowed")
                                }
                            >
                                <PackageCheck className="mr-1.5 h-3.5 w-3.5" />
                                {isBahan ? "Tandai Diambil" : "Serahkan"}
                            </Button>
                        ) : null}
                        {loan.can_return ? (
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-9 border-[#E5E7EB] bg-white px-4 shadow-none"
                                onClick={() => setReturnOpen(true)}
                            >
                                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                                Ajukan Inspeksi
                            </Button>
                        ) : null}
                        {loan.can_inspect ? (
                            <Button
                                size="sm"
                                className="h-9 px-4"
                                onClick={() => setInspectOpen(true)}
                            >
                                Inspeksi Pengembalian
                            </Button>
                        ) : null}
                        {loan.can_return_card ? (
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-9 border-[#E5E7EB] bg-white px-4 shadow-none"
                                disabled={returningCard}
                                onClick={handleReturnCard}
                            >
                                <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                                Kembalikan Kartu
                            </Button>
                        ) : null}
                        {loan.can_receive_card && !loan.can_approve ? (
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-9 border-[#E5E7EB] bg-white px-4 shadow-none"
                                onClick={() => setReceiveOpen(true)}
                            >
                                <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                                Terima Kartu
                            </Button>
                        ) : null}
                    </div>
                </div>
            ) : null}
            </div>

            <DeleteLoanDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                itemName={loan.code}
                onConfirm={handleDelete}
                loading={deleting}
            />
            <RejectLoanDialog
                open={rejectOpen}
                onOpenChange={setRejectOpen}
                itemName={loan.code}
                onConfirm={handleReject}
                loading={rejecting}
            />
            <ReturnLoanDialog
                open={returnOpen}
                onOpenChange={setReturnOpen}
                itemName={loan.code}
                requiresInspection={loan.requires_return_inspection}
                onConfirm={handleReturn}
                loading={returning}
            />
            <InspectReturnDialog
                open={inspectOpen}
                onOpenChange={setInspectOpen}
                loanCode={loan.code}
                onConfirm={handleInspect}
                loading={inspecting}
            />
            <ReceiveCardDialog
                open={receiveOpen}
                onOpenChange={setReceiveOpen}
                studentName={loan.borrower_name}
                defaultCardNumber={loan.collateral_card_number ?? ""}
                onConfirm={handleReceiveCard}
                loading={receiving}
            />
        </AppLayout>
    );
}
