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
import { Button } from "@/Components/ui/button";
import LombaParticipantsCombobox from "./LombaParticipantsCombobox";

export default function ScheduleForm({
    data,
    setData,
    errors,
    processing,
    guruOptions = [],
    siswaOptions = [],
    equipmentOptions = [],
    kelasOptions = [],
    subjectOptions = [],
    dayOptions = {},
    typeOptions = {},
    kindOptions = {},
    labRoomOptions = [],
}) {
    const isLomba = data.schedule_kind === "lomba";
    const isMingguan = !isLomba && data.type === "mingguan";

    const handleKindChange = (kind) => {
        if (kind === "lomba") {
            setData({
                ...data,
                schedule_kind: kind,
                type: "khusus",
                hari: "",
                priority: "lomba",
                ruangan: "",
                mata_kuliah: data.mata_kuliah || data.title || "Lomba",
                items: data.items?.length ? data.items : [],
                participant_ids: data.participant_ids ?? [],
            });
            return;
        }

        setData({
            ...data,
            schedule_kind: kind,
            type: data.type || "mingguan",
            priority: "normal",
            penanggung_jawab_id: "",
            participant_ids: [],
            items: [],
        });
    };

    const handleTypeChange = (type) => {
        if (type === "mingguan") {
            setData({
                ...data,
                type,
                hari: data.hari || "senin",
                tanggal: "",
                priority: "normal",
            });
            return;
        }

        setData({
            ...data,
            type,
            hari: "",
            priority: "normal",
        });
    };

    const handleParticipantsChange = ({
        participant_ids,
        penanggung_jawab_id,
    }) => {
        setData({
            ...data,
            participant_ids,
            penanggung_jawab_id: penanggung_jawab_id
                ? String(penanggung_jawab_id)
                : "",
        });
    };

    const addEquipmentRow = () => {
        setData("items", [
            ...(data.items ?? []),
            { equipment_id: "", quantity: 1 },
        ]);
    };

    const updateItem = (index, field, value) => {
        const next = [...(data.items ?? [])];
        next[index] = { ...next[index], [field]: value };
        setData("items", next);
    };

    const removeItem = (index) => {
        setData(
            "items",
            (data.items ?? []).filter((_, i) => i !== index),
        );
    };

    return (
        <div className="grid gap-6">
            <Card className="rounded-[10px] border-border/60 shadow-card">
                <CardHeader>
                    <CardTitle>
                        {isLomba ? "Informasi Event" : "Informasi Jadwal"}
                    </CardTitle>
                    <CardDescription>
                        {isLomba
                            ? "Event lomba dengan ketua tim sebagai peminjam alat."
                            : "Jadwal praktik lab rutin atau khusus."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="schedule_kind">Jenis Kegiatan *</Label>
                        <Select
                            id="schedule_kind"
                            value={data.schedule_kind || "praktikum"}
                            onChange={(e) => handleKindChange(e.target.value)}
                            disabled={processing}
                        >
                            {Object.entries(kindOptions).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </Select>
                        <InputError message={errors.schedule_kind} />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="title">
                            {isLomba ? "Nama Event *" : "Judul Jadwal *"}
                        </Label>
                        <Input
                            id="title"
                            value={data.title}
                            onChange={(e) => setData("title", e.target.value)}
                            placeholder={
                                isLomba
                                    ? "Contoh: Lomba Robotik Tingkat Kota"
                                    : "Contoh: Praktik Shooting Video Dokumenter"
                            }
                            disabled={processing}
                        />
                        <InputError message={errors.title} />
                    </div>

                    {!isLomba && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="type">Jenis Jadwal *</Label>
                                <Select
                                    id="type"
                                    value={data.type}
                                    onChange={(e) =>
                                        handleTypeChange(e.target.value)
                                    }
                                    disabled={processing}
                                >
                                    {Object.entries(typeOptions).map(
                                        ([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        ),
                                    )}
                                </Select>
                                <InputError message={errors.type} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="mata_kuliah">
                                    Mata Pelajaran *
                                </Label>
                                <Select
                                    id="mata_kuliah"
                                    value={data.mata_kuliah}
                                    onChange={(e) =>
                                        setData("mata_kuliah", e.target.value)
                                    }
                                    disabled={processing}
                                >
                                    <option value="">
                                        Pilih mata pelajaran
                                    </option>
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
                                    onChange={(e) =>
                                        setData("kelas", e.target.value)
                                    }
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
                        </>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="guru_id">
                            {isLomba ? "Guru Pendamping *" : "Guru Pengampu *"}
                        </Label>
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

                    {!isLomba && (
                        <div className="space-y-2">
                            <Label htmlFor="ruangan">Ruang / Lab</Label>
                            <Select
                                id="ruangan"
                                value={data.ruangan ?? ""}
                                onChange={(e) =>
                                    setData("ruangan", e.target.value)
                                }
                                disabled={processing}
                            >
                                <option value="">Pilih ruang/lab</option>
                                {[
                                    ...labRoomOptions,
                                    ...(data.ruangan &&
                                    !labRoomOptions.includes(data.ruangan)
                                        ? [data.ruangan]
                                        : []),
                                ].map((room) => (
                                    <option key={room} value={room}>
                                        {room}
                                    </option>
                                ))}
                            </Select>
                            <InputError message={errors.ruangan} />
                        </div>
                    )}

                    {isLomba ? (
                        <>
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
                                <Label htmlFor="jam_selesai">
                                    Jam Selesai *
                                </Label>
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
                        </>
                    ) : null}
                </CardContent>
            </Card>

            {!isLomba && (
                <Card className="rounded-[10px] border-border/60 shadow-card">
                    <CardHeader>
                        <CardTitle>Waktu Pelaksanaan</CardTitle>
                        <CardDescription>
                            {isMingguan
                                ? "Pilih hari dan jam — jadwal ini berlaku setiap minggu."
                                : "Pilih tanggal spesifik untuk acara."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-3">
                        {isMingguan ? (
                            <div className="space-y-2">
                                <Label htmlFor="hari">Hari *</Label>
                                <Select
                                    id="hari"
                                    value={data.hari}
                                    onChange={(e) =>
                                        setData("hari", e.target.value)
                                    }
                                    disabled={processing}
                                >
                                    <option value="">Pilih hari</option>
                                    {Object.entries(dayOptions).map(
                                        ([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        ),
                                    )}
                                </Select>
                                <InputError message={errors.hari} />
                            </div>
                        ) : (
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
                        )}

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
            )}

            {isLomba && (
                <>
                    <Card className="rounded-[10px] border-border/60 shadow-card">
                        <CardHeader>
                            <CardTitle>Peserta Lomba *</CardTitle>
                            <CardDescription>
                                Peserta digunakan untuk informasi dan notifikasi.
                                Ketua Tim bertanggung jawab atas peminjaman dan
                                pengembalian alat.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <LombaParticipantsCombobox
                                options={siswaOptions}
                                selectedIds={data.participant_ids ?? []}
                                ketuaId={data.penanggung_jawab_id}
                                onChange={handleParticipantsChange}
                                disabled={processing}
                            />
                            <InputError message={errors.participant_ids} />
                            <InputError
                                message={errors.penanggung_jawab_id}
                            />
                        </CardContent>
                    </Card>

                    <Card className="rounded-[10px] border-border/60 shadow-card">
                        <CardHeader>
                            <CardTitle>Daftar Alat *</CardTitle>
                            <CardDescription>
                                Alat dialokasikan untuk event; loan dibuat atas
                                nama Ketua Tim.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {(data.items ?? []).map((row, index) => (
                                <div
                                    key={index}
                                    className="grid gap-2 sm:grid-cols-[1fr_100px_auto]"
                                >
                                    <Select
                                        value={String(row.equipment_id || "")}
                                        onChange={(e) =>
                                            updateItem(
                                                index,
                                                "equipment_id",
                                                e.target.value,
                                            )
                                        }
                                        disabled={processing}
                                    >
                                        <option value="">Pilih alat</option>
                                        {equipmentOptions.map((item) => (
                                            <option
                                                key={item.id}
                                                value={item.id}
                                            >
                                                {item.label}
                                            </option>
                                        ))}
                                    </Select>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={row.quantity ?? 1}
                                        onChange={(e) =>
                                            updateItem(
                                                index,
                                                "quantity",
                                                e.target.value,
                                            )
                                        }
                                        disabled={processing}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => removeItem(index)}
                                        disabled={processing}
                                    >
                                        Hapus
                                    </Button>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={addEquipmentRow}
                                disabled={processing}
                            >
                                Tambah alat
                            </Button>
                            <InputError message={errors.items} />
                        </CardContent>
                    </Card>
                </>
            )}

            <Card className="rounded-[10px] border-border/60 shadow-card">
                <CardHeader>
                    <CardTitle>Catatan</CardTitle>
                </CardHeader>
                <CardContent>
                    <textarea
                        id="notes"
                        rows={3}
                        value={data.notes ?? ""}
                        onChange={(e) => setData("notes", e.target.value)}
                        disabled={processing}
                        className="flex w-full rounded-[8px] border border-[#E5E7EB] bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                        placeholder="Catatan untuk guru atau admin"
                    />
                    <InputError message={errors.notes} />
                </CardContent>
            </Card>
        </div>
    );
}
