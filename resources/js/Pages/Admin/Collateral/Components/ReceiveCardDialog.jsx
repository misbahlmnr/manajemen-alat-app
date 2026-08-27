import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export default function ReceiveCardDialog({
    open,
    onOpenChange,
    studentName,
    defaultCardNumber = "",
    onConfirm,
    loading,
}) {
    const [cardNumber, setCardNumber] = useState(defaultCardNumber);
    const [notes, setNotes] = useState("");

    useEffect(() => {
        if (!open) return;
        setCardNumber(defaultCardNumber ?? "");
        setNotes("");
    }, [open, defaultCardNumber]);

    if (!open) return null;

    const handleClose = () => {
        if (loading) return;
        onOpenChange(false);
    };

    const handleConfirm = () => {
        onConfirm({
            card_number: cardNumber.trim() || null,
            notes: notes.trim() || null,
        });
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
                    "relative z-10 w-full max-w-md rounded-[12px] border border-[#E5E7EB] bg-card p-6 shadow-[var(--shadow-md)] animate-fade-in",
                )}
            >
                <h2 className="text-lg font-semibold text-foreground">
                    Konfirmasi
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    Terima kartu pelajar
                    {studentName ? (
                        <>
                            {" "}
                            dari <strong>{studentName}</strong>
                        </>
                    ) : null}
                    . Kartu ditahan sebagai jaminan sampai alat dikembalikan.
                </p>

                <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="receive-card-number">
                            Nomor kartu{" "}
                            <span className="font-normal text-muted-foreground">
                                (opsional)
                            </span>
                        </Label>
                        <Input
                            id="receive-card-number"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="Nomor / NISN"
                            disabled={loading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="receive-card-notes">Catatan</Label>
                        <textarea
                            id="receive-card-notes"
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="................"
                            disabled={loading}
                            className="flex min-h-[80px] w-full rounded-[8px] border border-[#E5E7EB] bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={loading}
                    >
                        {loading ? "Menyimpan..." : "Simpan"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
