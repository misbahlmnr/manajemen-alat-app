import { usePage } from "@inertiajs/react";
import toast, { Toaster } from "react-hot-toast";
import { useEffect } from "react";

export default function FlashMessage() {
    const { flash } = usePage().props;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    return (
        <Toaster
            position="top-right"
            toastOptions={{
                className:
                    "!rounded-[8px] !border !border-border !bg-card !text-foreground !shadow-md",
                success: {
                    iconTheme: {
                        primary: "hsl(var(--success))",
                        secondary: "#fff",
                    },
                },
                error: {
                    iconTheme: {
                        primary: "hsl(var(--destructive))",
                        secondary: "#fff",
                    },
                },
            }}
        />
    );
}
