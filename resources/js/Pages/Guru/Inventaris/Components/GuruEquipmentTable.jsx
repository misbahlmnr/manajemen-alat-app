import DataTable from "@/Components/DataTable";
import AvailabilityBadge from "@/Components/AvailabilityBadge";
import ConditionBreakdown from "@/Components/ConditionBreakdown";
import EquipmentImage from "@/Components/Equipment/EquipmentImage";
import { Button } from "@/Components/ui/button";
import { Link } from "@inertiajs/react";
import { Eye } from "lucide-react";

export default function GuruEquipmentTable({ items, pagination }) {
    const columns = [
        {
            id: "preview",
            header: "",
            enableSorting: false,
            cell: ({ row }) => (
                <EquipmentImage
                    imageUrl={row.original.image_url}
                    name={row.original.name}
                    className="h-10 w-10 rounded-lg border border-border/60"
                    iconClassName="h-4 w-4"
                />
            ),
        },
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
            header: "Stok Baik",
            accessorFn: (row) => row.available,
            cell: ({ row }) => (
                <span className="tabular-nums">
                    <span className="font-medium text-foreground">
                        {row.original.available}
                    </span>
                    <span className="text-muted-foreground">
                        {" "}
                        / {row.original.qty_baik} baik
                    </span>
                </span>
            ),
        },
        {
            id: "condition",
            header: "Kondisi",
            cell: ({ row }) => (
                <ConditionBreakdown
                    breakdown={row.original.condition_breakdown}
                    compact
                />
            ),
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
