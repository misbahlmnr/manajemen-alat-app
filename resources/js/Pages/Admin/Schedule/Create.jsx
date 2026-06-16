import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import { Button } from "@/Components/ui/button";
import { Head, Link, useForm } from "@inertiajs/react";
import ScheduleForm from "./Components/ScheduleForm";

export default function Create({
    guruOptions,
    kelasOptions,
    subjectOptions,
    dayOptions,
    typeOptions,
}) {
    const { data, setData, post, processing, errors } = useForm({
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
        priority: "normal",
        notes: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("admin.schedules.store"));
    };

    return (
        <AppLayout>
            <Head title="Tambah Jadwal Praktikum" />

            <div className="animate-fade-in">
                <PageHeader
                    title="Tambah Jadwal"
                    subtitle="Buat jadwal mingguan atau acara khusus untuk kelas TAV."
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
                        dayOptions={dayOptions}
                        typeOptions={typeOptions}
                    />

                    <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-6">
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
