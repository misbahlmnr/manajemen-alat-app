import { Button } from "@/Components/ui/button";
import { Link } from "@inertiajs/react";
import { CreditCard } from "lucide-react";

export default function CompensationAlert() {
    return (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4">
            <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div className="min-w-0 flex-1">
                <p className="font-medium">Kompensasi pending</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    Selesaikan kompensasi agar kartu pelajar Anda dapat diambil.
                </p>
            </div>
            <Button asChild variant="outline" size="sm">
                <Link href="#">Lihat</Link>
            </Button>
        </div>
    );
}
