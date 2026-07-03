import { Button } from "@/Components/ui/button";
import { Label } from "@/Components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import { router, useForm } from "@inertiajs/react";
import { ArrowUp, RotateCcw } from "lucide-react";
import { useState } from "react";

export default function QueuePriorityPanel({ loan }) {
    const [submitting, setSubmitting] = useState(false);
    const { data, setData, errors } = useForm({
        queue_priority: loan.queue_priority || "",
        note: loan.queue_priority_note || "",
    });

    const submitPriority = (useDefault = false) => {
        setSubmitting(true);
        router.post(
            route("admin.loans.queue-priority", loan.id),
            {
                queue_priority: useDefault ? null : data.queue_priority,
                note: data.note,
                use_default: useDefault,
            },
            {
                preserveScroll: true,
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const resetPriority = () => {
        setSubmitting(true);
        router.post(
            route("admin.loans.queue-priority.reset", loan.id),
            {},
            {
                preserveScroll: true,
                onFinish: () => setSubmitting(false),
            },
        );
    };

    return (
        <Card className="mb-6 rounded-2xl border-warning/30 bg-warning/5 shadow-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <ArrowUp className="h-4 w-4 text-warning" />
                    Antrian Stok — Round Robin
                </CardTitle>
                <CardDescription>
                    Urutan default mengikuti round-robin (FIFO). Admin dapat
                    menaikkan prioritas jika siswa lebih membutuhkan.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-border/60 bg-card px-3 py-2">
                        <p className="text-xs text-muted-foreground">
                            Posisi antrian
                        </p>
                        <p className="text-lg font-semibold">
                            #{loan.queue_position ?? "—"}
                        </p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-card px-3 py-2">
                        <p className="text-xs text-muted-foreground">
                            Skor efektif
                        </p>
                        <p className="text-lg font-semibold">
                            {loan.effective_sort_score ?? "—"}
                        </p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-card px-3 py-2">
                        <p className="text-xs text-muted-foreground">
                            Masuk antrian
                        </p>
                        <p className="text-sm font-medium">
                            {loan.queued_at_formatted ?? "—"}
                        </p>
                    </div>
                </div>

                {loan.has_admin_priority && (
                    <p className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
                        Prioritas admin aktif (skor {loan.queue_priority}).
                        {loan.queue_priority_note
                            ? ` ${loan.queue_priority_note}`
                            : ""}
                    </p>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="queue_priority">
                            Prioritas admin (opsional)
                        </Label>
                        <input
                            id="queue_priority"
                            type="number"
                            min="1"
                            max="1000"
                            value={data.queue_priority}
                            onChange={(e) =>
                                setData("queue_priority", e.target.value)
                            }
                            className="form-input"
                            placeholder="Contoh: 150"
                        />
                        {errors.queue_priority && (
                            <p className="text-xs text-destructive">
                                {errors.queue_priority}
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="queue_note">Catatan</Label>
                        <input
                            id="queue_note"
                            type="text"
                            value={data.note}
                            onChange={(e) => setData("note", e.target.value)}
                            className="form-input"
                            placeholder="Alasan prioritas..."
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        disabled={submitting}
                        onClick={() => submitPriority(false)}
                    >
                        Simpan Prioritas
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        disabled={submitting}
                        onClick={() => submitPriority(true)}
                    >
                        Prioritas Standar Admin
                    </Button>
                    {loan.has_admin_priority && (
                        <Button
                            type="button"
                            variant="outline"
                            disabled={submitting}
                            onClick={resetPriority}
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset Round Robin
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
