import InputError from "@/Components/InputError";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Select } from "@/Components/ui/select";
import EquipmentImage from "@/Components/Equipment/EquipmentImage";
import { useEffect, useMemo, useState } from "react";

export default function EquipmentForm({
    data,
    setData,
    errors,
    processing,
    categoryOptions = [],
    existingImageUrl = null,
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

    const conditionTotal = useMemo(
        () =>
            Number(data.qty_baik || 0) +
            Number(data.qty_rusak_ringan || 0) +
            Number(data.qty_rusak_berat || 0),
        [data.qty_baik, data.qty_rusak_ringan, data.qty_rusak_berat],
    );

    const stockNumber = Number(data.stock || 0);
    const conditionMismatch = stockNumber > 0 && conditionTotal !== stockNumber;

    return (
        <div className="grid gap-6">
            <Card className="rounded-2xl border-border/60 shadow-card">
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
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
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
                                className="h-28 w-28 shrink-0 rounded-xl border border-border/60"
                            />
                            <input
                                id="image"
                                type="file"
                                accept="image/*"
                                disabled={processing}
                                onChange={(e) =>
                                    setData("image", e.target.files[0] ?? null)
                                }
                                className="block w-full cursor-pointer rounded-xl border border-border/60 bg-card px-3 py-2 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
                            />
                        </div>
                        <InputError message={errors.image} />
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/60 shadow-card">
                <CardHeader>
                    <CardTitle>Stok & Kondisi</CardTitle>
                    <CardDescription>
                        Hanya unit kondisi baik yang dapat dipinjam siswa.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="stock">Total Stok *</Label>
                        <Input
                            id="stock"
                            type="number"
                            min={1}
                            value={data.stock}
                            onChange={(e) => setData("stock", e.target.value)}
                            disabled={processing}
                        />
                        <InputError message={errors.stock} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="available">Stok Baik Tersedia *</Label>
                        <Input
                            id="available"
                            type="number"
                            min={0}
                            max={data.qty_baik || undefined}
                            value={data.available}
                            onChange={(e) => setData("available", e.target.value)}
                            disabled={processing}
                        />
                        <InputError message={errors.available} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="qty_baik">Jumlah Baik *</Label>
                        <Input
                            id="qty_baik"
                            type="number"
                            min={0}
                            value={data.qty_baik}
                            onChange={(e) => setData("qty_baik", e.target.value)}
                            disabled={processing}
                        />
                        <InputError message={errors.qty_baik} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="qty_rusak_ringan">Jumlah Rusak Ringan *</Label>
                        <Input
                            id="qty_rusak_ringan"
                            type="number"
                            min={0}
                            value={data.qty_rusak_ringan}
                            onChange={(e) =>
                                setData("qty_rusak_ringan", e.target.value)
                            }
                            disabled={processing}
                        />
                        <InputError message={errors.qty_rusak_ringan} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="qty_rusak_berat">Jumlah Rusak Berat *</Label>
                        <Input
                            id="qty_rusak_berat"
                            type="number"
                            min={0}
                            value={data.qty_rusak_berat}
                            onChange={(e) =>
                                setData("qty_rusak_berat", e.target.value)
                            }
                            disabled={processing}
                        />
                        <InputError message={errors.qty_rusak_berat} />
                    </div>

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

                    {conditionMismatch && (
                        <p className="text-sm text-destructive sm:col-span-2">
                            Total kondisi ({conditionTotal}) harus sama dengan total
                            stok ({stockNumber}).
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
