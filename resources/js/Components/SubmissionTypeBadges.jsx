import { cn } from "@/lib/utils";
import { Package, Wrench } from "lucide-react";

export default function SubmissionTypeBadges({
    alatCount = 0,
    bahanCount = 0,
}) {
    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {alatCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border-transparent bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                    <Wrench className="h-3 w-3" />
                    Alat ({alatCount})
                </span>
            )}
            {bahanCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border-transparent bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                    <Package className="h-3 w-3" />
                    Bahan ({bahanCount})
                </span>
            )}
            {alatCount <= 0 && bahanCount <= 0 && (
                <span className="text-xs text-muted-foreground">—</span>
            )}
        </div>
    );
}
