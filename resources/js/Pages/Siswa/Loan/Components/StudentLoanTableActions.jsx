import { Link } from "@inertiajs/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { Button } from "@/Components/ui/button";
import { Eye, MoreHorizontal, RotateCcw, X } from "lucide-react";

export default function StudentLoanTableActions({
    loan,
    onCancel,
    onRequestReturn,
}) {
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
                        href={route("siswa.loans.show", loan.id)}
                        className="cursor-pointer"
                    >
                        <Eye className="mr-2 h-4 w-4" />
                        Detail
                    </Link>
                </DropdownMenuItem>
                {loan.can_request_return && (
                    <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => onRequestReturn(loan)}
                    >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Ajukan Pengembalian
                    </DropdownMenuItem>
                )}
                {loan.can_cancel && (
                    <DropdownMenuItem
                        className="cursor-pointer text-destructive focus:text-destructive"
                        onClick={() => onCancel(loan)}
                    >
                        <X className="mr-2 h-4 w-4" />
                        Batalkan
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
