import AppLayout from "@/Layouts/AppLayout";
import { Head } from "@inertiajs/react";
import DeleteUserForm from "./Partials/DeleteUserForm";
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
    return (
        <AppLayout>
            <Head title="Profil" />

            <div className="page-header">
                <div>
                    <h1 className="section-title">Profil</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Kelola informasi akun dan keamanan
                    </p>
                </div>
            </div>

            <div className="mx-auto max-w-3xl space-y-6">
                <Card className="shadow-card border-border/50">
                    <CardHeader>
                        <CardTitle>Informasi Profil</CardTitle>
                        <CardDescription>
                            Perbarui nama dan alamat email akun Anda
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </CardContent>
                </Card>

                <Card className="shadow-card border-border/50">
                    <CardHeader>
                        <CardTitle>Kata Sandi</CardTitle>
                        <CardDescription>
                            Pastikan akun menggunakan kata sandi yang kuat
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <UpdatePasswordForm className="max-w-xl" />
                    </CardContent>
                </Card>

                <Card className="shadow-card border-destructive/30">
                    <CardHeader>
                        <CardTitle className="text-destructive">
                            Hapus Akun
                        </CardTitle>
                        <CardDescription>
                            Tindakan ini tidak dapat dibatalkan
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DeleteUserForm className="max-w-xl" />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
