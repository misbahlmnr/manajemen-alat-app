import { AlertDialog } from "@/Components/ui/alert-dialog";

export default function DeleteSupplyDialog({
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
            title="Hapus bahan?"
            description={
                <>
                    Anda yakin ingin menghapus{" "}
                    <strong className="text-foreground">{itemName}</strong> dari
                    inventaris? Tindakan ini tidak dapat dibatalkan.
                </>
            }
            confirmLabel="Hapus"
            variant="destructive"
            loading={loading}
            onConfirm={onConfirm}
        />
    );
}
