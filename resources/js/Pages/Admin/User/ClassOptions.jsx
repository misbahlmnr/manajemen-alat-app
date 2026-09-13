import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import InputError from "@/Components/InputError";
import { AlertDialog } from "@/Components/ui/alert-dialog";
import { Button } from "@/Components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import { Input } from "@/Components/ui/input";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { ArrowLeft, CalendarDays, GraduationCap, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export default function ClassOptions({ options = [], angkatanOptions = [] }) {
    const classForm = useForm({ name: "" });
    const angkatanForm = useForm({ angkatan: "" });
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const submitClass = (e) => {
        e.preventDefault();
        classForm.post(route("admin.users.class-options.store"), {
            preserveScroll: true,
            onSuccess: () => classForm.reset("name"),
        });
    };

    const submitAngkatan = (e) => {
        e.preventDefault();
        angkatanForm.post(route("admin.users.class-options.angkatan.store"), {
            preserveScroll: true,
            onSuccess: () => angkatanForm.reset("angkatan"),
        });
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        const href =
            deleteTarget.type === "angkatan"
                ? route(
                      "admin.users.class-options.angkatan.destroy",
                      deleteTarget.id,
                  )
                : route("admin.users.class-options.destroy", deleteTarget.id);

        router.delete(href, {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    return (
        <AppLayout>
            <Head title="Opsi kelas & angkatan" />

            <div className="animate-fade-in mx-auto max-w-3xl">
                <PageHeader
                    title="Opsi kelas & angkatan"
                    subtitle="Daftar pilihan rombel dan tahun masuk untuk form siswa, import, dan filter."
                >
                    <Button variant="outline" asChild>
                        <Link
                            href={route("admin.users.index", {
                                scope: "siswa",
                            })}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Link>
                    </Button>
                </PageHeader>

                <OptionSection
                    title="Tambah kelas"
                    description="Contoh: XI TAV 4. Muncul di form siswa dan jadwal."
                    icon={GraduationCap}
                    listTitle="Daftar rombel"
                    listDescription="Hapus hanya jika tidak dipakai siswa atau jadwal."
                    emptyText="Belum ada opsi kelas."
                    inUseText="Dipakai siswa atau jadwal"
                    placeholder="Nama kelas"
                    value={classForm.data.name}
                    onChange={(value) => classForm.setData("name", value)}
                    error={classForm.errors.name}
                    processing={classForm.processing}
                    onSubmit={submitClass}
                    options={options}
                    onDelete={(option) =>
                        setDeleteTarget({ ...option, type: "class" })
                    }
                />

                <OptionSection
                    title="Tambah angkatan"
                    description="Contoh: 2026/2027. Tahun masuk siswa, tidak berubah saat naik kelas."
                    icon={CalendarDays}
                    listTitle="Daftar angkatan"
                    listDescription="Hapus hanya jika tidak dipakai siswa. Import Excel yang berisi tahun baru juga menambah opsi ini."
                    emptyText="Belum ada opsi angkatan."
                    inUseText="Dipakai siswa"
                    placeholder="2026/2027"
                    value={angkatanForm.data.angkatan}
                    onChange={(value) =>
                        angkatanForm.setData("angkatan", value)
                    }
                    error={angkatanForm.errors.angkatan}
                    processing={angkatanForm.processing}
                    onSubmit={submitAngkatan}
                    options={angkatanOptions}
                    onDelete={(option) =>
                        setDeleteTarget({ ...option, type: "angkatan" })
                    }
                />
            </div>

            <AlertDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title={
                    deleteTarget?.type === "angkatan"
                        ? "Hapus opsi angkatan?"
                        : "Hapus opsi kelas?"
                }
                description={
                    <>
                        Hapus{" "}
                        <strong className="text-foreground">
                            {deleteTarget?.name}
                        </strong>{" "}
                        dari daftar pilihan? Data siswa dan arsip peminjaman
                        tidak ikut terhapus.
                    </>
                }
                confirmLabel="Hapus"
                variant="destructive"
                loading={deleting}
                onConfirm={handleDelete}
            />
        </AppLayout>
    );
}

function OptionSection({
    title,
    description,
    icon: Icon,
    listTitle,
    listDescription,
    emptyText,
    inUseText,
    placeholder,
    value,
    onChange,
    error,
    processing,
    onSubmit,
    options,
    onDelete,
}) {
    return (
        <div className="mb-6 space-y-6">
            <Card className="rounded-[10px] border-border/60 shadow-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Plus className="h-4 w-4" />
                        {title}
                    </CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={onSubmit}
                        className="flex flex-col gap-3 sm:flex-row sm:items-start"
                    >
                        <div className="min-w-0 flex-1">
                            <Input
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                placeholder={placeholder}
                                maxLength={50}
                            />
                            <InputError message={error} className="mt-1" />
                        </div>
                        <Button type="submit" disabled={processing}>
                            Tambah
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="rounded-[10px] border-border/60 shadow-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Icon className="h-4 w-4" />
                        {listTitle}
                    </CardTitle>
                    <CardDescription>{listDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                    {options.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                            {emptyText}
                        </p>
                    ) : (
                        <ul className="divide-y divide-border rounded-[8px] border border-border/50">
                            {options.map((option) => (
                                <li
                                    key={option.id}
                                    className="flex items-center justify-between gap-3 px-4 py-3"
                                >
                                    <div>
                                        <p className="text-sm font-medium">
                                            {option.name}
                                        </p>
                                        {option.in_use ? (
                                            <p className="text-xs text-muted-foreground">
                                                {inUseText}
                                            </p>
                                        ) : null}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={option.in_use}
                                        className="text-destructive hover:bg-destructive/10"
                                        onClick={() => onDelete(option)}
                                    >
                                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                        Hapus
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
