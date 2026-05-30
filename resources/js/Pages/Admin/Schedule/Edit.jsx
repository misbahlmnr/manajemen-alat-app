import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import { Button } from "@/Components/ui/button";
import { Head, Link, useForm } from "@inertiajs/react";
import ScheduleForm from "./Components/ScheduleForm";

export default function Edit({
    schedule,
    guruOptions,
    kelasOptions,
    subjectOptions,
    equipmentOptions,
}) {
    const equipment =
        schedule.required_equipment?.length > 0
            ? schedule.required_equipment.map((row) => ({
                  equipment_id: String(row.equipment_id),
                  quantity: row.quantity,
              }))
            : [{ equipment_id: "", quantity: 1 }];

    const { data, setData, put, processing, errors } = useForm({
        title: schedule.title,
        mata_kuliah: schedule.mata_kuliah,
        kelas: schedule.kelas,
        tanggal: schedule.tanggal,
        jam_mulai: schedule.jam_mulai,
        jam_selesai: schedule.jam_selesai,
        ruangan: schedule.ruangan ?? "",
        guru_id: String(schedule.guru_id),
        priority: schedule.priority,
        status: schedule.status,
        notes: schedule.notes ?? "",
        required_equipment: equipment,
    });

    const submit = (e) => {
        e.preventDefault();
        put(route("admin.schedules.update", schedule.id));
    };

    return (
        <AppLayout>
            <Head title={`Edit ${schedule.title}`} />

            <div className="animate-fade-in">
                <PageHeader
                    title="Edit Jadwal"
                    subtitle={schedule.code}
                />

                <form onSubmit={submit} className="space-y-6">
                    <ScheduleForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        guruOptions={guruOptions}
                        kelasOptions={kelasOptions}
                        subjectOptions={subjectOptions}
                        equipmentOptions={equipmentOptions}
                    />

                    <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-6">
                        <Button variant="outline" asChild disabled={processing}>
                            <Link
                                href={route(
                                    "admin.schedules.show",
                                    schedule.id,
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
