import DataPagination from "@/Components/DataPagination";
import { normalizePaginator } from "@/lib/paginator";
import { cn } from "@/lib/utils";
import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useState } from "react";

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
    pagination: rawPagination,
    enablePagination = true,
}) {
    const pagination = normalizePaginator(rawPagination);
    const [sorting, setSorting] = useState(initialSorting);

    const table = useReactTable({
        data,
        columns,
        getRowId,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        manualPagination: true,
        pageCount: pagination?.meta?.last_page ?? 0,
    });

    const rows = table.getRowModel().rows;

    console.log({ enablePagination, pagination });

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

            {enablePagination && pagination && (
                <DataPagination
                    links={pagination.links}
                    meta={pagination.meta}
                />
            )}
        </div>
    );
}
