import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import { Button } from "@/Components/ui/button";
import { Head, Link, useForm } from "@inertiajs/react";
import SupplyForm from "./Components/SupplyForm";

export default function Create({ categoryOptions, unitOptions }) {
    const { data, setData, post, processing, errors } = useForm({
        name: "",
        category: "",
        stock: 1,
        available: 1,
        unit: "",
        min_stock: "",
        location: "",
        description: "",
        status: "active",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("admin.supplies.store"));
    };

    return (
        <AppLayout>
            <Head title="Tambah Bahan" />

            <div className="animate-fade-in">
                <PageHeader
                    title="Tambah Bahan"
                    subtitle="Daftarkan bahan habis pakai ke inventaris laboratorium."
                />

                <form onSubmit={submit} className="space-y-6">
                    <SupplyForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        categoryOptions={categoryOptions}
                        unitOptions={unitOptions}
                    />

                    <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-6">
                        <Button variant="outline" asChild disabled={processing}>
                            <Link href={route("admin.supplies.index")}>
                                Batal
                            </Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? "Menyimpan..." : "Simpan Bahan"}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
