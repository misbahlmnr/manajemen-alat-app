import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import { Button } from "@/Components/ui/button";
import { Head, Link, useForm } from "@inertiajs/react";
import EquipmentForm from "./Components/EquipmentForm";

export default function Edit({ equipment, categoryOptions }) {
    const { data, setData, put, processing, errors } = useForm({
        name: equipment.name ?? "",
        category: equipment.category ?? "",
        stock: equipment.stock ?? 1,
        available: equipment.available ?? 0,
        condition: equipment.condition ?? "baik",
        location: equipment.location ?? "",
        description: equipment.description ?? "",
        status: equipment.status ?? "active",
    });

    const submit = (e) => {
        e.preventDefault();
        put(route("admin.equipment.update", equipment.id));
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
