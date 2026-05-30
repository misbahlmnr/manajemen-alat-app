import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import { Button } from "@/Components/ui/button";
import { Head, Link, useForm } from "@inertiajs/react";
import LoanForm from "./Components/LoanForm";

export default function Edit({
    loan,
    borrowerOptions,
    supervisorOptions,
    scheduleOptions,
    equipmentOptionsAlat,
    equipmentOptionsBahan,
}) {
    const { data, setData, put, processing, errors } = useForm({
        borrower_id: String(loan.borrower_id),
        supervisor_id: String(loan.supervisor_id),
        practicum_schedule_id: loan.practicum_schedule_id
            ? String(loan.practicum_schedule_id)
            : "",
        item_type: loan.item_type,
        borrow_scope: loan.borrow_scope ?? "lab",
        request_date: loan.request_date,
        due_at: loan.due_at ?? "",
        purpose: loan.purpose ?? "",
        notes: loan.notes ?? "",
        items:
            loan.items?.length > 0
                ? loan.items.map((i) => ({
                      equipment_id: String(i.equipment_id),
                      quantity: i.quantity,
                  }))
                : [{ equipment_id: "", quantity: 1 }],
    });

    const submit = (e) => {
        e.preventDefault();
        put(route("admin.loans.update", loan.id));
    };

    return (
        <AppLayout>
            <Head title={`Edit ${loan.code}`} />

            <div className="animate-fade-in">
                <PageHeader title="Edit Peminjaman" subtitle={loan.code} />

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
                            <Link href={route("admin.loans.show", loan.id)}>
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
