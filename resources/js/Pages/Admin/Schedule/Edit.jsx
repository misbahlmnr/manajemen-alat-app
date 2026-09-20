import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import { Button } from "@/Components/ui/button";
import { Head, Link, useForm } from "@inertiajs/react";
import ScheduleForm from "./Components/ScheduleForm";

export default function Edit({
    schedule,
    guruOptions,
    siswaOptions = [],
    equipmentOptions = [],
    bahanOptions = [],
    kelasOptions,
    subjectOptions,
    dayOptions,
    typeOptions,
    kindOptions = {},
    labRoomOptions = [],
}) {
    const { data, setData, put, processing, errors } = useForm({
        schedule_kind: schedule.schedule_kind || "praktikum",
        title: schedule.title,
        mata_kuliah: schedule.mata_kuliah,
        kelas: schedule.kelas,
        type: schedule.type,
        hari: schedule.hari ?? "",
        tanggal: schedule.tanggal ?? "",
        jam_mulai: schedule.jam_mulai,
        jam_selesai: schedule.jam_selesai,
        ruangan: schedule.ruangan ?? "",
        guru_id: String(schedule.guru_id),
        penanggung_jawab_id: schedule.penanggung_jawab_id
            ? String(schedule.penanggung_jawab_id)
            : "",
        participant_ids: schedule.participant_ids ?? [],
        items: (schedule.items ?? []).map((row) => ({
            equipment_id: String(row.equipment_id),
            quantity: row.quantity,
        })),
        bahan_items: (schedule.bahan_items ?? []).map((row) => ({
            equipment_id: String(row.equipment_id),
            quantity: row.quantity,
        })),
        priority: schedule.priority,
        notes: schedule.notes ?? "",
    });

    const submit = (e) => {
        e.preventDefault();
        put(route("admin.schedules.update", schedule.id));
    };

    return (
        <AppLayout>
            <Head title={`Edit ${schedule.title}`} />

            <div className="animate-fade-in mx-auto max-w-3xl">
                <PageHeader title="Edit Jadwal" subtitle={schedule.code} />

                <form onSubmit={submit} className="space-y-6">
                    <ScheduleForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        guruOptions={guruOptions}
                        siswaOptions={siswaOptions}
                        equipmentOptions={equipmentOptions}
                        bahanOptions={bahanOptions}
                        kelasOptions={kelasOptions}
                        subjectOptions={subjectOptions}
                        dayOptions={dayOptions}
                        typeOptions={typeOptions}
                        kindOptions={kindOptions}
                        labRoomOptions={labRoomOptions}
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
