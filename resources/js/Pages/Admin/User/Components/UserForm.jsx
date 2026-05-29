import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Select } from "@/Components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import InputError from "@/Components/InputError";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function UserForm({
    data,
    setData,
    errors,
    processing,
    classOptions = [],
    isEdit = false,
}) {
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl border-border/60 shadow-card lg:col-span-2">
                <CardHeader>
                    <CardTitle>Informasi Akun</CardTitle>
                    <CardDescription>
                        Data dasar pengguna untuk login dan identitas.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="name">Nama Lengkap *</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            placeholder="Nama lengkap"
                            disabled={processing}
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData("email", e.target.value)}
                            placeholder="email@smkn7bekasi.sch.id"
                            disabled={processing}
                        />
                        <InputError message={errors.email} />
                    </div>

                    {isEdit && (
                        <div className="space-y-2">
                            <Label htmlFor="username">Username *</Label>
                            <Input
                                id="username"
                                value={data.username}
                                onChange={(e) => setData("username", e.target.value)}
                                disabled={processing}
                            />
                            <InputError message={errors.username} />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="phone">No. Telepon</Label>
                        <Input
                            id="phone"
                            value={data.phone ?? ""}
                            onChange={(e) => setData("phone", e.target.value)}
                            placeholder="081234567890"
                            disabled={processing}
                        />
                        <InputError message={errors.phone} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Role *</Label>
                        <Select
                            id="role"
                            value={data.role}
                            onChange={(e) => setData("role", e.target.value)}
                            disabled={processing}
                        >
                            <option value="siswa">Siswa</option>
                            <option value="guru">Guru</option>
                            <option value="admin">Admin</option>
                        </Select>
                        <InputError message={errors.role} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Status *</Label>
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
                </CardContent>
            </Card>

            {data.role === "siswa" && (
                <Card className="rounded-2xl border-border/60 shadow-card">
                    <CardHeader>
                        <CardTitle>Data Siswa</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="nisn">NISN *</Label>
                            <Input
                                id="nisn"
                                value={data.nisn ?? ""}
                                onChange={(e) => setData("nisn", e.target.value)}
                                placeholder="0051234567"
                                disabled={processing}
                            />
                            <InputError message={errors.nisn} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="class">Kelas *</Label>
                            <Select
                                id="class"
                                value={data.class ?? ""}
                                onChange={(e) => setData("class", e.target.value)}
                                disabled={processing}
                            >
                                <option value="">Pilih kelas</option>
                                {classOptions.map((cls) => (
                                    <option key={cls} value={cls}>
                                        {cls}
                                    </option>
                                ))}
                            </Select>
                            <InputError message={errors.class} />
                        </div>
                    </CardContent>
                </Card>
            )}

            {(data.role === "guru" || data.role === "admin") && (
                <Card className="rounded-2xl border-border/60 shadow-card">
                    <CardHeader>
                        <CardTitle>
                            Data {data.role === "admin" ? "Admin" : "Guru"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="nip">NIP *</Label>
                            <Input
                                id="nip"
                                value={data.nip ?? ""}
                                onChange={(e) => setData("nip", e.target.value)}
                                placeholder="198501152010011001"
                                disabled={processing}
                            />
                            <InputError message={errors.nip} />
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="rounded-2xl border-border/60 shadow-card lg:col-span-2">
                <CardHeader>
                    <CardTitle>Kata Sandi</CardTitle>
                    <CardDescription>
                        {isEdit
                            ? "Kosongkan jika tidak ingin mengubah kata sandi."
                            : "Kata sandi wajib diisi untuk pengguna baru."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="password">
                            Kata Sandi {isEdit ? "" : "*"}
                        </Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={data.password ?? ""}
                                onChange={(e) => setData("password", e.target.value)}
                                disabled={processing}
                                className="pr-10"
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                onClick={() => setShowPassword((v) => !v)}
                                tabIndex={-1}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                        <InputError message={errors.password} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password_confirmation">
                            Konfirmasi Kata Sandi {isEdit ? "" : "*"}
                        </Label>
                        <div className="relative">
                            <Input
                                id="password_confirmation"
                                type={showPasswordConfirm ? "text" : "password"}
                                value={data.password_confirmation ?? ""}
                                onChange={(e) =>
                                    setData("password_confirmation", e.target.value)
                                }
                                disabled={processing}
                                className="pr-10"
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                onClick={() => setShowPasswordConfirm((v) => !v)}
                                tabIndex={-1}
                            >
                                {showPasswordConfirm ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                        <InputError message={errors.password_confirmation} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
