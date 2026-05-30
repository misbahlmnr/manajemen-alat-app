import { Link, router } from "@inertiajs/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { Button } from "@/Components/ui/button";
import {
    CheckCircle,
    CreditCard,
    Eye,
    MoreHorizontal,
    Pencil,
    Search,
    Trash2,
} from "lucide-react";

export default function CollateralTableActions({
    item,
    onDelete,
    onInspect,
}) {
    const post = (routeName) => {
        router.post(route(routeName, item.id), {}, { preserveScroll: true });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Menu aksi</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem asChild>
                    <Link
                        href={route("admin.collaterals.show", item.id)}
                        className="cursor-pointer"
                    >
                        <Eye className="mr-2 h-4 w-4" />
                        Detail
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link
                        href={route("admin.collaterals.edit", item.id)}
                        className="cursor-pointer"
                    >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                    </Link>
                </DropdownMenuItem>
                {item.can_inspect && (
                    <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => onInspect(item)}
                    >
                        <Search className="mr-2 h-4 w-4" />
                        Inspeksi Pengembalian
                    </DropdownMenuItem>
                )}
                {item.can_hold && (
                    <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => post("admin.collaterals.hold")}
                    >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Tahan Kartu
                    </DropdownMenuItem>
                )}
                {item.can_return_card && !item.can_complete_compensation && (
                    <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => post("admin.collaterals.return-card")}
                    >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Kembalikan Kartu
                    </DropdownMenuItem>
                )}
                {item.can_complete_compensation && (
                    <DropdownMenuItem
                        className="cursor-pointer text-emerald-700 focus:text-emerald-700"
                        onClick={() =>
                            post("admin.collaterals.complete-compensation")
                        }
                    >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Kompensasi Selesai
                    </DropdownMenuItem>
                )}
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
    );
}
