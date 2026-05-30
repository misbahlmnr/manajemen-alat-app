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

const emptyEquipmentRow = () => ({ equipment_id: "", quantity: 1 });

export default function ScheduleForm({
    data,
    setData,
    errors,
    processing,
    guruOptions = [],
    kelasOptions = [],
    subjectOptions = [],
    equipmentOptions = [],
}) {
    const equipmentRows =
        data.required_equipment?.length > 0
            ? data.required_equipment
            : [emptyEquipmentRow()];

    const setEquipmentRows = (rows) => {
        setData("required_equipment", rows);
    };

    const updateRow = (index, field, value) => {
        const rows = [...equipmentRows];
        rows[index] = { ...rows[index], [field]: value };
        setEquipmentRows(rows);
    };

    const addRow = () => {
        setEquipmentRows([...equipmentRows, emptyEquipmentRow()]);
    };

    const removeRow = (index) => {
        const rows = equipmentRows.filter((_, i) => i !== index);
        setEquipmentRows(rows.length ? rows : [emptyEquipmentRow()]);
    };

    return (
        <div className="grid gap-6">
            <Card className="rounded-2xl border-border/60 shadow-card">
                <CardHeader>
                    <CardTitle>Informasi Jadwal</CardTitle>
                    <CardDescription>
                        Data praktikum mata pelajaran kejurusan AV/TAV.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="title">Judul Jadwal *</Label>
                        <Input
                            id="title"
                            value={data.title}
                            onChange={(e) => setData("title", e.target.value)}
                            placeholder="Contoh: Praktik Shooting Video Dokumenter"
                            disabled={processing}
                        />
                        <InputError message={errors.title} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="mata_kuliah">Mata Pelajaran *</Label>
                        <Select
                            id="mata_kuliah"
                            value={data.mata_kuliah}
                            onChange={(e) =>
                                setData("mata_kuliah", e.target.value)
                            }
                            disabled={processing}
                        >
                            <option value="">Pilih mata pelajaran</option>
                            {subjectOptions.map((subject) => (
                                <option key={subject} value={subject}>
                                    {subject}
                                </option>
                            ))}
                        </Select>
                        <InputError message={errors.mata_kuliah} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="kelas">Kelas *</Label>
                        <Select
                            id="kelas"
                            value={data.kelas}
                            onChange={(e) => setData("kelas", e.target.value)}
                            disabled={processing}
                        >
                            <option value="">Pilih kelas</option>
                            {kelasOptions.map((kelas) => (
                                <option key={kelas} value={kelas}>
                                    {kelas}
                                </option>
                            ))}
                        </Select>
                        <InputError message={errors.kelas} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="guru_id">Guru Pengampu *</Label>
                        <Select
                            id="guru_id"
                            value={data.guru_id}
                            onChange={(e) => setData("guru_id", e.target.value)}
                            disabled={processing}
                        >
                            <option value="">Pilih guru</option>
                            {guruOptions.map((guru) => (
                                <option key={guru.id} value={guru.id}>
                                    {guru.name}
                                </option>
                            ))}
                        </Select>
                        <InputError message={errors.guru_id} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="ruangan">Ruang / Lab</Label>
                        <Input
                            id="ruangan"
                            value={data.ruangan ?? ""}
                            onChange={(e) => setData("ruangan", e.target.value)}
                            placeholder="Lab AV-1"
                            disabled={processing}
                        />
                        <InputError message={errors.ruangan} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="priority">Prioritas *</Label>
                        <Select
                            id="priority"
                            value={data.priority}
                            onChange={(e) =>
                                setData("priority", e.target.value)
                            }
                            disabled={processing}
                        >
                            <option value="normal">Normal</option>
                            <option value="tinggi">Tinggi</option>
                            <option value="lomba">Lomba</option>
                        </Select>
                        <InputError message={errors.priority} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Status *</Label>
                        <Select
                            id="status"
                            value={data.status}
                            onChange={(e) => setData("status", e.target.value)}
                            disabled={processing}
                        >
                            <option value="draft">Draft</option>
                            <option value="aktif">Aktif</option>
                            <option value="selesai">Selesai</option>
                            <option value="dibatalkan">Dibatalkan</option>
                        </Select>
                        <InputError message={errors.status} />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="notes">Catatan</Label>
                        <textarea
                            id="notes"
                            rows={3}
                            value={data.notes ?? ""}
                            onChange={(e) => setData("notes", e.target.value)}
                            disabled={processing}
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                            placeholder="Catatan untuk guru atau admin"
                        />
                        <InputError message={errors.notes} />
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/60 shadow-card">
                <CardHeader>
                    <CardTitle>Waktu & Tanggal</CardTitle>
                    <CardDescription>
                        Jadwal pelaksanaan praktikum.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                        <Label htmlFor="tanggal">Tanggal *</Label>
                        <Input
                            id="tanggal"
                            type="date"
                            value={data.tanggal}
                            onChange={(e) =>
                                setData("tanggal", e.target.value)
                            }
                            disabled={processing}
                        />
                        <InputError message={errors.tanggal} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="jam_mulai">Jam Mulai *</Label>
                        <Input
                            id="jam_mulai"
                            type="time"
                            value={data.jam_mulai}
                            onChange={(e) =>
                                setData("jam_mulai", e.target.value)
                            }
                            disabled={processing}
                        />
                        <InputError message={errors.jam_mulai} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="jam_selesai">Jam Selesai *</Label>
                        <Input
                            id="jam_selesai"
                            type="time"
                            value={data.jam_selesai}
                            onChange={(e) =>
                                setData("jam_selesai", e.target.value)
                            }
                            disabled={processing}
                        />
                        <InputError message={errors.jam_selesai} />
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/60 shadow-card">
                <CardHeader>
                    <CardTitle>Kebutuhan Alat (Opsional)</CardTitle>
                    <CardDescription>
                        Alat yang diperlukan untuk jadwal prioritas tinggi /
                        lomba — mendukung reservasi stok.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {equipmentRows.map((row, index) => (
                        <div
                            key={index}
                            className="grid gap-3 rounded-xl border border-border/50 bg-muted/20 p-3 sm:grid-cols-[1fr_120px_40px]"
                        >
                            <div className="space-y-2">
                                <Label>Alat</Label>
                                <Select
                                    value={row.equipment_id}
                                    onChange={(e) =>
                                        updateRow(
                                            index,
                                            "equipment_id",
                                            e.target.value,
                                        )
                                    }
                                    disabled={processing}
                                >
                                    <option value="">Pilih alat</option>
                                    {equipmentOptions.map((opt) => (
                                        <option key={opt.id} value={opt.id}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </Select>
                                <InputError
                                    message={
                                        errors[
                                            `required_equipment.${index}.equipment_id`
                                        ]
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Qty</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={row.quantity}
                                    onChange={(e) =>
                                        updateRow(
                                            index,
                                            "quantity",
                                            e.target.value,
                                        )
                                    }
                                    disabled={processing}
                                />
                            </div>
                            <div className="flex items-end justify-end pb-0.5">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 text-destructive"
                                    onClick={() => removeRow(index)}
                                    disabled={
                                        processing ||
                                        equipmentRows.length === 1
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
                        onClick={addRow}
                        disabled={processing}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah alat
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
