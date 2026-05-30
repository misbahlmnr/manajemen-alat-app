import AvatarInitials from "@/Components/AvatarInitials";
import StatusBadge from "@/Components/StatusBadge";
import TableRowActions from "@/Components/TableRowActions";
import RoleBadge from "./RoleBadge";

export default function UserTable({ users, onDelete }) {
    if (!users?.length) return null;

    return (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 border-b border-border bg-muted/50 backdrop-blur">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Pengguna
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Email
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Role
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Status
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Dibuat
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                                Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {users.map((user) => (
                            <tr
                                key={user.id}
                                className="transition-colors hover:bg-muted/30"
                            >
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <AvatarInitials name={user.name} size="sm" />
                                        <div className="min-w-0">
                                            <p className="truncate font-medium text-foreground">
                                                {user.name}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {user.identifier_label ||
                                                    user.username}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {user.email}
                                </td>
                                <td className="px-4 py-3">
                                    <RoleBadge role={user.role} />
                                </td>
                                <td className="px-4 py-3">
                                    <StatusBadge status={user.status} />
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {user.created_at_formatted}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <TableRowActions
                                        showHref={route(
                                            "admin.users.show",
                                            user.id,
                                        )}
                                        editHref={route(
                                            "admin.users.edit",
                                            user.id,
                                        )}
                                        onDelete={() => onDelete(user)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
