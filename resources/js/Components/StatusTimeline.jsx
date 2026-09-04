import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

/**
 * Timeline visual status pengajuan/peminjaman.
 * steps: [{ key, label, done?, current? }]
 */
export default function StatusTimeline({ steps = [], className }) {
    if (!steps.length) return null;

    return (
        <ol className={cn("space-y-0", className)}>
            {steps.map((step, index) => {
                const done = Boolean(step.done);
                const current = Boolean(step.current);
                const isLast = index === steps.length - 1;

                return (
                    <li key={step.key ?? step.label} className="relative flex gap-3 pb-6 last:pb-0">
                        {!isLast && (
                            <span
                                className={cn(
                                    "absolute left-[15px] top-8 h-[calc(100%-1.25rem)] w-px",
                                    done ? "bg-foreground/25" : "bg-border",
                                )}
                                aria-hidden
                            />
                        )}
                        <span
                            className={cn(
                                "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                                done &&
                                    "border-foreground/30 bg-foreground text-background",
                                current &&
                                    !done &&
                                    "border-foreground/40 bg-muted text-foreground",
                                !done &&
                                    !current &&
                                    "border-border bg-card text-muted-foreground",
                            )}
                        >
                            {done ? <Check className="h-4 w-4" /> : index + 1}
                        </span>
                        <div className="min-w-0 pt-1">
                            <p
                                className={cn(
                                    "text-sm font-medium",
                                    current || done
                                        ? "text-foreground"
                                        : "text-muted-foreground",
                                )}
                            >
                                {step.label}
                            </p>
                            {step.description && (
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    {step.description}
                                </p>
                            )}
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}
