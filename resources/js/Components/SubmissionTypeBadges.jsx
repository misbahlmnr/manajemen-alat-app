import { cn } from "@/lib/utils";
import { Package, Wrench } from "lucide-react";

export default function SubmissionTypeBadges({
    alatCount = 0,
    bahanCount = 0,
}) {
    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {alatCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-700">
                    <Wrench className="h-3 w-3" />
                    Alat ({alatCount})
                </span>
            )}
            {bahanCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-800">
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
