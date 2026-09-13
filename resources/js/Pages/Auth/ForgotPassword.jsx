import GuestLayout from "@/Layouts/GuestLayout";
import { Button } from "@/Components/ui/button";
import { Head, Link } from "@inertiajs/react";

export default function ForgotPassword() {
    return (
        <GuestLayout>
            <Head title="Lupa kata sandi" />

            <h1 className="text-lg font-semibold text-foreground">
                Lupa kata sandi?
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Reset tidak dikirim lewat email. Hubungi admin lab agar kata
                sandi akun Anda direset dari menu Pengguna: buka detail akun,
                lalu pilih Reset Password.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Jika masih ingat kata sandi lama, masuk dulu lalu ganti di
                Profil.
            </p>

            <Button asChild className="mt-6 w-full">
                <Link href={route("login")}>Kembali ke login</Link>
            </Button>
        </GuestLayout>
    );
}
