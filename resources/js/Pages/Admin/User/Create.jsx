import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import { Button } from "@/Components/ui/button";
import { Head, Link, useForm } from "@inertiajs/react";
import UserForm from "./Components/UserForm";

export default function Create({ classOptions }) {
    const { data, setData, post, processing, errors } = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        role: "siswa",
        status: "active",
        phone: "",
        class: "",
        nisn: "",
        nip: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("admin.users.store"));
    };

    return (
        <AppLayout>
            <Head title="Tambah Pengguna" />

            <div className="animate-fade-in mx-auto">
                <PageHeader
                    title="Tambah Pengguna"
                    subtitle="Buat akun baru untuk admin, guru, atau siswa."
                />

                <form onSubmit={submit} className="space-y-6">
                    <UserForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        classOptions={classOptions}
                    />

                    <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-6">
                        <Button variant="outline" asChild disabled={processing}>
                            <Link href={route("admin.users.index")}>Batal</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? "Menyimpan..." : "Simpan Pengguna"}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
