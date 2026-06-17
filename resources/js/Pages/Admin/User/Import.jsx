import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import InputError from "@/Components/InputError";
import { Button } from "@/Components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import { Head, Link, useForm } from "@inertiajs/react";
import { AlertCircle, ArrowLeft, Download, FileSpreadsheet, Upload } from "lucide-react";

export default function Import({
    classOptions,
    defaultPasswordHint,
    importErrors = {},
    importSummary,
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        file: null,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("admin.users.import.store"), {
            forceFormData: true,
            onSuccess: () => reset("file"),
        });
    };

    const errorEntries = Object.entries(importErrors).filter(
        ([row]) => Number(row) > 0,
    );

    return (
        <AppLayout>
            <Head title="Import Pengguna" />

            <div className="animate-fade-in mx-auto max-w-3xl">
                <PageHeader
                    title="Import Pengguna"
                    subtitle="Unggah file Excel untuk menambahkan banyak pengguna sekaligus."
                >
                    <Button variant="outline" asChild>
                        <Link href={route("admin.users.index")}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Link>
                    </Button>
                </PageHeader>

                {importSummary && (
                    <div
                        className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
                            importSummary.failed > 0
                                ? "border-amber-200 bg-amber-50 text-amber-900"
                                : "border-emerald-200 bg-emerald-50 text-emerald-900"
                        }`}
                    >
                        <p className="font-medium">
                            {importSummary.imported} berhasil, {importSummary.failed}{" "}
                            gagal
                        </p>
                    </div>
                )}

                {errorEntries.length > 0 && (
                    <Card className="mb-6 rounded-2xl border-destructive/30 shadow-card">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base text-destructive">
                                <AlertCircle className="h-4 w-4" />
                                Error per baris
                            </CardTitle>
                            <CardDescription>
                                Perbaiki baris berikut di file Excel lalu unggah ulang.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="max-h-56 space-y-2 overflow-y-auto text-sm">
                                {errorEntries.map(([row, message]) => (
                                    <li
                                        key={row}
                                        className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2"
                                    >
                                        <span className="font-medium">Baris {row}:</span>{" "}
                                        {message}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-6">
                    <Card className="rounded-2xl border-border/60 shadow-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Download className="h-5 w-5 text-primary" />
                                Langkah 1 — Unduh template
                            </CardTitle>
                            <CardDescription>
                                Gunakan template agar kolom sesuai format sistem.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" asChild>
                                <a href={route("admin.users.import.template")}>
                                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                                    Unduh template Excel
                                </a>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-border/60 shadow-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Upload className="h-5 w-5 text-primary" />
                                Langkah 2 — Unggah file
                            </CardTitle>
                            <CardDescription>
                                Format .xlsx, .xls, atau .csv. Maksimal 500 baris per
                                unggahan.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-4">
                                <div className="space-y-2">
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        disabled={processing}
                                        onChange={(e) =>
                                            setData("file", e.target.files[0] ?? null)
                                        }
                                        className="block w-full cursor-pointer rounded-xl border border-border/60 bg-card px-3 py-2 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
                                    />
                                    <InputError message={errors.file} />
                                </div>

                                <Button type="submit" disabled={processing || !data.file}>
                                    {processing ? "Mengimpor..." : "Import Pengguna"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-border/60 shadow-card">
                        <CardHeader>
                            <CardTitle>Petunjuk kolom</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm text-muted-foreground">
                            <div className="overflow-x-auto rounded-xl border border-border/60">
                                <table className="w-full min-w-[520px] text-left text-sm">
                                    <thead className="bg-muted/40 text-foreground">
                                        <tr>
                                            <th className="px-3 py-2 font-medium">Kolom</th>
                                            <th className="px-3 py-2 font-medium">Wajib</th>
                                            <th className="px-3 py-2 font-medium">Keterangan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/60">
                                        <tr>
                                            <td className="px-3 py-2 font-medium text-foreground">nama</td>
                                            <td className="px-3 py-2">Ya</td>
                                            <td className="px-3 py-2">Nama lengkap</td>
                                        </tr>
                                        <tr>
                                            <td className="px-3 py-2 font-medium text-foreground">email</td>
                                            <td className="px-3 py-2">Ya</td>
                                            <td className="px-3 py-2">Email unik untuk login</td>
                                        </tr>
                                        <tr>
                                            <td className="px-3 py-2 font-medium text-foreground">role</td>
                                            <td className="px-3 py-2">Ya</td>
                                            <td className="px-3 py-2">siswa, guru, atau admin</td>
                                        </tr>
                                        <tr>
                                            <td className="px-3 py-2 font-medium text-foreground">status</td>
                                            <td className="px-3 py-2">Tidak</td>
                                            <td className="px-3 py-2">active / inactive (default: active)</td>
                                        </tr>
                                        <tr>
                                            <td className="px-3 py-2 font-medium text-foreground">telepon</td>
                                            <td className="px-3 py-2">Tidak</td>
                                            <td className="px-3 py-2">Nomor telepon</td>
                                        </tr>
                                        <tr>
                                            <td className="px-3 py-2 font-medium text-foreground">nisn</td>
                                            <td className="px-3 py-2">Siswa</td>
                                            <td className="px-3 py-2">Wajib jika role siswa</td>
                                        </tr>
                                        <tr>
                                            <td className="px-3 py-2 font-medium text-foreground">nip</td>
                                            <td className="px-3 py-2">Guru/Admin</td>
                                            <td className="px-3 py-2">Wajib jika role guru atau admin</td>
                                        </tr>
                                        <tr>
                                            <td className="px-3 py-2 font-medium text-foreground">kelas</td>
                                            <td className="px-3 py-2">Siswa</td>
                                            <td className="px-3 py-2">
                                                {classOptions.join(", ")}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="px-3 py-2 font-medium text-foreground">password</td>
                                            <td className="px-3 py-2">Tidak</td>
                                            <td className="px-3 py-2">
                                                Kosongkan untuk auto: NISN (siswa), NIP
                                                (guru/admin), atau default{" "}
                                                <code className="rounded bg-muted px-1">
                                                    {defaultPasswordHint}
                                                </code>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
