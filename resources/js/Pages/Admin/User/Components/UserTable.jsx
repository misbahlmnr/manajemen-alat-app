import { Link } from "@inertiajs/react";
import AvatarInitials from "@/Components/AvatarInitials";
import RoleBadge from "./RoleBadge";
import UserStatusBadge from "./UserStatusBadge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { Button } from "@/Components/ui/button";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

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
                                    <UserStatusBadge status={user.status} />
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {user.created_at_formatted}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">Menu aksi</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-44">
                                            <DropdownMenuItem asChild>
                                                <Link
                                                    href={route(
                                                        "admin.users.show",
                                                        user.id,
                                                    )}
                                                    className="cursor-pointer"
                                                >
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    Detail
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link
                                                    href={route(
                                                        "admin.users.edit",
                                                        user.id,
                                                    )}
                                                    className="cursor-pointer"
                                                >
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="cursor-pointer text-destructive focus:text-destructive"
                                                onClick={() => onDelete(user)}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Hapus
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
