import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import { Button } from "@/Components/ui/button";
import { Head, Link, useForm } from "@inertiajs/react";
import UserForm from "./Components/UserForm";

export default function Edit({ user, classOptions }) {
    const { data, setData, put, processing, errors } = useForm({
        name: user.name ?? "",
        username: user.username ?? "",
        email: user.email ?? "",
        password: "",
        password_confirmation: "",
        role: user.role ?? "siswa",
        status: user.status ?? "active",
        phone: user.phone ?? "",
        class: user.class ?? "",
        nisn: user.nisn ?? "",
        nip: user.nip ?? "",
    });

    const submit = (e) => {
        e.preventDefault();
        put(route("admin.users.update", user.id));
    };

    return (
        <AppLayout>
            <Head title={`Edit ${user.name}`} />

            <div className="animate-fade-in mx-auto">
                <PageHeader title="Edit Pengguna" subtitle={user.email} />

                <form onSubmit={submit} className="space-y-6">
                    <UserForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        classOptions={classOptions}
                        isEdit
                    />

                    <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-6">
                        <Button variant="outline" asChild disabled={processing}>
                            <Link href={route("admin.users.show", user.id)}>
                                Batal
                            </Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? "Menyimpan..." : "Simpan Perubahan"}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
