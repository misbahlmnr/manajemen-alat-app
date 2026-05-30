import { Button } from "@/Components/ui/button";
import { Label } from "@/Components/ui/label";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function RejectLoanDialog({
    open,
    onOpenChange,
    itemName,
    onConfirm,
    loading,
}) {
    const [reason, setReason] = useState("");

    if (!open) return null;

    const handleConfirm = () => {
        if (!reason.trim()) return;
        onConfirm(reason.trim());
        setReason("");
    };

    const handleClose = () => {
        if (loading) return;
        setReason("");
        onOpenChange(false);
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
                    "relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-floating animate-fade-in",
                )}
            >
                <h2 className="text-lg font-semibold text-foreground">
                    Tolak peminjaman?
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    Berikan alasan penolakan untuk{" "}
                    <strong className="text-foreground">{itemName}</strong>.
                </p>
                <div className="mt-4 space-y-2">
                    <Label htmlFor="reject-reason">Alasan penolakan *</Label>
                    <textarea
                        id="reject-reason"
                        rows={3}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        disabled={loading}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                        placeholder="Contoh: Stok tidak mencukupi"
                    />
                </div>
                <div className="mt-6 flex justify-end gap-2">
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
                        variant="destructive"
                        disabled={loading || !reason.trim()}
                        onClick={handleConfirm}
                    >
                        {loading ? "Memproses..." : "Tolak"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
