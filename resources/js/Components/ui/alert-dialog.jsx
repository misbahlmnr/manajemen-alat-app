import { Button } from "@/Components/ui/button";
import { cn } from "@/lib/utils";

export function AlertDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = "Konfirmasi",
    cancelLabel = "Batal",
    onConfirm,
    loading = false,
    variant = "destructive",
}) {
    if (!open) return null;

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
                    "relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-floating",
                    "animate-fade-in",
                )}
            >
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                {description && (
                    <div className="mt-2 text-sm text-muted-foreground">
                        {description}
                    </div>
                )}
                <div className="mt-6 flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={loading}
                        onClick={() => onOpenChange?.(false)}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        type="button"
                        variant={variant}
                        disabled={loading}
                        onClick={onConfirm}
                    >
                        {loading ? "Memproses..." : confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}
