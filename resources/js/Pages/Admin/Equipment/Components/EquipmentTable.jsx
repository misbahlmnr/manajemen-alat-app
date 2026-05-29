import { Link } from "@inertiajs/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { Button } from "@/Components/ui/button";
import ConditionBadge from "./ConditionBadge";
import EquipmentStatusBadge from "./EquipmentStatusBadge";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

export default function EquipmentTable({ items, onDelete }) {
    if (!items?.length) return null;

    return (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                    <thead className="sticky top-0 z-10 border-b border-border bg-muted/50 backdrop-blur">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Kode
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Nama Alat
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Kategori
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Stok
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Kondisi
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Status
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                                Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {items.map((item) => (
                            <tr
                                key={item.id}
                                className="transition-colors hover:bg-muted/30"
                            >
                                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                    {item.code}
                                </td>
                                <td className="px-4 py-3">
                                    <p className="font-medium text-foreground">
                                        {item.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {item.location}
                                    </p>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {item.category}
                                </td>
                                <td className="px-4 py-3">
                                    <span className="font-medium">
                                        {item.available}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {" "}
                                        / {item.stock}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <ConditionBadge condition={item.condition} />
                                </td>
                                <td className="px-4 py-3">
                                    <EquipmentStatusBadge status={item.status} />
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
                                                <span className="sr-only">
                                                    Menu aksi
                                                </span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            align="end"
                                            className="w-44"
                                        >
                                            <DropdownMenuItem asChild>
                                                <Link
                                                    href={route(
                                                        "admin.equipment.show",
                                                        item.id,
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
                                                        "admin.equipment.edit",
                                                        item.id,
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
                                                onClick={() => onDelete(item)}
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
