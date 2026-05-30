import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import { Button } from "@/Components/ui/button";
import { Head, Link, useForm } from "@inertiajs/react";
import CollateralForm from "./Components/CollateralForm";

export default function Edit({
    collateral,
    cardTypeOptions,
    statusOptions,
}) {
    const { data, setData, put, processing, errors } = useForm({
        card_type: collateral.card_type,
        card_number: collateral.card_number ?? "",
        status: collateral.status,
        notes: collateral.notes ?? "",
    });

    const submit = (e) => {
        e.preventDefault();
        put(route("admin.collaterals.update", collateral.id));
    };

    return (
        <AppLayout>
            <Head title={`Edit ${collateral.code}`} />

            <div className="animate-fade-in">
                <PageHeader title="Edit Jaminan" subtitle={collateral.code} />

                <form onSubmit={submit} className="space-y-6">
                    <CollateralForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        cardTypeOptions={cardTypeOptions}
                        statusOptions={statusOptions}
                        isEdit
                    />

                    <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-6">
                        <Button variant="outline" asChild disabled={processing}>
                            <Link
                                href={route(
                                    "admin.collaterals.show",
                                    collateral.id,
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
