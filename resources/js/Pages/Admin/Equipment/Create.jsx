import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import { Button } from "@/Components/ui/button";
import { Head, Link, useForm } from "@inertiajs/react";
import EquipmentForm from "./Components/EquipmentForm";

export default function Create({ categoryOptions }) {
    const { data, setData, post, processing, errors } = useForm({
        name: "",
        category: "",
        stock: 1,
        available: 1,
        qty_baik: 1,
        qty_rusak_ringan: 0,
        qty_rusak_berat: 0,
        location: "",
        description: "",
        status: "tersedia",
        image: null,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("admin.equipment.store"), { forceFormData: true });
    };

    return (
        <AppLayout>
            <Head title="Tambah Alat" />

            <div className="animate-fade-in">
                <PageHeader
                    title="Tambah Alat"
                    subtitle="Daftarkan alat baru ke inventaris laboratorium."
                />

                <form onSubmit={submit} className="space-y-6">
                    <EquipmentForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        categoryOptions={categoryOptions}
                    />

                    <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-6">
                        <Button variant="outline" asChild disabled={processing}>
                            <Link href={route("admin.equipment.index")}>
                                Batal
                            </Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? "Menyimpan..." : "Simpan Alat"}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
