import { AlertDialog } from "@/Components/ui/alert-dialog";

export default function DeleteScheduleDialog({
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
            title="Hapus jadwal?"
            description={
                <>
                    Anda yakin ingin menghapus jadwal{" "}
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
