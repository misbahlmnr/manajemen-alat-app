import AppLayout from "@/Layouts/AppLayout";
import LoanStatusBadge from "@/Components/LoanStatusBadge";
import { Button } from "@/Components/ui/button";
import { Head, Link, router } from "@inertiajs/react";
import {
    ArrowLeft,
    Check,
    ChevronRight,
    Package,
    Wrench,
    X,
} from "lucide-react";
import { useState } from "react";
import RejectLoanDialog from "./Components/RejectLoanDialog";

const LOAN_TYPE_SUBTITLE = {
    praktikum: "Praktik Lab",
    pribadi: "Pribadi",
    bawa_pulang: "Bawa Pulang",
    lomba: "Lomba",
};

function MetaRow({ label, value }) {
    if (!value || value === "—") return null;

    return (
        <div className="grid grid-cols-[100px_1fr] gap-3 text-sm sm:grid-cols-[120px_1fr]">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium text-foreground">{value}</dd>
        </div>
    );
}

function ItemPreview({ loan }) {
    const items = loan?.items ?? [];
    if (items.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                {loan?.items_summary && loan.items_summary !== "—"
                    ? loan.items_summary
                    : "Tidak ada item"}
            </p>
        );
    }

    const visible = items.slice(0, 2);
    const rest = items.length - visible.length;

    return (
        <ul className="space-y-1">
            {visible.map((item) => (
                <li
                    key={item.id ?? item.equipment_id}
                    className="text-sm font-semibold text-foreground"
                >
                    {item.equipment_name ?? "Item"}
                    {item.quantity > 1 ? (
                        <span className="font-medium text-muted-foreground">
                            {" "}
                            ×{item.quantity}
                        </span>
                    ) : null}
                </li>
            ))}
            {rest > 0 ? (
                <li className="text-xs text-muted-foreground">
                    +{rest} lainnya
                </li>
            ) : null}
        </ul>
    );
}

function RequestCard({ title, icon: Icon, loan, detailLabel }) {
    if (!loan) return null;

    const items = loan.items ?? [];
    const itemCount = items.length;
    const unitTotal = items.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0,
    );
    const unitLabel = loan.item_type === "bahan" ? "pcs" : "Unit";

    return (
        <div className="flex h-full flex-col rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {title}
                </h3>
            </div>

            <div className="mt-4 space-y-1">
                <p className="text-xs text-muted-foreground">Status</p>
                <LoanStatusBadge
                    status={loan.status}
                    itemType={loan.item_type}
                />
            </div>

            <div className="mt-4 space-y-0.5 text-sm font-semibold tabular-nums text-foreground">
                <p>
                    {itemCount} Item
                </p>
                <p>
                    {unitTotal} {unitLabel}
                </p>
            </div>

            <div className="mt-4">
                <ItemPreview loan={loan} />
            </div>

            {loan.status === "antrian" && loan.queue_position ? (
                <p className="mt-3 text-xs text-amber-800">
                    Antrean #{loan.queue_position}
                    {loan.queue_status_label
                        ? ` · ${loan.queue_status_label}`
                        : ""}
                </p>
            ) : null}

            <div className="mt-auto pt-5">
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 border-[#E5E7EB] bg-white shadow-none hover:bg-muted/50"
                    asChild
                >
                    <Link href={route("admin.loans.show", loan.id)}>
                        {detailLabel}
                        <ChevronRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                </Button>
            </div>
        </div>
    );
}

export default function Submission({ submission }) {
    const alat = submission.alat;
    const bahan = submission.bahan;
    const primary = alat ?? bahan;
    const members = (submission.package_members ?? submission.loans ?? []).filter(
        Boolean,
    );
    const approveLoan = members.find((m) => m.can_approve);
    const rejectLoan = members.find((m) => m.can_reject);

    const typeKey = primary?.loan_type || primary?.queue_type_key;
    const typeLabel =
        LOAN_TYPE_SUBTITLE[typeKey] ||
        primary?.loan_type_label ||
        "Pengajuan";

    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectLoading, setRejectLoading] = useState(false);

    const scheduleTitle =
        alat?.schedule_title || bahan?.schedule_title || null;
    const scheduleTime = alat?.slot_label || bahan?.slot_label || null;
    const purpose =
        primary?.loan_type_label ||
        submission.purpose ||
        typeLabel;
    const notes =
        submission.notes?.trim() ||
        primary?.notes?.trim() ||
        null;

    return (
        <AppLayout>
            <Head title={submission.code} />

            <div className="animate-fade-in mx-auto w-full max-w-5xl space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 border-[#E5E7EB] bg-white shadow-none hover:bg-muted/50"
                        asChild
                    >
                        <Link href={route("admin.loans.index")}>
                            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                            Kembali
                        </Link>
                    </Button>

                    <div className="flex flex-wrap items-center gap-2.5">
                        {approveLoan ? (
                            <Button
                                size="sm"
                                className="h-8 bg-emerald-600 text-white hover:bg-emerald-700"
                                onClick={() =>
                                    router.post(
                                        route(
                                            "admin.loans.approve",
                                            approveLoan.id,
                                        ),
                                        {},
                                        { preserveScroll: true },
                                    )
                                }
                            >
                                <Check className="mr-1.5 h-3.5 w-3.5" />
                                Setujui
                            </Button>
                        ) : null}
                        {rejectLoan ? (
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 border-red-300 bg-white text-red-600 shadow-none hover:bg-red-50 hover:text-red-700"
                                onClick={() => setRejectOpen(true)}
                            >
                                <X className="mr-1.5 h-3.5 w-3.5" />
                                Tolak
                            </Button>
                        ) : null}
                    </div>
                </div>

                <div>
                    <p className="font-mono text-sm font-semibold text-primary">
                        {submission.code}
                    </p>
                    <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                        Detail Pengajuan {typeLabel}
                    </h1>
                </div>

                <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
                    <div className="grid gap-6 sm:grid-cols-[1fr_auto]">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Peminjam
                            </p>
                            <p className="mt-1.5 text-lg font-semibold text-foreground">
                                {submission.borrower_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {submission.borrower_class || "—"}
                            </p>
                        </div>
                        <div className="space-y-3 sm:min-w-[180px] sm:text-right">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    Status
                                </p>
                                <div className="mt-1.5 flex sm:justify-end">
                                    <LoanStatusBadge
                                        status={submission.status}
                                        itemType="submission"
                                    />
                                </div>
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    Guru
                                </p>
                                <p className="mt-1 text-sm font-medium text-foreground">
                                    {submission.supervisor_name || "—"}
                                </p>
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    Booking
                                </p>
                                <p className="mt-1 text-sm font-medium text-foreground">
                                    {submission.request_date_formatted || "—"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Informasi Pengajuan
                    </p>
                    <dl className="mt-4 space-y-2.5">
                        <MetaRow label="Jadwal" value={scheduleTitle} />
                        <MetaRow label="Jam" value={scheduleTime} />
                        <MetaRow label="Keperluan" value={purpose} />
                        <MetaRow label="Catatan" value={notes} />
                    </dl>
                </div>

                {(alat || bahan) && (
                    <div
                        className={
                            alat && bahan
                                ? "grid gap-5 md:grid-cols-2"
                                : "grid gap-5 md:grid-cols-1 md:max-w-md"
                        }
                    >
                        <RequestCard
                            title="Alat"
                            icon={Wrench}
                            loan={alat}
                            detailLabel="Detail Alat"
                        />
                        <RequestCard
                            title="Bahan"
                            icon={Package}
                            loan={bahan}
                            detailLabel="Detail Bahan"
                        />
                    </div>
                )}
            </div>

            <RejectLoanDialog
                open={rejectOpen}
                onOpenChange={setRejectOpen}
                itemName={submission.code}
                loading={rejectLoading}
                onConfirm={(reason) => {
                    if (!rejectLoan) return;
                    setRejectLoading(true);
                    router.post(
                        route("admin.loans.reject", rejectLoan.id),
                        { rejection_reason: reason },
                        {
                            preserveScroll: true,
                            onFinish: () => {
                                setRejectLoading(false);
                                setRejectOpen(false);
                            },
                        },
                    );
                }}
            />
        </AppLayout>
    );
}
