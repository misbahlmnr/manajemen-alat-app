import { CalendarDays } from "lucide-react";

const priorityLabel = {
    lomba: { text: "Lomba", className: "bg-destructive/15 text-destructive" },
    tinggi: { text: "Tinggi", className: "bg-warning/15 text-warning" },
    normal: { text: "Normal", className: "bg-secondary text-muted-foreground" },
};

export function UpcomingSchedules({ schedules }) {
    if (!schedules?.length) return null;

    return (
        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <CalendarDays className="h-5 w-5 text-primary" />
                Jadwal Hari Ini
            </h2>
            <ul className="space-y-2">
                {schedules.map((s) => {
                    const priority =
                        priorityLabel[s.priority] ?? priorityLabel.normal;

                    return (
                        <li
                            key={s.id}
                            className={`flex items-center justify-between gap-3 rounded-lg p-3 ${
                                s.is_finished
                                    ? "bg-secondary/20 opacity-60"
                                    : "bg-secondary/40"
                            }`}
                        >
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p
                                        className={`truncate text-sm font-medium ${
                                            s.is_finished
                                                ? "text-muted-foreground line-through"
                                                : ""
                                        }`}
                                    >
                                        {s.title}
                                    </p>
                                    {s.is_finished ? (
                                        <span className="shrink-0 rounded bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                            Selesai
                                        </span>
                                    ) : (
                                        <span className="shrink-0 rounded bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success">
                                            Belum selesai
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {s.mata_kuliah}
                                </p>
                                <p className="text-xs text-muted-foreground">
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
