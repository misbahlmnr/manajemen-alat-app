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
    Check,
    Eye,
    MoreHorizontal,
    PackageCheck,
    RotateCcw,
    Trash2,
    X,
} from "lucide-react";

export default function LoanTableActions({ loan, onDelete, onReject, onReturn }) {
    const post = (routeName, data = {}) => {
        router.post(route(routeName, loan.id), data, { preserveScroll: true });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Menu aksi</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                    <Link
                        href={route("admin.loans.show", loan.id)}
                        className="cursor-pointer"
                    >
                        <Eye className="mr-2 h-4 w-4" />
                        Detail
                    </Link>
                </DropdownMenuItem>
                {loan.can_approve && (
                    <DropdownMenuItem
                        className="cursor-pointer text-emerald-700 focus:text-emerald-700"
                        onClick={() => post("admin.loans.approve")}
                    >
                        <Check className="mr-2 h-4 w-4" />
                        Setujui
                    </DropdownMenuItem>
                )}
                {loan.can_reject && (
                    <DropdownMenuItem
                        className="cursor-pointer text-destructive focus:text-destructive"
                        onClick={() => onReject(loan)}
                    >
                        <X className="mr-2 h-4 w-4" />
                        Tolak
                    </DropdownMenuItem>
                )}
                {loan.can_mark_borrowed && (
                    <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => post("admin.loans.mark-borrowed")}
                    >
                        <PackageCheck className="mr-2 h-4 w-4" />
                        {loan.item_type === "bahan"
                            ? "Tandai Diambil"
                            : "Tandai Dipinjam"}
                    </DropdownMenuItem>
                )}
                {loan.can_return && (
                    <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => onReturn(loan)}
                    >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Proses Pengembalian
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={() => onDelete(loan)}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
