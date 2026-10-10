import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import { Button } from "@/Components/ui/button";
import { Head, Link, useForm } from "@inertiajs/react";
import ScheduleForm from "./Components/ScheduleForm";

export default function Create({
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
    const { data, setData, post, processing, errors } = useForm({
        schedule_kind: "praktikum",
        title: "",
        mata_kuliah: "",
        kelas: "",
        type: "mingguan",
        hari: "senin",
        tanggal: "",
        jam_mulai: "08:00",
        jam_selesai: "10:00",
        ruangan: "",
        guru_id: "",
        penanggung_jawab_id: "",
        participant_ids: [],
        items: [],
        bahan_items: [],
        priority: "normal",
        notes: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("admin.schedules.store"));
    };

    return (
        <AppLayout>
            <Head title="Tambah Jadwal" />

            <div className="animate-fade-in mx-auto max-w-3xl">
                <PageHeader
                    title="Tambah Jadwal"
                    subtitle="Buat jadwal praktik lab atau event lomba."
                />

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

                    <div className="sticky bottom-0 z-10 flex flex-wrap justify-end gap-2 rounded-[10px] border border-border bg-card/95 px-4 py-4 shadow-[var(--shadow-card)] backdrop-blur">
                        <Button variant="outline" asChild disabled={processing}>
                            <Link href={route("admin.schedules.index")}>
                                Batal
                            </Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? "Menyimpan..." : "Simpan Jadwal"}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
