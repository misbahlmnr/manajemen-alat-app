import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import { Button } from "@/Components/ui/button";
import { Head, Link, useForm } from "@inertiajs/react";
import SupplyForm from "./Components/SupplyForm";

export default function Edit({ supply, categoryOptions, unitOptions }) {
    const { data, setData, post, processing, errors } = useForm({
        name: supply.name,
        category: supply.category,
        stock: supply.stock,
        available: supply.available,
        unit: supply.unit ?? "",
        min_stock: supply.min_stock ?? "",
        location: supply.location ?? "",
        description: supply.description ?? "",
        status: supply.status,
        image: null,
        _method: "put",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("admin.supplies.update", supply.id), {
            forceFormData: true,
        });
    };

    return (
        <AppLayout>
            <Head title={`Edit ${supply.name}`} />

            <div className="animate-fade-in">
                <PageHeader
                    title="Edit Bahan"
                    subtitle={supply.code}
                />

                <form onSubmit={submit} className="space-y-6">
                    <SupplyForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        categoryOptions={categoryOptions}
                        unitOptions={unitOptions}
                        existingImageUrl={supply.image_url}
                    />

                    <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-6">
                        <Button variant="outline" asChild disabled={processing}>
                            <Link href={route("admin.supplies.show", supply.id)}>
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
