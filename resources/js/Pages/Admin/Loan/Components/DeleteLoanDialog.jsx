import { AlertDialog } from "@/Components/ui/alert-dialog";

export default function DeleteLoanDialog({
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
            title="Hapus peminjaman?"
            description={
                <>
                    Anda yakin ingin menghapus peminjaman{" "}
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
