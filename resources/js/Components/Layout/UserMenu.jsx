import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";

import { router } from "@inertiajs/react";
import { LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";

function initialsFromName(name) {
    if (!name || typeof name !== "string") return "?";

    const parts = name.trim().split(/\s+/);

    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function UserMenu({ user, align = "end" }) {
    if (!user) return null;

    const initials = initialsFromName(user.name);

    const handleLogout = () => {
        router.post(route("logout"));
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                        "bg-primary text-primary-foreground text-xs font-semibold tracking-tight",
                        "ring-2 ring-background ring-offset-2 ring-offset-card",
                        "hover:bg-primary/90",
                        "focus-visible:outline-none focus-visible:ring-2",
                        "focus-visible:ring-ring focus-visible:ring-offset-2",
                    )}
                    aria-label="Menu akun"
                >
                    {initials}
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align={align} className="w-64">
                <DropdownMenuLabel className="space-y-1">
                    <p className="truncate text-sm font-semibold">
                        {user.name}
                    </p>

                    {user.email && (
                        <p className="truncate text-xs text-muted-foreground font-normal">
                            {user.email}
                        </p>
                    )}

                    {user.role && (
                        <p className="text-xs capitalize text-muted-foreground font-normal">
                            {user.role}
                        </p>
                    )}
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={() => router.visit(route("profile.edit"))}
                    className="cursor-pointer"
                >
                    <User className="mr-2 h-4 w-4" />
                    Profil
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={handleLogout}
                    variant="destructive"
                    className="cursor-pointer text-destructive focus:text-destructive"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Keluar
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
