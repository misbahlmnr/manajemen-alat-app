import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import { Button } from "@/Components/ui/button";
import { Head, Link, useForm } from "@inertiajs/react";
import UserForm from "./Components/UserForm";

export default function Create({
    classOptions,
    angkatanOptions = [],
    scope = "siswa",
}) {
    const isSiswa = scope === "siswa";
    const { data, setData, post, processing, errors } = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        role: isSiswa ? "siswa" : "guru",
        status: "active",
        phone: "",
        class: "",
        angkatan: "",
        nisn: "",
        nip: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("admin.users.store"));
    };

    const backHref = route("admin.users.index", { scope });

    return (
        <AppLayout>
            <Head title={isSiswa ? "Tambah Siswa" : "Tambah Staf"} />

            <div className="animate-fade-in mx-auto">
                <PageHeader
                    title={isSiswa ? "Tambah Siswa" : "Tambah Staf"}
                    subtitle={
                        isSiswa
                            ? "Buat akun siswa dengan kelas dan angkatan."
                            : "Buat akun Admin Lab atau Guru."
                    }
                />

                <form onSubmit={submit} className="space-y-6">
                    <UserForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        classOptions={classOptions}
                        angkatanOptions={angkatanOptions}
                        scope={scope}
                    />

                    <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-6">
                        <Button variant="outline" asChild disabled={processing}>
                            <Link href={backHref}>Batal</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing
                                ? "Menyimpan..."
                                : isSiswa
                                  ? "Simpan Siswa"
                                  : "Simpan Staf"}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
