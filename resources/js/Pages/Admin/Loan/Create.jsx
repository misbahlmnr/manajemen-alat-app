import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import { Button } from "@/Components/ui/button";
import { Head, Link, useForm } from "@inertiajs/react";
import LoanForm from "./Components/LoanForm";

export default function Create({
    borrowerOptions,
    supervisorOptions,
    scheduleOptions,
    equipmentOptionsAlat,
    equipmentOptionsBahan,
}) {
    const today = new Date().toISOString().slice(0, 10);
    const defaultDue = new Date();
    defaultDue.setDate(defaultDue.getDate() + 3);
    const dueDefault = defaultDue.toISOString().slice(0, 16);

    const { data, setData, post, processing, errors } = useForm({
        borrower_id: "",
        supervisor_id: "",
        practicum_schedule_id: "",
        item_type: "alat",
        request_date: today,
        due_at: dueDefault,
        purpose: "",
        notes: "",
        items: [{ equipment_id: "", quantity: 1 }],
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("admin.loans.store"));
    };

    return (
        <AppLayout>
            <Head title="Tambah Peminjaman" />

            <div className="animate-fade-in">
                <PageHeader
                    title="Tambah Peminjaman"
                    subtitle="Buat pengajuan peminjaman alat atau pengambilan bahan."
                />

                <form onSubmit={submit} className="space-y-6">
                    <LoanForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        borrowerOptions={borrowerOptions}
                        supervisorOptions={supervisorOptions}
                        scheduleOptions={scheduleOptions}
                        equipmentOptionsAlat={equipmentOptionsAlat}
                        equipmentOptionsBahan={equipmentOptionsBahan}
                    />

                    <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-6">
                        <Button variant="outline" asChild disabled={processing}>
                            <Link href={route("admin.loans.index")}>
                                Batal
                            </Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? "Menyimpan..." : "Simpan Pengajuan"}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
