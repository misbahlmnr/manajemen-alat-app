import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import AvatarInitials from "@/Components/AvatarInitials";
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
import InputError from "@/Components/InputError";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import { ArrowLeft, KeyRound, Mail, Pencil, Phone, User } from "lucide-react";
import { useState } from "react";
import RoleBadge from "./Components/RoleBadge";
import UserStatusBadge from "./Components/UserStatusBadge";
import DeleteUserDialog from "./Components/DeleteUserDialog";

export default function Show({ user }) {
    const authUser = usePage().props.auth?.user;
    const [resetOpen, setResetOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const {
        data: passwordData,
        setData: setPasswordData,
        post: postPassword,
        processing: resetting,
        errors: passwordErrors,
        reset: resetPasswordForm,
    } = useForm({
        password: "",
        password_confirmation: "",
    });

    const canDelete = authUser?.id !== user.id;

    const handleResetPassword = () => {
        postPassword(route("admin.users.reset-password", user.id), {
            preserveScroll: true,
            onSuccess: () => {
                setResetOpen(false);
                resetPasswordForm();
            },
        });
    };

    const handleDelete = () => {
        setDeleting(true);
        router.delete(route("admin.users.destroy", user.id), {
            onFinish: () => setDeleting(false),
        });
    };

    return (
        <AppLayout>
            <Head title={user.name} />

            <div className="animate-fade-in mx-auto">
                <div className="mb-6">
                    <Button variant="ghost" size="sm" asChild className="-ml-2">
                        <Link href={route("admin.users.index")}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Link>
                    </Button>
                </div>

                <PageHeader title="Detail Pengguna" subtitle={user.email}>
                    <Button variant="outline" asChild>
                        <Link href={route("admin.users.edit", user.id)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setResetOpen(true)}
                    >
                        <KeyRound className="mr-2 h-4 w-4" />
                        Reset Password
                    </Button>
                    {canDelete && (
                        <Button
                            variant="destructive"
                            onClick={() => setDeleteOpen(true)}
                        >
                            Hapus
                        </Button>
                    )}
                </PageHeader>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="rounded-2xl border-border/60 shadow-card lg:col-span-1">
                        <CardContent className="flex flex-col items-center pt-8 text-center">
                            <AvatarInitials name={user.name} size="xl" />
                            <h2 className="mt-4 font-display text-xl font-bold">
                                {user.name}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                @{user.username}
                            </p>
                            <div className="mt-4 flex flex-wrap justify-center gap-2">
                                <RoleBadge role={user.role} />
                                <UserStatusBadge status={user.status} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-border/60 shadow-card lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Informasi Akun</CardTitle>
                            <CardDescription>
                                Metadata dan kontak pengguna
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <InfoItem
                                icon={Mail}
                                label="Email"
                                value={user.email}
                            />
                            <InfoItem
                                icon={Phone}
                                label="Telepon"
                                value={user.phone || "—"}
                            />
                            <InfoItem
                                icon={User}
                                label={user.role === "siswa" ? "NISN" : "NIP"}
                                value={user.identifier_label || "—"}
                            />
                            {user.role === "siswa" && (
                                <InfoItem
                                    label="Kelas"
                                    value={user.class || "—"}
                                />
                            )}
                            <InfoItem
                                label="Terdaftar"
                                value={user.created_at_formatted}
                            />
                            <InfoItem
                                label="Terakhir diperbarui"
                                value={user.updated_at_formatted}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>

            {resetOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button
                        type="button"
                        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
                        onClick={() => !resetting && setResetOpen(false)}
                    />
                    <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-floating">
                        <h3 className="text-lg font-semibold">
                            Reset kata sandi
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Kata sandi baru untuk {user.name}
                        </p>
                        <div className="mt-4 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="new_password">
                                    Kata sandi baru
                                </Label>
                                <Input
                                    id="new_password"
                                    type="password"
                                    value={passwordData.password}
                                    onChange={(e) =>
                                        setPasswordData(
                                            "password",
                                            e.target.value,
                                        )
                                    }
                                    disabled={resetting}
                                />
                                <InputError message={passwordErrors.password} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new_password_confirmation">
                                    Konfirmasi
                                </Label>
                                <Input
                                    id="new_password_confirmation"
                                    type="password"
                                    value={passwordData.password_confirmation}
                                    onChange={(e) =>
                                        setPasswordData(
                                            "password_confirmation",
                                            e.target.value,
                                        )
                                    }
                                    disabled={resetting}
                                />
                                <InputError
                                    message={
                                        passwordErrors.password_confirmation
                                    }
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-2">
                            <Button
                                variant="outline"
                                disabled={resetting}
                                onClick={() => setResetOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                disabled={resetting}
                                onClick={handleResetPassword}
                            >
                                {resetting ? "Menyimpan..." : "Reset"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <DeleteUserDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                userName={user.name}
                onConfirm={handleDelete}
                loading={deleting}
            />
        </AppLayout>
    );
}

function InfoItem({ icon: Icon, label, value }) {
    return (
        <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {label}
            </div>
            <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
        </div>
    );
}
