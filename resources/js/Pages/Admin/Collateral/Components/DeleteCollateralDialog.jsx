import { AlertDialog } from "@/Components/ui/alert-dialog";

export default function DeleteCollateralDialog({
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
            title="Hapus jaminan kartu?"
            description={
                <>
                    Anda yakin ingin menghapus{" "}
                    <strong className="text-foreground">{itemName}</strong>?
                    Tindakan ini tidak dapat dibatalkan.
                </>
            }
            confirmLabel="Hapus"
            variant="destructive"
            loading={loading}
            onConfirm={onConfirm}
        />
    );
}
