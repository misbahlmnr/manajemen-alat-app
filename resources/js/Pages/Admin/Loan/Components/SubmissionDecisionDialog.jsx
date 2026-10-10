import { Button } from "@/Components/ui/button";
import { Label } from "@/Components/ui/label";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

function itemLines(submission) {
    const members = submission?.package_members ?? submission?.loans ?? [];
    const lines = [];
    for (const loan of members) {
        for (const item of loan.items ?? []) {
            lines.push(
                `${item.equipment_name ?? "Item"}${
                    item.quantity > 1 ? ` ×${item.quantity}` : ""
                }`,
            );
        }
        if (
            (loan.items ?? []).length === 0 &&
            loan.items_summary &&
            loan.items_summary !== "—"
        ) {
            lines.push(loan.items_summary);
        }
    }
    return lines;
}

export default function SubmissionDecisionDialog({
    open,
    onOpenChange,
    submission,
    mode = "review",
    loading = false,
    onApprove,
    onReject,
}) {
    const [reason, setReason] = useState("");
    const [step, setStep] = useState(mode === "reject" ? "reject" : "review");

    useEffect(() => {
        if (open) {
            setStep(mode === "reject" ? "reject" : "review");
            setReason("");
        }
    }, [open, mode]);

    if (!open || !submission) return null;

    const lines = itemLines(submission);

    const handleClose = () => {
        if (loading) return;
        setReason("");
        setStep(mode === "reject" ? "reject" : "review");
        onOpenChange(false);
    };

    const handleApprove = () => {
        onApprove?.();
    };

    const handleRejectConfirm = () => {
        if (!reason.trim()) return;
        onReject?.(reason.trim());
        setReason("");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
                type="button"
                className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
                aria-label="Tutup"
                onClick={handleClose}
            />
            <div
                role="alertdialog"
                className={cn(
                    "relative z-10 w-full max-w-md rounded-[12px] border border-[#E5E7EB] bg-card p-6 shadow-[var(--shadow-md)] animate-fade-in",
                )}
            >
                {step === "review" ? (
                    <>
                        <h2 className="text-lg font-semibold text-foreground">
                            Konfirmasi pengajuan
                        </h2>
                        <p className="mt-1 font-mono text-sm font-semibold text-primary">
                            {submission.code}
                        </p>
                        <div className="mt-4 space-y-2 text-sm">
                            <p>
                                <span className="text-muted-foreground">
                                    Peminjam
                                </span>
                                <br />
                                <span className="font-medium text-foreground">
                                    {submission.borrower_name}
                                    {submission.borrower_class
                                        ? ` · ${submission.borrower_class}`
                                        : ""}
                                </span>
                            </p>
                            {submission.supervisor_name ? (
                                <p>
                                    <span className="text-muted-foreground">
                                        Guru
                                    </span>
                                    <br />
                                    <span className="font-medium text-foreground">
                                        {submission.supervisor_name}
                                    </span>
                                </p>
                            ) : null}
                            {lines.length > 0 ? (
                                <div>
                                    <span className="text-muted-foreground">
                                        Item
                                    </span>
                                    <ul className="mt-1 list-inside list-disc font-medium text-foreground">
                                        {lines.slice(0, 6).map((line) => (
                                            <li key={line}>{line}</li>
                                        ))}
                                        {lines.length > 6 ? (
                                            <li className="text-muted-foreground">
                                                +{lines.length - 6} lainnya
                                            </li>
                                        ) : null}
                                    </ul>
                                </div>
                            ) : null}
                            {submission.notes?.trim() ? (
                                <p>
                                    <span className="text-muted-foreground">
                                        Catatan
                                    </span>
                                    <br />
                                    <span className="font-medium text-foreground">
                                        {submission.notes}
                                    </span>
                                </p>
                            ) : null}
                        </div>
                        <div className="mt-6 flex flex-wrap justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={loading}
                                onClick={handleClose}
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                                disabled={loading || !submission.can_reject}
                                onClick={() => setStep("reject")}
                            >
                                Tolak
                            </Button>
                            <Button
                                type="button"
                                className="bg-emerald-600 text-white hover:bg-emerald-700"
                                disabled={loading || !submission.can_approve}
                                onClick={handleApprove}
                            >
                                {loading ? "Memproses..." : "Setujui"}
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <h2 className="text-lg font-semibold text-foreground">
                            Tolak pengajuan?
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Berikan alasan penolakan untuk{" "}
                            <strong className="text-foreground">
                                {submission.code}
                            </strong>
                            .
                        </p>
                        <div className="mt-4 space-y-2">
                            <Label htmlFor="submission-reject-reason">
                                Alasan penolakan *
                            </Label>
                            <textarea
                                id="submission-reject-reason"
                                rows={3}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                disabled={loading}
                                className="flex w-full rounded-[8px] border border-[#E5E7EB] bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                                placeholder="Contoh: Stok tidak mencukupi"
                            />
                        </div>
                        <div className="mt-6 flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={loading}
                                onClick={() => {
                                    setReason("");
                                    setStep("review");
                                }}
                            >
                                Kembali
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                disabled={loading || !reason.trim()}
                                onClick={handleRejectConfirm}
                            >
                                {loading ? "Memproses..." : "Tolak"}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
