import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Select } from "@/Components/ui/select";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function InspectReturnDialog({
    open,
    onOpenChange,
    loanCode,
    onConfirm,
    loading,
}) {
    const [result, setResult] = useState("lengkap");
    const [notes, setNotes] = useState("");
    const [missingItems, setMissingItems] = useState("");
    const [damageDescription, setDamageDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [damageLevel, setDamageLevel] = useState("rusak_ringan");

    if (!open) return null;

    const needsDetail = result !== "lengkap";

    const handleConfirm = () => {
        onConfirm({
            result,
            notes: notes || null,
            missing_items: needsDetail ? missingItems || null : null,
            damage_description: needsDetail ? damageDescription || null : null,
            damage_level: result === "rusak" ? damageLevel : null,
            amount: needsDetail && amount ? parseInt(amount, 10) : null,
            description: needsDetail ? description || null : null,
        });
    };

    const handleClose = () => {
        if (loading) return;
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
                    "relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-floating animate-fade-in",
                )}
            >
                <h2 className="text-lg font-semibold text-foreground">
                    Inspeksi Pengembalian
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    Peminjaman <strong>{loanCode}</strong>
                </p>

                <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                        <Label>Hasil inspeksi *</Label>
                        <Select
                            value={result}
                            onChange={(e) => setResult(e.target.value)}
                            disabled={loading}
                        >
                            <option value="lengkap">Lengkap & Baik</option>
                            <option value="tidak_lengkap">Tidak Lengkap</option>
                            <option value="rusak">Rusak</option>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Catatan inspeksi</Label>
                        <textarea
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            disabled={loading}
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                    </div>

                    {result === "rusak" && (
                        <div className="space-y-2">
                            <Label>Tingkat kerusakan *</Label>
                            <Select
                                value={damageLevel}
                                onChange={(e) =>
                                    setDamageLevel(e.target.value)
                                }
                                disabled={loading}
                            >
                                <option value="rusak_ringan">Rusak Ringan</option>
                                <option value="rusak_berat">Rusak Berat</option>
                            </Select>
                        </div>
                    )}

                    {needsDetail && (
                        <>
                            <div className="space-y-2">
                                <Label>Item kurang / kerusakan</Label>
                                <textarea
                                    rows={2}
                                    value={missingItems}
                                    onChange={(e) =>
                                        setMissingItems(e.target.value)
                                    }
                                    disabled={loading}
                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Deskripsi kerusakan</Label>
                                <textarea
                                    rows={2}
                                    value={damageDescription}
                                    onChange={(e) =>
                                        setDamageDescription(e.target.value)
                                    }
                                    disabled={loading}
                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Nominal ganti rugi (Rp)</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Instruksi ke siswa</Label>
                                <textarea
                                    rows={2}
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
                                    disabled={loading}
                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
                            </div>
                            <p className="text-xs text-amber-700">
                                Kartu pelajar tetap ditahan sampai kompensasi
                                selesai.
                            </p>
                        </>
                    )}
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <Button
                        variant="outline"
                        disabled={loading}
                        onClick={handleClose}
                    >
                        Batal
                    </Button>
                    <Button disabled={loading} onClick={handleConfirm}>
                        {loading ? "Memproses..." : "Simpan Inspeksi"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
