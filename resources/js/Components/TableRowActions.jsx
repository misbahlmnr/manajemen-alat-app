import { Link } from "@inertiajs/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { Button } from "@/Components/ui/button";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

export default function TableRowActions({ showHref, editHref, onDelete }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Menu aksi</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem asChild>
                    <Link href={showHref} className="cursor-pointer">
                        <Eye className="mr-2 h-4 w-4" />
                        Detail
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href={editHref} className="cursor-pointer">
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={onDelete}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
