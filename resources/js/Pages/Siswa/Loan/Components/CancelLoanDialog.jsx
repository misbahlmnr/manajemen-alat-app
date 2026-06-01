import { AlertDialog } from "@/Components/ui/alert-dialog";

export default function CancelLoanDialog({
    open,
    onOpenChange,
    itemName,
    onConfirm,
    loading,
}) {
    return (
        <AlertDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Batalkan pengajuan?"
            description={
                <>
                    Pengajuan{" "}
                    <strong className="text-foreground">{itemName}</strong>{" "}
                    akan dibatalkan dan tidak dapat diproses lagi.
                </>
            }
            confirmLabel="Batalkan"
            variant="destructive"
            loading={loading}
            onConfirm={onConfirm}
        />
    );
}
