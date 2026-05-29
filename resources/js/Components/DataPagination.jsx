import { Link } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function DataPagination({ links, meta }) {
    if (!meta || meta.last_page <= 1) return null;

    const prev = links?.find((l) => l.label.includes("Previous") || l.label === "&laquo; Previous");
    const next = links?.find((l) => l.label.includes("Next") || l.label === "Next &raquo;");

    return (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
                Menampilkan {meta.from}–{meta.to} dari {meta.total} data
            </p>
            <div className="flex items-center gap-2">
                {prev?.url ? (
                    <Button variant="outline" size="sm" asChild>
                        <Link href={prev.url} preserveState preserveScroll>
                            <ChevronLeft className="h-4 w-4" />
                            Sebelumnya
                        </Link>
                    </Button>
                ) : (
                    <Button variant="outline" size="sm" disabled>
                        <ChevronLeft className="h-4 w-4" />
                        Sebelumnya
                    </Button>
                )}
                <span className="px-2 text-sm text-muted-foreground">
                    {meta.current_page} / {meta.last_page}
                </span>
                {next?.url ? (
                    <Button variant="outline" size="sm" asChild>
                        <Link href={next.url} preserveState preserveScroll>
                            Berikutnya
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    </Button>
                ) : (
                    <Button variant="outline" size="sm" disabled>
                        Berikutnya
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
