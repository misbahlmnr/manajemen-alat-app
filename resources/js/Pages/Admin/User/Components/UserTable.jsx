import AvatarInitials from "@/Components/AvatarInitials";
import DataTable from "@/Components/DataTable";
import StatusBadge from "@/Components/StatusBadge";
import TableRowActions from "@/Components/TableRowActions";
import { useMemo } from "react";
import RoleBadge from "./RoleBadge";

export default function UserTable({ users, pagination, onDelete }) {
    const columns = useMemo(
        () => [
            {
                id: "user",
                header: "Pengguna",
                accessorFn: (row) => row.name,
                cell: ({ row }) => {
                    const user = row.original;
                    return (
                        <div className="flex items-center gap-3">
                            <AvatarInitials name={user.name} size="sm" />
                            <div className="min-w-0">
                                <p className="truncate font-medium text-foreground">
                                    {user.name}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {user.identifier_label || user.username}
                                </p>
                            </div>
                        </div>
                    );
                },
            },
            {
                accessorKey: "email",
                header: "Email",
                cell: ({ getValue }) => (
                    <span className="text-muted-foreground">{getValue()}</span>
                ),
            },
            {
                accessorKey: "role",
                header: "Role",
                cell: ({ getValue }) => <RoleBadge role={getValue()} />,
            },
            {
                accessorKey: "class",
                header: "Kelas",
                cell: ({ row }) => {
                    const user = row.original;

                    return (
                        <span className="text-muted-foreground">
                            {user.role === "siswa" ? user.class || "—" : "—"}
                        </span>
                    );
                },
            },
            {
                accessorKey: "status",
                header: "Status",
                cell: ({ getValue }) => <StatusBadge status={getValue()} />,
            },
            {
                accessorKey: "created_at_formatted",
                header: "Dibuat",
                cell: ({ getValue }) => (
                    <span className="text-muted-foreground">{getValue()}</span>
                ),
            },
            {
                id: "actions",
                header: "Aksi",
                enableSorting: false,
                meta: { align: "right", cellClassName: "text-right" },
                cell: ({ row }) => {
                    const user = row.original;
                    return (
                        <TableRowActions
                            showHref={route("admin.users.show", user.id)}
                            editHref={route("admin.users.edit", user.id)}
                            onDelete={() => onDelete(user)}
                        />
                    );
                },
            },
        ],
        [onDelete],
    );

    return (
        <DataTable
            data={users ?? []}
            columns={columns}
            pagination={pagination}
            getRowId={(row) => String(row.id)}
            initialSorting={[{ id: "created_at_formatted", desc: true }]}
            emptyState="Tidak ada pengguna ditemukan"
        />
    );
}
