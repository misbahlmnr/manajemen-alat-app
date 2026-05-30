import InputError from "@/Components/InputError";
import { Button } from "@/Components/ui/button";
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
import { Plus, Trash2 } from "lucide-react";

const emptyItem = () => ({ equipment_id: "", quantity: 1 });

export default function LoanForm({
    data,
    setData,
    errors,
    processing,
    borrowerOptions = [],
    supervisorOptions = [],
    scheduleOptions = [],
    equipmentOptionsAlat = [],
    equipmentOptionsBahan = [],
}) {
    const isAlat = data.item_type === "alat";
    const equipmentOptions = isAlat ? equipmentOptionsAlat : equipmentOptionsBahan;
    const items = data.items?.length > 0 ? data.items : [emptyItem()];

    const setItems = (rows) => setData("items", rows);

    const updateItem = (index, field, value) => {
        const rows = [...items];
        rows[index] = { ...rows[index], [field]: value };
        setItems(rows);
    };

    return (
        <div className="grid gap-6">
            <Card className="rounded-2xl border-border/60 shadow-card">
                <CardHeader>
                    <CardTitle>Data Peminjaman</CardTitle>
                    <CardDescription>
                        Informasi peminjam dan pengajuan.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Jenis Barang *</Label>
                        <Select
                            value={data.item_type}
                            onChange={(e) => {
                                setData("item_type", e.target.value);
                                setData("items", [emptyItem()]);
                            }}
                            disabled={processing}
                        >
                            <option value="alat">Alat (dikembalikan)</option>
                            <option value="bahan">Bahan (sekali pakai)</option>
                        </Select>
                        <InputError message={errors.item_type} />
                    </div>

                    <div className="space-y-2">
                        <Label>Tanggal Pengajuan *</Label>
                        <Input
                            type="date"
                            value={data.request_date}
                            onChange={(e) =>
                                setData("request_date", e.target.value)
                            }
                            disabled={processing}
                        />
                        <InputError message={errors.request_date} />
                    </div>

                    <div className="space-y-2">
                        <Label>Peminjam (Siswa) *</Label>
                        <Select
                            value={data.borrower_id}
                            onChange={(e) =>
                                setData("borrower_id", e.target.value)
                            }
                            disabled={processing}
                        >
                            <option value="">Pilih siswa</option>
                            {borrowerOptions.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.label}
                                </option>
                            ))}
                        </Select>
                        <InputError message={errors.borrower_id} />
                    </div>

                    <div className="space-y-2">
                        <Label>Guru Pembimbing *</Label>
                        <Select
                            value={data.supervisor_id}
                            onChange={(e) =>
                                setData("supervisor_id", e.target.value)
                            }
                            disabled={processing}
                        >
                            <option value="">Pilih guru</option>
                            {supervisorOptions.map((g) => (
                                <option key={g.id} value={g.id}>
                                    {g.name}
                                </option>
                            ))}
                        </Select>
                        <InputError message={errors.supervisor_id} />
                    </div>

                    {isAlat && (
                        <>
                            <div className="space-y-2 sm:col-span-2">
                                <Label>Lokasi Penggunaan *</Label>
                                <Select
                                    value={data.borrow_scope ?? "lab"}
                                    onChange={(e) =>
                                        setData("borrow_scope", e.target.value)
                                    }
                                    disabled={processing}
                                >
                                    <option value="lab">Pakai di Lab</option>
                                    <option value="bawa_pulang">
                                        Bawa Pulang (wajib jaminan kartu)
                                    </option>
                                </Select>
                                {data.borrow_scope === "bawa_pulang" && (
                                    <p className="text-xs text-amber-700">
                                        Kartu pelajar wajib ditahan sebagai
                                        jaminan hingga alat dikembalikan lengkap.
                                    </p>
                                )}
                                <InputError message={errors.borrow_scope} />
                            </div>

                            <div className="space-y-2">
                                <Label>Jadwal Praktikum</Label>
                                <Select
                                    value={data.practicum_schedule_id ?? ""}
                                    onChange={(e) =>
                                        setData(
                                            "practicum_schedule_id",
                                            e.target.value || "",
                                        )
                                    }
                                    disabled={processing}
                                >
                                    <option value="">Opsional</option>
                                    {scheduleOptions.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.label}
                                        </option>
                                    ))}
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Batas Pengembalian *</Label>
                                <Input
                                    type="datetime-local"
                                    value={data.due_at ?? ""}
                                    onChange={(e) =>
                                        setData("due_at", e.target.value)
                                    }
                                    disabled={processing}
                                />
                                <InputError message={errors.due_at} />
                            </div>
                        </>
                    )}

                    <div className="space-y-2 sm:col-span-2">
                        <Label>Tujuan / Keperluan</Label>
                        <Input
                            value={data.purpose ?? ""}
                            onChange={(e) =>
                                setData("purpose", e.target.value)
                            }
                            placeholder="Praktikum, tugas, lomba..."
                            disabled={processing}
                        />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                        <Label>Catatan</Label>
                        <textarea
                            rows={2}
                            value={data.notes ?? ""}
                            onChange={(e) => setData("notes", e.target.value)}
                            disabled={processing}
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                        />
                        <InputError message={errors.notes} />
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/60 shadow-card">
                <CardHeader>
                    <CardTitle>Item {isAlat ? "Alat" : "Bahan"}</CardTitle>
                    <CardDescription>
                        {isAlat
                            ? "Alat yang akan dipinjam dan harus dikembalikan."
                            : "Bahan habis pakai — stok berkurang setelah disetujui."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {items.map((row, index) => (
                        <div
                            key={index}
                            className="grid gap-3 rounded-xl border border-border/50 bg-muted/20 p-3 sm:grid-cols-[1fr_120px_40px]"
                        >
                            <div className="space-y-2">
                                <Label>Barang</Label>
                                <Select
                                    value={row.equipment_id}
                                    onChange={(e) =>
                                        updateItem(
                                            index,
                                            "equipment_id",
                                            e.target.value,
                                        )
                                    }
                                    disabled={processing}
                                >
                                    <option value="">Pilih barang</option>
                                    {equipmentOptions.map((opt) => (
                                        <option key={opt.id} value={opt.id}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </Select>
                                <InputError
                                    message={
                                        errors[`items.${index}.equipment_id`]
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Jumlah</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={row.quantity}
                                    onChange={(e) =>
                                        updateItem(
                                            index,
                                            "quantity",
                                            e.target.value,
                                        )
                                    }
                                    disabled={processing}
                                />
                            </div>
                            <div className="flex items-end justify-end">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 text-destructive"
                                    onClick={() => {
                                        const rows = items.filter(
                                            (_, i) => i !== index,
                                        );
                                        setItems(
                                            rows.length
                                                ? rows
                                                : [emptyItem()],
                                        );
                                    }}
                                    disabled={
                                        processing || items.length === 1
                                    }
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setItems([...items, emptyItem()])}
                        disabled={processing}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah item
                    </Button>
                    <InputError message={errors.items} />
                </CardContent>
            </Card>
        </div>
    );
}
