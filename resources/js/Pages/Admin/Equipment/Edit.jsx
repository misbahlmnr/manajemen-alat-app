import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import { Button } from "@/Components/ui/button";
import { Head, Link, useForm } from "@inertiajs/react";
import EquipmentForm from "./Components/EquipmentForm";

export default function Edit({ equipment, categoryOptions }) {
    const { data, setData, post, processing, errors } = useForm({
        name: equipment.name ?? "",
        category: equipment.category ?? "",
        stock: equipment.stock ?? 1,
        available: equipment.available ?? 0,
        qty_baik: equipment.qty_baik ?? equipment.stock ?? 1,
        qty_rusak_ringan: equipment.qty_rusak_ringan ?? 0,
        qty_rusak_berat: equipment.qty_rusak_berat ?? 0,
        location: equipment.location ?? "",
        description: equipment.description ?? "",
        status: equipment.status ?? "tersedia",
        image: null,
        _method: "put",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("admin.equipment.update", equipment.id), {
            forceFormData: true,
        });
    };

    return (
        <AppLayout>
            <Head title={`Edit ${equipment.name}`} />

            <div className="animate-fade-in">
                <PageHeader title="Edit Alat" subtitle={equipment.code} />

                <form onSubmit={submit} className="space-y-6">
                    <EquipmentForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        categoryOptions={categoryOptions}
                        existingImageUrl={equipment.image_url}
                    />

                    <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-6">
                        <Button variant="outline" asChild disabled={processing}>
                            <Link
                                href={route(
                                    "admin.equipment.show",
                                    equipment.id,
                                )}
                            >
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
