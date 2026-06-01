import { Link } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { normalizePaginator } from "@/lib/paginator";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function DataPagination({
    links: linksProp,
    meta: metaProp,
    paginator,
    currentPage,
    lastPage,
    from,
    to,
    total,
    onPageChange,
}) {
    const normalized = paginator ? normalizePaginator(paginator) : null;
    const links = normalized?.links ?? linksProp;
    const meta = normalized?.meta ?? metaProp;

    const isLocalPagination =
        typeof currentPage === "number" &&
        typeof lastPage === "number" &&
        typeof onPageChange === "function";

    const resolvedCurrentPage = isLocalPagination
        ? currentPage
        : meta?.current_page;
    const resolvedLastPage = isLocalPagination ? lastPage : meta?.last_page;
    const resolvedFrom = isLocalPagination ? from : meta?.from;
    const resolvedTo = isLocalPagination ? to : meta?.to;
    const resolvedTotal = isLocalPagination ? total : meta?.total;

    if (!resolvedLastPage) return null;

    const prev = links?.find(
        (l) => l.label.includes("Previous") || l.label === "&laquo; Previous",
    );
    const next = links?.find(
        (l) => l.label.includes("Next") || l.label === "Next &raquo;",
    );
    const hasPrev = resolvedCurrentPage > 1;
    const hasNext = resolvedCurrentPage < resolvedLastPage;

    return (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
                Menampilkan {resolvedFrom ?? 0}–{resolvedTo ?? 0} dari{" "}
                {resolvedTotal ?? 0} data
            </p>
            <div className="flex items-center gap-2">
                {isLocalPagination ? (
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!hasPrev}
                        onClick={() =>
                            hasPrev && onPageChange(resolvedCurrentPage - 1)
                        }
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Sebelumnya
                    </Button>
                ) : (
                    <>
                        {prev?.url ? (
                            <Button variant="outline" size="sm" asChild>
                                <Link
                                    href={prev.url}
                                    preserveState
                                    preserveScroll
                                >
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
                    </>
                )}
                <span className="px-2 text-sm text-muted-foreground">
                    {resolvedCurrentPage} / {resolvedLastPage}
                </span>
                {isLocalPagination ? (
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!hasNext}
                        onClick={() =>
                            hasNext && onPageChange(resolvedCurrentPage + 1)
                        }
                    >
                        Berikutnya
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                ) : (
                    <>
                        {next?.url ? (
                            <Button variant="outline" size="sm" asChild>
                                <Link
                                    href={next.url}
                                    preserveState
                                    preserveScroll
                                >
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
                    </>
                )}
            </div>
        </div>
    );
}
