import DataPagination from "@/Components/DataPagination";
import { cn } from "@/lib/utils";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/Components/ui/pagination";
import {
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Fragment, useState } from "react";

function SortIcon({ column }) {
    const direction = column.getIsSorted();
    if (direction === "asc") return <ArrowUp className="h-4 w-4" />;
    if (direction === "desc") return <ArrowDown className="h-4 w-4" />;
    return <ArrowUpDown className="h-4 w-4 opacity-60" />;
}

export default function DataTable({
    data = [],
    columns = [],
    getRowId,
    emptyState = "Tidak ada data",
    tableClassName,
    containerClassName,
    initialSorting = [],
    pageSize = 10,
    enablePagination = true,
    pagination: serverPagination,
}) {
    const isServerPagination = Boolean(serverPagination?.meta);
    const [sorting, setSorting] = useState(initialSorting);
    const [clientPagination, setClientPagination] = useState({
        pageIndex: 0,
        pageSize,
    });

    const table = useReactTable({
        data,
        columns,
        getRowId,
        state: {
            sorting,
            ...(isServerPagination
                ? {}
                : { pagination: clientPagination }),
        },
        onSortingChange: setSorting,
        onPaginationChange: isServerPagination ? undefined : setClientPagination,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        ...(isServerPagination
            ? {
                  manualPagination: true,
                  pageCount: serverPagination.meta?.last_page ?? 0,
              }
            : { getPaginationRowModel: getPaginationRowModel() }),
    });

    const rows = isServerPagination
        ? table.getRowModel().rows
        : enablePagination
          ? table.getPaginationRowModel().rows
          : table.getRowModel().rows;

    const pageCount = table.getPageCount();
    const currentPage = table.getState().pagination.pageIndex + 1;
    const totalRows = table.getRowModel().rows.length;
    const from =
        totalRows === 0
            ? 0
            : clientPagination.pageIndex * clientPagination.pageSize + 1;
    const to = Math.min(
        (clientPagination.pageIndex + 1) * clientPagination.pageSize,
        totalRows,
    );

    const visiblePages = () => {
        const maxVisible = 5;
        if (pageCount <= maxVisible) {
            return Array.from({ length: pageCount }, (_, i) => i + 1);
        }
        if (currentPage <= 3) return [1, 2, 3, 4, pageCount];
        if (currentPage >= pageCount - 2) {
            return [1, pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
        }
        return [1, currentPage - 1, currentPage, currentPage + 1, pageCount];
    };

    const showClientPaginationFooter =
        enablePagination && !isServerPagination && pageCount > 1;

    return (
        <div className="space-y-3">
            <div
                className={cn(
                    "overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card",
                    containerClassName,
                )}
            >
                <div className="overflow-x-auto">
                    <table className={cn("w-full text-sm", tableClassName)}>
                        <thead className="sticky top-0 z-10 border-b border-border bg-muted/50 backdrop-blur">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => {
                                        const canSort =
                                            header.column.getCanSort();
                                        return (
                                            <th
                                                key={header.id}
                                                className={cn(
                                                    "px-4 py-3 font-medium text-muted-foreground",
                                                    header.column.columnDef.meta
                                                        ?.align === "right"
                                                        ? "text-right"
                                                        : "text-left",
                                                )}
                                            >
                                                {header.isPlaceholder ? null : canSort ? (
                                                    <button
                                                        type="button"
                                                        className={cn(
                                                            "inline-flex items-center gap-1 transition-colors hover:text-foreground",
                                                            header.column
                                                                .columnDef.meta
                                                                ?.align ===
                                                                "right" &&
                                                                "ml-auto",
                                                        )}
                                                        onClick={header.column.getToggleSortingHandler()}
                                                    >
                                                        {flexRender(
                                                            header.column
                                                                .columnDef
                                                                .header,
                                                            header.getContext(),
                                                        )}
                                                        <SortIcon
                                                            column={
                                                                header.column
                                                            }
                                                        />
                                                    </button>
                                                ) : (
                                                    flexRender(
                                                        header.column.columnDef
                                                            .header,
                                                        header.getContext(),
                                                    )
                                                )}
                                            </th>
                                        );
                                    })}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="divide-y divide-border">
                            {rows.length > 0 ? (
                                rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="transition-colors hover:bg-muted/30"
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <td
                                                key={cell.id}
                                                className={cn(
                                                    "px-4 py-3",
                                                    cell.column.columnDef.meta
                                                        ?.cellClassName,
                                                )}
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext(),
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        className="px-4 py-8 text-center text-sm text-muted-foreground"
                                        colSpan={columns.length || 1}
                                    >
                                        {emptyState}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {enablePagination && isServerPagination && (
                <DataPagination
                    links={serverPagination.links}
                    meta={serverPagination.meta}
                />
            )}

            {showClientPaginationFooter && (
                <div className="flex flex-col items-center justify-between gap-3 px-2 py-2 sm:flex-row">
                    <p className="text-sm text-muted-foreground">
                        Menampilkan {from}–{to} dari {totalRows} data
                    </p>
                    <Pagination className="mx-0 w-auto justify-end">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (table.getCanPreviousPage()) {
                                            table.previousPage();
                                        }
                                    }}
                                    className={cn(
                                        !table.getCanPreviousPage() &&
                                            "pointer-events-none opacity-50",
                                    )}
                                />
                            </PaginationItem>
                            {visiblePages().map((page, index, arr) => {
                                const prev = arr[index - 1];
                                const showEllipsis = prev && page - prev > 1;

                                return (
                                    <Fragment key={page}>
                                        {showEllipsis && (
                                            <PaginationItem>
                                                <PaginationEllipsis />
                                            </PaginationItem>
                                        )}
                                        <PaginationItem>
                                            <PaginationLink
                                                href="#"
                                                isActive={page === currentPage}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    table.setPageIndex(
                                                        page - 1,
                                                    );
                                                }}
                                            >
                                                {page}
                                            </PaginationLink>
                                        </PaginationItem>
                                    </Fragment>
                                );
                            })}
                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (table.getCanNextPage()) {
                                            table.nextPage();
                                        }
                                    }}
                                    className={cn(
                                        !table.getCanNextPage() &&
                                            "pointer-events-none opacity-50",
                                    )}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
    );
}
