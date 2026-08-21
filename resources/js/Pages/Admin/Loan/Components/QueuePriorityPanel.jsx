import { Button } from "@/Components/ui/button";
import { Label } from "@/Components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import { cn } from "@/lib/utils";
import { router } from "@inertiajs/react";
import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

export default function QueuePriorityPanel({ loan }) {
    const [submitting, setSubmitting] = useState(false);
    const [level, setLevel] = useState(
        loan.has_admin_priority ? "high" : "normal",
    );
    const [note, setNote] = useState(loan.queue_priority_note || "");

    useEffect(() => {
        setLevel(loan.has_admin_priority ? "high" : "normal");
        setNote(loan.queue_priority_note || "");
    }, [loan.has_admin_priority, loan.queue_priority_note, loan.id]);

    const save = () => {
        setSubmitting(true);

        if (level === "high") {
            router.post(
                route("admin.loans.queue-priority", loan.id),
                {
                    use_default: true,
                    note: note.trim() || null,
                },
                {
                    preserveScroll: true,
                    onFinish: () => setSubmitting(false),
                },
            );
            return;
        }

        router.post(
            route("admin.loans.queue-priority.reset", loan.id),
            {},
            {
                preserveScroll: true,
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const waitingStock = Boolean(loan.queue_waiting_stock);
    const packageHint =
        loan.is_package || loan.loan_group_id
            ? " Prioritas pada paket berlaku ke semua anggota paket yang masih antrian."
            : "";

    return (
        <Card className="mb-6 rounded-2xl border-warning/30 bg-warning/5 shadow-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <ArrowUp className="h-4 w-4 text-warning" />
                    Antrian Stok
                </CardTitle>
                <CardDescription>
                    Prioritas hanya mengubah urutan antrean. Tidak memberikan
                    alat secara langsung. Pengajuan akan diproses lebih dahulu
                    ketika stok tersedia.
                    {packageHint}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryTile
                        label="Stok tersedia"
                        value={`${loan.queue_stock_available ?? 0} unit`}
                        hint={
                            loan.queue_stock_needed
                                ? `Butuh ${loan.queue_stock_needed} unit`
                                : null
                        }
                    />
                    <SummaryTile
                        label="Status"
                        value={
                            loan.queue_status_label ??
                            (waitingStock
                                ? "Menunggu stok kembali"
                                : "Siap ditinjau")
                        }
                    />
                    <SummaryTile
                        label="Posisi antrean"
                        value={`#${loan.queue_position ?? "—"}`}
                    />
                    <SummaryTile
                        label="Prioritas"
                        value={
                            loan.queue_priority_label ??
                            (loan.has_admin_priority
                                ? "Prioritas Tinggi"
                                : "Normal")
                        }
                    />
                </div>

                <div className="rounded-xl border border-border/60 bg-card p-4 space-y-4">
                    <div className="space-y-2">
                        <Label>Prioritas Admin</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <PriorityOption
                                selected={level === "normal"}
                                disabled={submitting}
                                onClick={() => setLevel("normal")}
                                title="Normal"
                                description="Urutan Round Robin (FIFO)"
                            />
                            <PriorityOption
                                selected={level === "high"}
                                disabled={submitting}
                                onClick={() => setLevel("high")}
                                title="Prioritas Tinggi"
                                description="Diproses lebih dulu saat stok ada"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="queue_note">
                            Catatan{" "}
                            <span className="font-normal text-muted-foreground">
                                (opsional)
                            </span>
                        </Label>
                        <input
                            id="queue_note"
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            disabled={submitting || level === "normal"}
                            className="form-input"
                            placeholder="Alasan prioritas..."
                        />
                    </div>

                    <Button
                        type="button"
                        disabled={submitting}
                        onClick={save}
                    >
                        {submitting ? "Menyimpan..." : "Simpan"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function SummaryTile({ label, value, hint }) {
    return (
        <div className="rounded-lg border border-border/60 bg-card px-3 py-2">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
            {hint ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
            ) : null}
        </div>
    );
}

function PriorityOption({ selected, disabled, onClick, title, description }) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={cn(
                "rounded-xl border px-3 py-3 text-left transition-colors",
                selected
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border/60 bg-background text-muted-foreground hover:border-border",
                disabled && "cursor-not-allowed opacity-60",
            )}
        >
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </button>
    );
}
