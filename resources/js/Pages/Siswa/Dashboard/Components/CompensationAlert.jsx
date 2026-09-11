import { Button } from "@/Components/ui/button";
import { Link } from "@inertiajs/react";
import { AlertTriangle } from "lucide-react";

export default function CompensationAlert({ href, compensation = null }) {
    return (
        <div className="mt-6 flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-start">
            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-red-100 text-red-700">
                <AlertTriangle className="h-4 w-4" />
            </span>
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
