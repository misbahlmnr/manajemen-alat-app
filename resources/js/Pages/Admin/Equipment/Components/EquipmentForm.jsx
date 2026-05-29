import InputError from "@/Components/InputError";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Select } from "@/Components/ui/select";

export default function EquipmentForm({
    data,
    setData,
    errors,
    processing,
    categoryOptions = [],
}) {
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
                            <option value="active">Aktif</option>
                            <option value="inactive">Nonaktif</option>
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
                </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/60 shadow-card">
                <CardHeader>
                    <CardTitle>Stok & Kondisi</CardTitle>
                    <CardDescription>Kelola ketersediaan dan kondisi fisik alat.</CardDescription>
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
                        <Label htmlFor="available">Stok Tersedia *</Label>
                        <Input
                            id="available"
                            type="number"
                            min={0}
                            max={data.stock || undefined}
                            value={data.available}
                            onChange={(e) => setData("available", e.target.value)}
                            disabled={processing}
                        />
                        <InputError message={errors.available} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="condition">Kondisi *</Label>
                        <Select
                            id="condition"
                            value={data.condition}
                            onChange={(e) => setData("condition", e.target.value)}
                            disabled={processing}
                        >
                            <option value="baik">Baik</option>
                            <option value="rusak_ringan">Rusak Ringan</option>
                            <option value="rusak_berat">Rusak Berat</option>
                        </Select>
                        <InputError message={errors.condition} />
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
                </CardContent>
            </Card>
        </div>
    );
}
