import DataTable from "@/Components/DataTable";
import AvailabilityBadge from "@/Components/AvailabilityBadge";
import { Button } from "@/Components/ui/button";
import ConditionBadge from "@/Pages/Admin/Equipment/Components/ConditionBadge";
import { Link } from "@inertiajs/react";
import { Eye } from "lucide-react";

export default function GuruEquipmentTable({ items, pagination }) {
    const columns = [
        {
            accessorKey: "code",
            header: "Kode",
            cell: ({ getValue }) => (
                <span className="font-mono text-xs text-muted-foreground">
                    {getValue()}
                </span>
            ),
        },
        {
            id: "name",
            header: "Nama Alat",
            accessorFn: (row) => row.name,
            cell: ({ row }) => (
                <div className="min-w-[160px] max-w-xs">
                    <p className="font-medium text-foreground">
                        {row.original.name}
                    </p>
                    {row.original.description && (
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                            {row.original.description}
                        </p>
                    )}
                </div>
            ),
        },
        {
            accessorKey: "category",
            header: "Kategori",
            meta: { cellClassName: "text-muted-foreground" },
        },
        {
            id: "stock",
            header: "Stok",
            accessorFn: (row) => row.available,
            cell: ({ row }) => (
                <span className="tabular-nums">
                    <span className="font-medium text-foreground">
                        {row.original.available}
                    </span>
                    <span className="text-muted-foreground">
                        {" "}
                        / {row.original.stock}
                    </span>
                </span>
            ),
        },
        {
            accessorKey: "condition",
            header: "Kondisi",
            cell: ({ getValue }) => <ConditionBadge condition={getValue()} />,
        },
        {
            id: "availability",
            header: "Ketersediaan",
            accessorFn: (row) => row.availability_label,
            enableSorting: false,
            cell: ({ row }) => (
                <AvailabilityBadge label={row.original.availability_label} />
            ),
        },
        {
            accessorKey: "location",
            header: "Lokasi",
            meta: { cellClassName: "text-muted-foreground whitespace-nowrap" },
        },
        {
            id: "actions",
            header: "Aksi",
            enableSorting: false,
            meta: { align: "right", cellClassName: "text-right" },
            cell: ({ row }) => (
                <Button variant="outline" size="sm" asChild>
                    <Link href={row.original.show_url} preserveScroll>
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
            tableClassName="min-w-[900px]"
            getRowId={(row) => String(row.id)}
            emptyState="Tidak ada alat ditemukan"
            initialSorting={[{ id: "name", desc: false }]}
        />
    );
}
