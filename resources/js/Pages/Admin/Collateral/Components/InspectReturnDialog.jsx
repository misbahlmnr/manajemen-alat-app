import { Button } from "@/Components/ui/button";
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
    const [damageLevel, setDamageLevel] = useState("rusak_ringan");
    const [missingItems, setMissingItems] = useState("");
    const [damageDescription, setDamageDescription] = useState("");
    const [studentInstruction, setStudentInstruction] = useState("");

    if (!open) return null;

    const isDamaged = result === "rusak";
    const isIncomplete = result === "tidak_lengkap";

    const handleConfirm = () => {
        onConfirm({
            result,
            notes: null,
            missing_items: isIncomplete ? missingItems || null : null,
            damage_description: isDamaged ? damageDescription || null : null,
            damage_level: isDamaged ? damageLevel : null,
            amount: null,
            description: isDamaged || isIncomplete ? studentInstruction || null : null,
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
                    "relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[12px] border border-[#E5E7EB] bg-card p-6 shadow-[var(--shadow-md)] animate-fade-in",
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
                            onChange={(e) => {
                                setResult(e.target.value);
                                setMissingItems("");
                                setDamageDescription("");
                                setStudentInstruction("");
                                if (e.target.value !== "rusak") {
                                    setDamageLevel("rusak_ringan");
                                }
                            }}
                            disabled={loading}
                        >
                            <option value="lengkap">Lengkap & Baik</option>
                            <option value="tidak_lengkap">Tidak Lengkap</option>
                            <option value="rusak">Rusak</option>
                        </Select>
                    </div>

                    {isDamaged && (
                        <>
                            <div className="space-y-2">
                                <Label>Tingkat kerusakan *</Label>
                                <Select
                                    value={damageLevel}
                                    onChange={(e) =>
                                        setDamageLevel(e.target.value)
                                    }
                                    disabled={loading}
                                >
                                    <option value="rusak_ringan">
                                        Rusak Ringan
                                    </option>
                                    <option value="rusak_berat">
                                        Rusak Berat
                                    </option>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Pilihan ini langsung mengubah kondisi stok
                                    di inventaris (Baik / Rusak Ringan / Rusak
                                    Berat).
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>Deskripsi kerusakan *</Label>
                                <textarea
                                    rows={3}
                                    value={damageDescription}
                                    onChange={(e) =>
                                        setDamageDescription(e.target.value)
                                    }
                                    disabled={loading}
                                    placeholder="Contoh: Layar kamera retak, tombol power tidak berfungsi."
                                    className="flex w-full rounded-[8px] border border-[#E5E7EB] bg-background px-3 py-2 text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Instruksi ke siswa *</Label>
                                <textarea
                                    rows={3}
                                    value={studentInstruction}
                                    onChange={(e) =>
                                        setStudentInstruction(e.target.value)
                                    }
                                    disabled={loading}
                                    placeholder="Contoh: Segera datang ke kantor lab besok pagi jam 07.00."
                                    className="flex w-full rounded-[8px] border border-[#E5E7EB] bg-background px-3 py-2 text-sm"
                                />
                            </div>
                        </>
                    )}

                    {isIncomplete && (
                        <>
                            <div className="space-y-2">
                                <Label>Item yang kurang *</Label>
                                <textarea
                                    rows={2}
                                    value={missingItems}
                                    onChange={(e) =>
                                        setMissingItems(e.target.value)
                                    }
                                    disabled={loading}
                                    placeholder="Sebutkan item yang tidak dikembalikan."
                                    className="flex w-full rounded-[8px] border border-[#E5E7EB] bg-background px-3 py-2 text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Instruksi ke siswa *</Label>
                                <textarea
                                    rows={2}
                                    value={studentInstruction}
                                    onChange={(e) =>
                                        setStudentInstruction(e.target.value)
                                    }
                                    disabled={loading}
                                    placeholder="Contoh: Datang ke kantor lab untuk penyelesaian."
                                    className="flex w-full rounded-[8px] border border-[#E5E7EB] bg-background px-3 py-2 text-sm"
                                />
                            </div>
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
