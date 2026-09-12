import InputError from "@/Components/InputError";
import EquipmentImage from "@/Components/Equipment/EquipmentImage";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Select } from "@/Components/ui/select";
import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
    suffix,
}) {
    const tones = {
        success: "border-emerald-200 bg-emerald-50/60",
        warning: "border-amber-200 bg-amber-50/60",
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
            <div className="mt-3 flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => step(-1)}
                    disabled={disabled || count <= min}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-2 border-zinc-400 bg-background text-foreground shadow-sm hover:bg-accent disabled:opacity-40"
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
                    className="h-10 border-2 border-zinc-400 text-center text-lg font-semibold tabular-nums shadow-sm"
                />
                <button
                    type="button"
                    onClick={() => step(1)}
                    disabled={disabled}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-2 border-zinc-400 bg-background text-foreground shadow-sm hover:bg-accent disabled:opacity-40"
                    aria-label={`Tambah ${label}`}
                >
                    <Plus className="h-4 w-4" />
                </button>
                {suffix && (
                    <span className="text-sm font-medium text-muted-foreground">
                        {suffix}
                    </span>
                )}
            </div>
            {hint && (
                <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
            )}
            {error && <InputError className="mt-2" message={error} />}
        </div>
    );
}

export default function SupplyForm({
    data,
    setData,
    errors,
    processing,
    categoryOptions = [],
    unitOptions = [],
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

    const stock = toCount(data.stock);
    const available = toCount(data.available);
    const unit = data.unit || "satuan";

    const usedLockedRef = useRef(null);
    if (usedLockedRef.current === null) {
        usedLockedRef.current = isEditing
            ? Math.max(0, stock - available)
            : 0;
    }
    const used = usedLockedRef.current;

    const updateStock = (nextStock) => {
        setData((current) => {
            const next = Math.max(used, toCount(nextStock));
            return {
                ...current,
                stock: next,
                available: isEditing ? Math.max(0, next - used) : next,
            };
        });
    };

    const updateMinStock = (nextValue) => {
        if (nextValue === "" || toCount(nextValue) <= 0) {
            setData("min_stock", "");
            return;
        }
        setData("min_stock", toCount(nextValue));
    };

    const minStock = data.min_stock === "" || data.min_stock == null
        ? 0
        : toCount(data.min_stock);
    const isLowPreview =
        minStock > 0 && available <= minStock;

    const initialStockRef = useRef(stock);
    const stockChanged = isEditing && stock !== initialStockRef.current;

    return (
        <div className="grid gap-6">
            <Card className="rounded-xl border shadow-sm">
                <CardHeader>
                    <CardTitle>Informasi Bahan</CardTitle>
                    <CardDescription>
                        Data identitas dan klasifikasi bahan lab.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="name">Nama Bahan *</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            placeholder="Contoh: Resistor 1/4W (Mix Pack)"
                            disabled={processing}
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Kategori *</Label>
                        <Select
                            id="category"
                            value={data.category}
                            onChange={(e) =>
                                setData("category", e.target.value)
                            }
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
                        <Label htmlFor="unit">Satuan *</Label>
                        <Select
                            id="unit"
                            value={data.unit}
                            onChange={(e) => setData("unit", e.target.value)}
                            disabled={processing}
                        >
                            <option value="">Pilih satuan</option>
                            {unitOptions.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </Select>
                        <InputError message={errors.unit} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location">Lokasi Gudang</Label>
                        <Input
                            id="location"
                            value={data.location ?? ""}
                            onChange={(e) =>
                                setData("location", e.target.value)
                            }
                            placeholder="Rak Gudang B1 (opsional)"
                            disabled={processing}
                        />
                        <InputError message={errors.location} />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="image">Gambar Bahan</Label>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                            <EquipmentImage
                                imageUrl={previewUrl ?? existingImageUrl}
                                name={data.name || "Bahan"}
                                itemType="bahan"
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

                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="description">Deskripsi</Label>
                        <textarea
                            id="description"
                            rows={3}
                            value={data.description ?? ""}
                            onChange={(e) =>
                                setData("description", e.target.value)
                            }
                            disabled={processing}
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                            placeholder="Spesifikasi atau catatan tambahan"
                        />
                        <InputError message={errors.description} />
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-xl border shadow-sm">
                <CardHeader>
                    <CardTitle>Stok Bahan</CardTitle>
                    <CardDescription>
                        {isEditing
                            ? "Sesuaikan total stok saat restok. Stok di gudang dihitung otomatis."
                            : "Isi jumlah stok awal bahan di gudang."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    {isEditing && (
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-lg border bg-muted/40 p-3">
                                <p className="text-xs text-muted-foreground">Total stok</p>
                                <p className="mt-1 text-2xl font-bold tabular-nums">
                                    {stock}
                                </p>
                                <p className="text-xs text-muted-foreground">{unit}</p>
                            </div>
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3">
                                <p className="text-xs text-emerald-800">Di gudang</p>
                                <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-800">
                                    {available}
                                </p>
                                <p className="text-xs text-emerald-800/80">siap diambil</p>
                            </div>
                            <div className="rounded-lg border border-sky-200 bg-sky-50/70 p-3">
                                <p className="text-xs text-sky-800">Sudah diambil</p>
                                <p className="mt-1 text-2xl font-bold tabular-nums text-sky-800">
                                    {used}
                                </p>
                                <p className="text-xs text-sky-800/80">dari peminjaman</p>
                            </div>
                        </div>
                    )}

                    <QuantityStepper
                        id="stock"
                        label="Total stok"
                        hint={
                            isEditing
                                ? stockChanged
                                    ? `Jika diubah ke ${stock}, stok di gudang otomatis menjadi ${available}${used > 0 ? ` karena ${used} sudah diambil` : ""}.`
                                    : used > 0
                                      ? `Minimal ${used} ${unit} karena sudah ada yang diambil.`
                                      : "Tambah angka ini saat restok. Isi 0 jika bahan tidak tersedia."
                                : stock < 1
                                  ? "Total 0 — bahan tercatat sebagai tidak tersedia sampai stok ditambah."
                                  : "Stok awal akan langsung tercatat di gudang dan berkurang otomatis saat peminjaman/pengambilan disetujui."
                        }
                        value={data.stock}
                        onChange={updateStock}
                        disabled={processing}
                        error={errors.stock}
                        tone="success"
                        min={Math.max(0, used)}
                        suffix={unit}
                    />
                    <InputError message={errors.available} />

                    <QuantityStepper
                        id="min_stock"
                        label="Peringatan stok menipis"
                        hint="Notifikasi akan muncul saat sisa stok di gudang mencapai angka ini (isi 0 jika tidak ingin peringatan)."
                        value={minStock}
                        onChange={updateMinStock}
                        disabled={processing}
                        error={errors.min_stock}
                        tone="warning"
                        min={0}
                        suffix={unit}
                    />

                    {isLowPreview && (
                        <p className="text-sm text-amber-800">
                            Sisa di gudang ({available} {unit}) sudah mencapai
                            ambang peringatan ({minStock} {unit}).
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
