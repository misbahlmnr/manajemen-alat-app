import { Button } from "@/Components/ui/button";
import { Label } from "@/Components/ui/label";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function ReturnLoanDialog({
    open,
    onOpenChange,
    itemName,
    onConfirm,
    loading,
}) {
    const [note, setNote] = useState("");

    if (!open) return null;

    const handleConfirm = () => {
        onConfirm(note.trim() || null);
        setNote("");
    };

    const handleClose = () => {
        if (loading) return;
        setNote("");
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
                className={cn(
                    "relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-floating animate-fade-in",
                )}
            >
                <h2 className="text-lg font-semibold text-foreground">
                    Proses pengembalian
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    Konfirmasi pengembalian untuk{" "}
                    <strong className="text-foreground">{itemName}</strong>.
                    Stok alat akan dikembalikan.
                </p>
                <div className="mt-4 space-y-2">
                    <Label htmlFor="return-note">Catatan (opsional)</Label>
                    <textarea
                        id="return-note"
                        rows={2}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        disabled={loading}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                        placeholder="Kondisi alat saat kembali"
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
                        disabled={loading}
                        onClick={handleConfirm}
                    >
                        {loading ? "Memproses..." : "Konfirmasi"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
