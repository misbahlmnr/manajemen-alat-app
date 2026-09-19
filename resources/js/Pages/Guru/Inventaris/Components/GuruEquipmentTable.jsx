import DataTable from "@/Components/DataTable";
import AvailabilityBadge from "@/Components/AvailabilityBadge";
import ConditionBreakdown from "@/Components/ConditionBreakdown";
import EquipmentImage from "@/Components/Equipment/EquipmentImage";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Link } from "@inertiajs/react";
import { Eye } from "lucide-react";

function AvailabilityCell({ item }) {
    const tersedia = Number(item.available ?? 0);
    const total = Number(item.qty_baik ?? item.stock ?? 0);
    const dipinjam = Math.max(0, total - tersedia);
    const unit = item.unit || "unit";
    const outOfStock = tersedia <= 0;

    return (
        <div className="space-y-1.5">
            <Badge variant={outOfStock ? "destructive" : "success"}>
                {outOfStock ? "Tidak tersedia" : "Tersedia"}
            </Badge>
            <p className="text-xs text-muted-foreground tabular-nums">
                tersedia {tersedia} · dipinjam {dipinjam} · total {total} {unit}
            </p>
        </div>
    );
}

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
                <div className="flex min-w-[160px] max-w-xs items-center gap-3">
                    <EquipmentImage
                        imageUrl={row.original.image_url}
                        name={row.original.name}
                        className="h-10 w-10 shrink-0 rounded-lg border border-border/60"
                        iconClassName="h-4 w-4"
                    />
                    <div>
                        <p className="font-medium text-foreground">
                            {row.original.name}
                        </p>
                        {row.original.description && (
                            <p className="line-clamp-2 text-xs text-muted-foreground">
                                {row.original.description}
                            </p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "category",
            header: "Kategori",
            meta: { cellClassName: "text-muted-foreground" },
        },
        {
            id: "available",
            header: "Stok Lab",
            accessorFn: (row) => row.available,
            cell: ({ row }) => <AvailabilityCell item={row.original} />,
        },
        {
            id: "condition",
            header: "Kondisi Detail",
            cell: ({ row }) => (
                <ConditionBreakdown
                    breakdown={row.original.condition_breakdown}
                    compact
                />
            ),
        },
        {
            id: "availability",
            header: "Status",
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
