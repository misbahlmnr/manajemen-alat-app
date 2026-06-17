import InputError from "@/Components/InputError";
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

import EquipmentImage from "@/Components/Equipment/EquipmentImage";
import { useEffect, useState } from "react";

export default function SupplyForm({
    data,
    setData,
    errors,
    processing,
    categoryOptions = [],
    unitOptions = [],
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

    return (
        <div className="grid gap-6">
            <Card className="rounded-2xl border-border/60 shadow-card">
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
                            {unitOptions.map((unit) => (
                                <option key={unit} value={unit}>
                                    {unit}
                                </option>
                            ))}
                        </Select>
                        <InputError message={errors.unit} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Status *</Label>
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
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                            placeholder="Spesifikasi atau catatan tambahan"
                        />
                        <InputError message={errors.description} />
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/60 shadow-card">
                <CardHeader>
                    <CardTitle>Stok Bahan</CardTitle>
                    <CardDescription>
                        Kelola total stok, stok tersisa, dan ambang peringatan.
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
                        <Label htmlFor="available">Stok Tersisa *</Label>
                        <Input
                            id="available"
                            type="number"
                            min={0}
                            max={data.stock || undefined}
                            value={data.available}
                            onChange={(e) =>
                                setData("available", e.target.value)
                            }
                            disabled={processing}
                        />
                        <InputError message={errors.available} />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="min_stock">Stok Minimum (peringatan)</Label>
                        <Input
                            id="min_stock"
                            type="number"
                            min={0}
                            value={data.min_stock ?? ""}
                            onChange={(e) =>
                                setData(
                                    "min_stock",
                                    e.target.value === ""
                                        ? ""
                                        : e.target.value,
                                )
                            }
                            placeholder="Opsional — tampil peringatan jika stok di bawah nilai ini"
                            disabled={processing}
                        />
                        <InputError message={errors.min_stock} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
