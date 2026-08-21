import DataTable from "@/Components/DataTable";
import LoanStatusBadge from "@/Components/LoanStatusBadge";
import SubmissionTypeBadges from "@/Components/SubmissionTypeBadges";
import { Button } from "@/Components/ui/button";
import { Link } from "@inertiajs/react";
import { Eye } from "lucide-react";

export default function LoanTable({ items, pagination }) {
    const columns = [
        {
            accessorKey: "code",
            header: "Pengajuan",
            cell: ({ row }) => (
                <Link
                    href={
                        row.original.show_url ||
                        route("admin.loans.submission", row.original.code)
                    }
                    className="font-mono text-sm font-semibold text-primary hover:underline"
                >
                    {row.original.code}
                </Link>
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
                        {row.original.borrower_class ||
                            row.original.borrower_role}
                    </p>
                </div>
            ),
        },
        {
            id: "contents",
            header: "Isi Pengajuan",
            enableSorting: false,
            cell: ({ row }) => (
                <SubmissionTypeBadges
                    alatCount={row.original.alat_count}
                    bahanCount={row.original.bahan_count}
                />
            ),
        },
        {
            accessorKey: "supervisor_name",
            header: "Guru",
        },
        {
            accessorKey: "request_date_formatted",
            header: "Tanggal",
            meta: { cellClassName: "whitespace-nowrap" },
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <div className="min-w-[10rem] space-y-1">
                    <LoanStatusBadge
                        status={row.original.status}
                        itemType="submission"
                    />
                    {row.original.status_summary ? (
                        <p className="text-xs leading-snug text-muted-foreground">
                            {row.original.status_summary}
                        </p>
                    ) : null}
                </div>
            ),
        },
        {
            id: "actions",
            header: "Aksi",
            enableSorting: false,
            meta: { align: "right", cellClassName: "text-right" },
            cell: ({ row }) => (
                <Button variant="outline" size="sm" asChild>
                    <Link
                        href={
                            row.original.show_url ||
                            route("admin.loans.submission", row.original.code)
                        }
                    >
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        Detail
                    </Link>
                </Button>
            ),
        },
    ];

    return (
        <DataTable
            data={items ?? []}
            columns={columns}
            pagination={pagination}
            tableClassName="min-w-[860px]"
            getRowId={(row) => `sub-${row.id ?? row.code}`}
            emptyState="Tidak ada pengajuan ditemukan"
            initialSorting={[{ id: "created_at_formatted", desc: true }]}
        />
    );
}
