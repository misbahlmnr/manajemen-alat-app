import InputError from "@/Components/InputError";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Select } from "@/Components/ui/select";
import EquipmentImage from "@/Components/Equipment/EquipmentImage";
import { cn } from "@/lib/utils";
import { CheckCircle2, Minus, Plus, XCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

function toCount(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return Math.floor(parsed);
}

function QuantityStepper({
    id,
    label,
    hint,
    value,
    onChange,
    disabled,
    error,
    tone = "default",
    min = 0,
}) {
    const tones = {
        success: "border-emerald-200 bg-emerald-50/60",
        warning: "border-amber-200 bg-amber-50/60",
        danger: "border-red-200 bg-red-50/60",
        default: "border-border bg-card",
    };

    const count = toCount(value);

    const step = (delta) => {
        onChange(Math.max(min, count + delta));
    };

    return (
        <div className={cn("rounded-xl border p-4", tones[tone] ?? tones.default)}>
            <Label htmlFor={id} className="text-sm font-semibold">
                {label}
            </Label>
            {hint && (
                <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
            )}
            <div className="mt-3 flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => step(-1)}
                    disabled={disabled || count <= min}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-background text-foreground hover:bg-accent disabled:opacity-40"
                    aria-label={`Kurangi ${label}`}
                >
                    <Minus className="h-4 w-4" />
                </button>
                <Input
                    id={id}
                    type="number"
                    min={min}
                    inputMode="numeric"
                    value={value}
                    onChange={(e) => onChange(Math.max(min, toCount(e.target.value)))}
                    disabled={disabled}
                    className="h-10 text-center text-lg font-semibold tabular-nums"
                />
                <button
                    type="button"
                    onClick={() => step(1)}
                    disabled={disabled}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-background text-foreground hover:bg-accent disabled:opacity-40"
                    aria-label={`Tambah ${label}`}
                >
                    <Plus className="h-4 w-4" />
                </button>
            </div>
            {error && <InputError className="mt-2" message={error} />}
        </div>
    );
}

export default function EquipmentForm({
    data,
    setData,
    errors,
    processing,
    categoryOptions = [],
    existingImageUrl = null,
    isEditing = false,
}) {
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (!data.image) {
            setPreviewUrl(null);
            return;
        }

        const url = URL.createObjectURL(data.image);
        setPreviewUrl(url);

        return () => URL.revokeObjectURL(url);
    }, [data.image]);

    const qtyBaik = toCount(data.qty_baik);
    const qtyRingan = toCount(data.qty_rusak_ringan);
    const qtyBerat = toCount(data.qty_rusak_berat);
    const available = toCount(data.available);
    const stock = qtyBaik + qtyRingan + qtyBerat;

    const borrowedLockedRef = useRef(null);
    if (borrowedLockedRef.current === null) {
        borrowedLockedRef.current = isEditing
            ? Math.max(0, qtyBaik - available)
            : 0;
    }
    const borrowed = borrowedLockedRef.current;

    const updateStockFields = (patch) => {
        setData((current) => {
            const nextBaik = Math.max(
                borrowed,
                toCount(
                    patch.qty_baik !== undefined
                        ? patch.qty_baik
                        : current.qty_baik,
                ),
            );
            const nextRingan = toCount(
                patch.qty_rusak_ringan !== undefined
                    ? patch.qty_rusak_ringan
                    : current.qty_rusak_ringan,
            );
            const nextBerat = toCount(
                patch.qty_rusak_berat !== undefined
                    ? patch.qty_rusak_berat
                    : current.qty_rusak_berat,
            );
            const nextStock = nextBaik + nextRingan + nextBerat;
            const nextAvailable = isEditing
                ? Math.max(0, nextBaik - borrowed)
                : nextBaik;

            return {
                ...current,
                qty_baik: nextBaik,
                qty_rusak_ringan: nextRingan,
                qty_rusak_berat: nextBerat,
                stock: nextStock,
                available: nextAvailable,
            };
        });
    };

    const stockHint = useMemo(() => {
        if (stock < 1) return "Minimal 1 unit agar alat bisa disimpan.";
        if (qtyBaik === 0) return "Belum ada unit baik — siswa belum bisa meminjam alat ini.";
        if (isEditing && borrowed > 0) {
            return `${borrowed} unit baik sedang dipinjam, ${available} unit siap dipinjam di lab.`;
        }
        return `${qtyBaik} unit baik siap dipinjam dari total ${stock} unit.`;
    }, [available, borrowed, isEditing, qtyBaik, stock]);

    return (
        <div className="grid gap-6">
            <Card className="rounded-xl border shadow-sm">
                <CardHeader>
                    <CardTitle>Informasi Alat</CardTitle>
                    <CardDescription>Data identitas dan klasifikasi alat lab.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="name">Nama Alat *</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            placeholder="Contoh: Kamera DSLR Canon EOS 80D"
                            disabled={processing}
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Kategori *</Label>
                        <Select
                            id="category"
                            value={data.category}
                            onChange={(e) => setData("category", e.target.value)}
                            disabled={processing}
                        >
                            <option value="">Pilih kategori</option>
                            {categoryOptions.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </Select>
                        <InputError message={errors.category} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Status Inventaris *</Label>
                        <Select
                            id="status"
                            value={data.status}
                            onChange={(e) => setData("status", e.target.value)}
                            disabled={processing}
                        >
                            <option value="tersedia">Tersedia</option>
                            <option value="tidak_tersedia">Tidak Tersedia</option>
                        </Select>
                        <InputError message={errors.status} />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="description">Deskripsi</Label>
                        <textarea
                            id="description"
                            rows={3}
                            value={data.description ?? ""}
                            onChange={(e) => setData("description", e.target.value)}
                            disabled={processing}
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                            placeholder="Spesifikasi atau catatan tambahan"
                        />
                        <InputError message={errors.description} />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="image">Gambar Alat</Label>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                            <EquipmentImage
                                imageUrl={previewUrl ?? existingImageUrl}
                                name={data.name || "Alat"}
                                className="h-28 w-28 shrink-0 rounded-lg border"
                            />
                            <input
                                id="image"
                                type="file"
                                accept="image/*"
                                disabled={processing}
                                onChange={(e) =>
                                    setData("image", e.target.files[0] ?? null)
                                }
                                className="block w-full cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
                            />
                        </div>
                        <InputError message={errors.image} />
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-xl border shadow-sm">
                <CardHeader>
                    <CardTitle>Stok & Kondisi</CardTitle>
                    <CardDescription>
                        Isi jumlah unit per kondisi. Total stok dihitung otomatis.
                        Stok tersedia di lab berkurang sendiri saat alat dipinjam
                        dan kembali saat dikembalikan.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className={cn("grid gap-3", isEditing ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3")}>
                        <div className="rounded-lg border bg-muted/40 p-3">
                            <p className="text-xs text-muted-foreground">Total stok</p>
                            <p className="mt-1 text-2xl font-bold tabular-nums">{stock}</p>
                            <p className="text-xs text-muted-foreground">unit keseluruhan</p>
                        </div>
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3">
                            <p className="text-xs text-emerald-800">Di lab, siap dipinjam</p>
                            <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-800">
                                {available}
                            </p>
                            <p className="text-xs text-emerald-800/80">otomatis dari peminjaman</p>
                        </div>
                        {isEditing && (
                            <div className="rounded-lg border border-sky-200 bg-sky-50/70 p-3">
                                <p className="text-xs text-sky-800">Sedang dipinjam</p>
                                <p className="mt-1 text-2xl font-bold tabular-nums text-sky-800">
                                    {borrowed}
                                </p>
                                <p className="text-xs text-sky-800/80">tidak perlu disesuaikan manual</p>
                            </div>
                        )}
                        <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3">
                            <p className="text-xs text-amber-800">Tidak dipinjamkan</p>
                            <p className="mt-1 text-2xl font-bold tabular-nums text-amber-800">
                                {qtyRingan + qtyBerat}
                            </p>
                            <p className="text-xs text-amber-800/80">rusak ringan + berat</p>
                        </div>
                    </div>

                    <p className="text-sm text-muted-foreground">{stockHint}</p>
                    <InputError message={errors.stock} />

                    <div className="grid gap-3 lg:grid-cols-3">
                        <QuantityStepper
                            id="qty_baik"
                            label="Baik"
                            hint={
                                borrowed > 0
                                    ? `Layak dipinjam · minimal ${borrowed} karena sedang dipinjam`
                                    : "Layak dipinjam siswa"
                            }
                            value={data.qty_baik}
                            onChange={(value) => updateStockFields({ qty_baik: value })}
                            disabled={processing}
                            error={errors.qty_baik}
                            tone="success"
                            min={borrowed}
                        />
                        <QuantityStepper
                            id="qty_rusak_ringan"
                            label="Rusak Ringan"
                            hint="Perlu perbaikan, tidak dipinjam"
                            value={data.qty_rusak_ringan}
                            onChange={(value) =>
                                updateStockFields({ qty_rusak_ringan: value })
                            }
                            disabled={processing}
                            error={errors.qty_rusak_ringan}
                            tone="warning"
                        />
                        <QuantityStepper
                            id="qty_rusak_berat"
                            label="Rusak Berat"
                            hint="Tidak layak pakai"
                            value={data.qty_rusak_berat}
                            onChange={(value) =>
                                updateStockFields({ qty_rusak_berat: value })
                            }
                            disabled={processing}
                            error={errors.qty_rusak_berat}
                            tone="danger"
                        />
                    </div>

                    <div className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50/70 p-3 text-sm text-sky-800">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                        {isEditing ? (
                            <span>
                                Stok di lab berubah otomatis: berkurang saat admin
                                menandai dipinjam, dan kembali saat alat dikembalikan.
                                Admin hanya menyesuaikan kondisi unit (baik/rusak).
                            </span>
                        ) : (
                            <span>
                                Semua unit baik otomatis siap dipinjam. Setelah ada
                                peminjaman, stok di lab akan berkurang sendiri.
                            </span>
                        )}
                    </div>

                    {stock < 1 && (
                        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            Total stok belum boleh 0. Tambah minimal 1 unit.
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="location">Lokasi Rak *</Label>
                        <Input
                            id="location"
                            value={data.location}
                            onChange={(e) => setData("location", e.target.value)}
                            placeholder="Rak A1"
                            disabled={processing}
                        />
                        <InputError message={errors.location} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
