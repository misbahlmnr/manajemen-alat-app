import { Button } from "@/Components/ui/button";
import { Link } from "@inertiajs/react";
import { AlertTriangle } from "lucide-react";

export default function CompensationAlert({ href, compensation = null }) {
    return (
        <div className="mt-6 flex flex-col gap-3 rounded-[8px] border border-destructive/20 bg-destructive/10 p-4 sm:flex-row sm:items-start">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div className="min-w-0 flex-1">
                <p className="font-medium">
                    {compensation?.loan_code
                        ? `Alat rusak — ${compensation.loan_code}`
                        : "Alat rusak / pengembalian bermasalah"}
                </p>
                {compensation?.damage_description ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                            Kerusakan:
                        </span>{" "}
                        {compensation.damage_description}
                    </p>
                ) : null}
                <p className="mt-1 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                        Instruksi:
                    </span>{" "}
                    {compensation?.student_instruction ||
                        "Segera datang ke kantor lab untuk penyelesaian."}
                </p>
            </div>
            {href && (
                <Button asChild variant="outline" size="sm">
                    <Link href={href}>Lihat Detail</Link>
                </Button>
            )}
        </div>
    );
}
