import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import { Button } from "@/Components/ui/button";
import { Head, Link, useForm } from "@inertiajs/react";
import CollateralForm from "./Components/CollateralForm";

export default function Create({
    loanOptions,
    studentOptions,
    cardTypeOptions,
    statusOptions,
}) {
    const { data, setData, post, processing, errors } = useForm({
        loan_id: "",
        student_id: "",
        card_type: "kartu_pelajar",
        card_number: "",
        status: "dititipkan",
        notes: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("admin.collaterals.store"));
    };

    return (
        <AppLayout>
            <Head title="Tambah Jaminan Kartu" />

            <div className="animate-fade-in">
                <PageHeader
                    title="Tambah Jaminan Kartu"
                    subtitle="Catat penitipan kartu pelajar untuk peminjaman bawa pulang."
                />

                <form onSubmit={submit} className="space-y-6">
                    <CollateralForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        loanOptions={loanOptions}
                        studentOptions={studentOptions}
                        cardTypeOptions={cardTypeOptions}
                        statusOptions={statusOptions}
                    />

                    <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-6">
                        <Button variant="outline" asChild disabled={processing}>
                            <Link href={route("admin.collaterals.index")}>
                                Batal
                            </Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? "Menyimpan..." : "Simpan Jaminan"}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
