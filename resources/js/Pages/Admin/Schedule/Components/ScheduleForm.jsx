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

export default function ScheduleForm({
    data,
    setData,
    errors,
    processing,
    guruOptions = [],
    kelasOptions = [],
    subjectOptions = [],
    dayOptions = {},
    typeOptions = {},
}) {
    const isMingguan = data.type === "mingguan";
    const isKhusus = data.type === "khusus";

    const handleTypeChange = (type) => {
        if (type === "mingguan") {
            setData({
                ...data,
                type,
                hari: data.hari || "senin",
                tanggal: "",
                priority: data.priority === "lomba" ? "normal" : data.priority,
            });
            return;
        }

        setData({
            ...data,
            type,
            hari: "",
            priority: "lomba",
        });
    };

    return (
        <div className="grid gap-6">
            <Card className="rounded-2xl border-border/60 shadow-card">
                <CardHeader>
                    <CardTitle>Informasi Jadwal</CardTitle>
                    <CardDescription>
                        Jadwal mingguan berulang untuk praktikum rutin, atau
                        acara khusus seperti lomba.
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
                        <Label htmlFor="type">Jenis Jadwal *</Label>
                        <Select
                            id="type"
                            value={data.type}
                            onChange={(e) => handleTypeChange(e.target.value)}
                            disabled={processing}
                        >
                            {Object.entries(typeOptions).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </Select>
                        <InputError message={errors.type} />
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
                            disabled={processing || isKhusus}
                        >
                            <option value="normal">Normal</option>
                            <option value="tinggi">Tinggi</option>
                            <option value="lomba">Lomba</option>
                        </Select>
                        {isKhusus && (
                            <p className="text-xs text-muted-foreground">
                                Acara khusus otomatis menggunakan prioritas
                                lomba.
                            </p>
                        )}
                        <InputError message={errors.priority} />
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
                    <CardTitle>Waktu Pelaksanaan</CardTitle>
                    <CardDescription>
                        {isMingguan
                            ? "Pilih hari dan jam — jadwal ini berlaku setiap minggu."
                            : "Pilih tanggal spesifik untuk acara khusus."}
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
        </div>
    );
}
