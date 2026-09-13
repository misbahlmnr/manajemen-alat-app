import AppLayout from "@/Layouts/AppLayout";
import { Head, usePage } from "@inertiajs/react";
import UpdatePasswordForm from "./Partials/UpdatePasswordForm";
import UpdateProfileInformationForm from "./Partials/UpdateProfileInformationForm";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";

export default function Edit({ mustVerifyEmail, status }) {
    const user = usePage().props.auth?.user;
    const isSiswa = user?.role === "siswa";

    return (
        <AppLayout>
            <Head title="Profil" />

            <div className="page-header">
                <div>
                    <h1 className="section-title">Profil</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {isSiswa
                            ? "Lihat data akun dan ganti kata sandi"
                            : "Kelola informasi akun dan keamanan"}
                    </p>
                </div>
            </div>

            <div className="mx-auto max-w-3xl space-y-6">
                <Card className="shadow-card border-border/50">
                    <CardHeader>
                        <CardTitle>Informasi akun</CardTitle>
                        <CardDescription>
                            {isSiswa
                                ? "Data siswa diubah oleh admin lab."
                                : "Perbarui nama dan alamat email akun Anda"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isSiswa ? (
                            <StudentIdentity user={user} />
                        ) : (
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                                className="max-w-xl"
                            />
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-card border-border/50">
                    <CardHeader>
                        <CardTitle>Kata sandi</CardTitle>
                        <CardDescription>
                            Ganti kata sandi jika masih ingat yang lama. Jika
                            lupa, hubungi admin lab.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <UpdatePasswordForm className="max-w-xl" />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function StudentIdentity({ user }) {
    const fields = [
        ["Nama", user?.name],
        ["Username", user?.username],
        ["Email", user?.email],
        ["NISN", user?.nisn],
        ["Kelas", user?.class],
        ["Angkatan", user?.angkatan],
    ];

    return (
        <dl className="grid gap-4 sm:grid-cols-2">
            {fields.map(([label, value]) => (
                <div
                    key={label}
                    className="rounded-lg border bg-muted/50 p-4"
                >
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {label}
                    </dt>
                    <dd className="mt-2 text-sm font-medium text-foreground">
                        {value || "—"}
                    </dd>
                </div>
            ))}
        </dl>
    );
}
