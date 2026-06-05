import SchedulePriorityBadge from "@/Components/SchedulePriorityBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { Link } from "@inertiajs/react";
import { CalendarDays } from "lucide-react";

const dayNames = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function getWeekDays() {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return {
            key: d.toISOString().slice(0, 10),
            label: dayNames[i],
            date: d.getDate(),
        };
    });
}

export default function WeekScheduleOverview({
    schedules = [],
    scheduleShowRoute = "admin.schedules.show",
}) {
    const weekDays = getWeekDays();
    const byDate = schedules.reduce((acc, s) => {
        if (!acc[s.tanggal]) acc[s.tanggal] = [];
        acc[s.tanggal].push(s);
        return acc;
    }, {});

    return (
        <Card className="mb-6 rounded-2xl border-border/60 shadow-card">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    <div>
                        <CardTitle className="text-base">
                            Jadwal Minggu Ini
                        </CardTitle>
                        <CardDescription>
                            Ringkasan visual — tabel utama tetap di bawah
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
                    {weekDays.map((day) => {
                        const items = byDate[day.key] ?? [];
                        return (
                            <div
                                key={day.key}
                                className="min-h-[100px] rounded-xl border border-border/50 bg-muted/20 p-2"
                            >
                                <p className="text-center text-xs font-medium text-muted-foreground">
                                    {day.label}
                                </p>
                                <p className="text-center text-lg font-bold text-foreground">
                                    {day.date}
                                </p>
                                <div className="mt-2 space-y-1.5">
                                    {items.length === 0 ? (
                                        <p className="text-center text-[10px] text-muted-foreground">
                                            —
                                        </p>
                                    ) : (
                                        items.map((s) => (
                                            <Link
                                                key={s.id}
                                                href={route(
                                                    scheduleShowRoute,
                                                    s.id,
                                                )}
                                                className="block rounded-lg border border-border/40 bg-card p-1.5 text-[10px] leading-tight shadow-sm transition-colors hover:bg-muted/50"
                                            >
                                                <p className="line-clamp-2 font-medium text-foreground">
                                                    {s.title}
                                                </p>
                                                <p className="mt-0.5 text-muted-foreground">
                                                    {s.jam_mulai}
                                                </p>
                                                <div className="mt-1 flex flex-wrap gap-1">
                                                    <SchedulePriorityBadge
                                                        priority={s.priority}
                                                    />
                                                </div>
                                            </Link>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                {schedules.length > 0 && (
                    <p className="mt-3 text-center text-xs text-muted-foreground">
                        Klik kartu jadwal untuk melihat detail
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
