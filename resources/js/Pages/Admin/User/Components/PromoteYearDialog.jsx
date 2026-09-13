import { Button } from "@/Components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "@inertiajs/react";

export default function PromoteYearDialog({
    open,
    onOpenChange,
    preview,
    onConfirm,
    loading = false,
}) {
    if (!open) return null;

    const graduate = preview?.graduate ?? [];
    const promote = preview?.promote ?? [];
    const blocked = preview?.blocked ?? [];
    const totals = preview?.totals ?? { graduate: 0, promote: 0, blocked: 0 };
    const canPromote = Boolean(preview?.can_promote);
    const hasWork = totals.graduate + totals.promote > 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
                type="button"
                className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
                aria-label="Tutup"
                onClick={() => !loading && onOpenChange?.(false)}
            />
            <div
                role="alertdialog"
                className={cn(
                    "relative z-10 w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg",
                    "animate-fade-in max-h-[85vh] overflow-y-auto",
                )}
            >
                <h2 className="text-lg font-semibold text-foreground">
                    Naikkan tahun ajaran?
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    Hanya siswa aktif. XII diluluskan (akun tetap), XI TAV n
                    menjadi XII TAV n, X TE n menjadi XI TAV n. Pengajuan lama
                    dan jadwal tidak diubah.
                </p>

                {hasWork && (
                    <div className="mt-4 space-y-3 text-sm">
                        {graduate.length > 0 && (
                            <section>
                                <h3 className="font-medium text-foreground">
                                    Lulus ({totals.graduate})
                                </h3>
                                <ul className="mt-1 space-y-1 text-muted-foreground">
                                    {graduate.map((row) => (
                                        <li key={row.from}>
                                            {row.from} → inactive ({row.count}{" "}
                                            siswa)
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}
                        {promote.length > 0 && (
                            <section>
                                <h3 className="font-medium text-foreground">
                                    Naik kelas ({totals.promote})
                                </h3>
                                <ul className="mt-1 space-y-1 text-muted-foreground">
                                    {promote.map((row) => (
                                        <li key={`${row.from}-${row.to}`}>
                                            {row.from} → {row.to} ({row.count}{" "}
                                            siswa)
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}
                    </div>
                )}

                {!hasWork && blocked.length === 0 && (
                    <p className="mt-4 text-sm text-muted-foreground">
                        Tidak ada siswa aktif yang bisa dinaikkan.
                    </p>
                )}

                {blocked.length > 0 && (
                    <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                        <h3 className="font-medium text-destructive">
                            Tidak bisa naik ({totals.blocked})
                        </h3>
                        <ul className="mt-2 space-y-1 text-muted-foreground">
                            {blocked.map((row) => (
                                <li
                                    key={`${row.from}-${row.to ?? ""}-${row.reason}`}
                                >
                                    {row.from}
                                    {row.to ? ` → ${row.to}` : ""} ({row.count}{" "}
                                    siswa) — {row.reason}
                                </li>
                            ))}
                        </ul>
                        <p className="mt-2 text-muted-foreground">
                            Tambah opsi kelas tujuan di{" "}
                            <Link
                                href={route("admin.users.class-options")}
                                className="font-medium text-foreground underline underline-offset-2"
                            >
                                Opsi kelas & angkatan
                            </Link>
                            , lalu coba lagi. Kenaikan dibatalkan selama masih
                            ada siswa terblokir.
                        </p>
                    </div>
                )}

                <div className="mt-6 flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={loading}
                        onClick={() => onOpenChange?.(false)}
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        disabled={loading || !canPromote}
                        onClick={onConfirm}
                    >
                        {loading ? "Memproses..." : "Naikkan tahun ajaran"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
