import { AlertDialog } from "@/Components/ui/alert-dialog";

export default function DeleteUserDialog({
    open,
    onOpenChange,
    userName,
    onConfirm,
    loading,
}) {
    return (
        <AlertDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Hapus pengguna?"
            description={
                <>
                    Anda yakin ingin menghapus{" "}
                    <strong className="text-foreground">{userName}</strong>? Tindakan
                    ini tidak dapat dibatalkan.
                </>
            }
            confirmLabel="Hapus"
            variant="destructive"
            loading={loading}
            onConfirm={onConfirm}
        />
    );
}
