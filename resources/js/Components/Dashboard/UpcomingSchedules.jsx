import { CalendarDays } from "lucide-react";

const priorityLabel = {
    lomba: { text: "Lomba", className: "bg-destructive/15 text-destructive" },
    tinggi: { text: "Tinggi", className: "bg-warning/15 text-warning" },
    normal: { text: "Normal", className: "bg-secondary text-muted-foreground" },
};

function formatScheduleDate(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "short",
    });
}

export function UpcomingSchedules({ schedules }) {
    if (!schedules?.length) return null;

    return (
        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <CalendarDays className="h-5 w-5 text-primary" />
                Jadwal Praktikum Terdekat
            </h2>
            <ul className="space-y-2">
                {schedules.map((s) => {
                    const priority =
                        priorityLabel[s.priority] ?? priorityLabel.normal;

                    return (
                        <li
                            key={s.id}
                            className="flex items-center justify-between gap-3 rounded-lg bg-secondary/40 p-3"
                        >
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                    {s.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {formatScheduleDate(s.tanggal)} •{" "}
                                    {s.jamMulai}-{s.jamSelesai}
                                    {s.ruangan ? ` • ${s.ruangan}` : ""}
                                </p>
                            </div>
                            <span
                                className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-medium ${priority.className}`}
                            >
                                {priority.text}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
