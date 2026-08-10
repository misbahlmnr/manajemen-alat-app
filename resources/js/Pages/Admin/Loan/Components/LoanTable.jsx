import DataTable from "@/Components/DataTable";
import LoanStatusBadge from "@/Components/LoanStatusBadge";
import { Link } from "@inertiajs/react";
import LoanTableActions from "./LoanTableActions";

function PackageMembers({ members }) {
    if (!members?.length) return null;

    return (
        <div className="mt-1 space-y-1">
            {members.map((member) => (
                <div
                    key={member.id}
                    className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
                >
                    <Link
                        href={route("admin.loans.show", member.id)}
                        className="font-mono text-primary hover:underline"
                    >
                        {member.code}
                    </Link>
                    <span className="rounded border px-1.5 py-0.5">
                        {member.item_type_label}
                    </span>
                    <LoanStatusBadge
                        status={member.status}
                        itemType={member.item_type}
                    />
                    {member.queue_position ? (
                        <span>Antrian #{member.queue_position}</span>
                    ) : null}
                    <span className="line-clamp-1">{member.items_summary}</span>
                </div>
            ))}
        </div>
    );
}

export default function LoanTable({
    items,
    pagination,
    onDelete,
    onReject,
    onReturn,
}) {
    const columns = [
        {
            accessorKey: "code",
            header: "Kode",
            cell: ({ row }) => (
                <div>
                    <span className="font-mono text-xs text-muted-foreground">
                        {row.original.is_package
                            ? (row.original.package_codes || []).join(" + ")
                            : row.original.code}
                    </span>
                    {row.original.is_package && (
                        <p className="text-[10px] uppercase tracking-wide text-indigo-600">
                            Paket
                        </p>
                    )}
                </div>
            ),
        },
        {
            id: "borrower",
            header: "Peminjam",
            accessorFn: (row) => row.borrower_name,
            cell: ({ row }) => (
                <div>
                    <p className="font-medium text-foreground">
                        {row.original.borrower_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {row.original.borrower_class || row.original.borrower_role}
                    </p>
                </div>
            ),
        },
        {
            accessorKey: "items_summary",
            header: "Item",
            meta: { cellClassName: "max-w-[260px]" },
            cell: ({ row }) =>
                row.original.is_package ? (
                    <PackageMembers members={row.original.package_members} />
                ) : (
                    <div>
                        <p className="line-clamp-2 text-muted-foreground">
                            {row.original.items_summary}
                        </p>
                        {row.original.status === "antrian" &&
                            row.original.queue_position && (
                                <p className="mt-1 text-xs text-amber-700">
                                    Antrian #{row.original.queue_position}
                                </p>
                            )}
                    </div>
                ),
        },
        {
            accessorKey: "item_type",
            header: "Jenis",
            cell: ({ row }) => (
                <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
                        row.original.item_type === "paket"
                            ? "border-indigo-500/20 bg-indigo-500/10 text-indigo-700"
                            : row.original.item_type === "alat"
                              ? "border-violet-500/20 bg-violet-500/10 text-violet-700"
                              : "border-amber-500/20 bg-amber-500/10 text-amber-800"
                    }`}
                >
                    {row.original.item_type_label}
                </span>
            ),
        },
        { accessorKey: "supervisor_name", header: "Guru" },
        {
            accessorKey: "request_date_formatted",
            header: "Tanggal",
            meta: { cellClassName: "whitespace-nowrap" },
        },
        {
            id: "due",
            header: "Batas Kembali",
            accessorFn: (row) => row.due_at_formatted,
            meta: { cellClassName: "whitespace-nowrap text-muted-foreground" },
            cell: ({ row }) =>
                row.original.item_type === "alat"
                    ? row.original.due_at_formatted
                    : row.original.is_package
                      ? row.original.package_members?.find(
                            (m) => m.item_type === "alat",
                        )?.due_at_formatted || "—"
                      : "—",
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) =>
                row.original.is_package ? (
                    <div className="space-y-1">
                        {(row.original.package_members || []).map((member) => (
                            <LoanStatusBadge
                                key={member.id}
                                status={member.status}
                                itemType={member.item_type}
                            />
                        ))}
                    </div>
                ) : (
                    <LoanStatusBadge
                        status={row.original.status}
                        itemType={row.original.item_type}
                    />
                ),
        },
        {
            accessorKey: "created_at_formatted",
            header: "Dibuat",
            meta: { cellClassName: "whitespace-nowrap text-muted-foreground" },
        },
        {
            id: "actions",
            header: "Aksi",
            enableSorting: false,
            meta: { align: "right", cellClassName: "text-right" },
            cell: ({ row }) =>
                row.original.is_package ? (
                    <div className="flex flex-col items-end gap-1">
                        {(row.original.package_members || []).map((member) => (
                            <LoanTableActions
                                key={member.id}
                                loan={member}
                                onDelete={onDelete}
                                onReject={onReject}
                                onReturn={onReturn}
                            />
                        ))}
                    </div>
                ) : (
                    <LoanTableActions
                        loan={row.original}
                        onDelete={onDelete}
                        onReject={onReject}
                        onReturn={onReturn}
                    />
                ),
        },
    ];

    return (
        <DataTable
            data={items ?? []}
            columns={columns}
            pagination={pagination}
            tableClassName="min-w-[1000px]"
            getRowId={(row) =>
                row.is_package
                    ? `pkg-${row.loan_group_id}`
                    : String(row.id)
            }
            emptyState="Tidak ada peminjaman ditemukan"
            initialSorting={[{ id: "created_at_formatted", desc: true }]}
        />
    );
}
