import { cn } from "@/lib/utils";

function initialsFromName(name) {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AvatarInitials({ name, className, size = "md" }) {
    const sizes = {
        sm: "h-8 w-8 text-xs",
        md: "h-10 w-10 text-sm",
        lg: "h-14 w-14 text-base",
        xl: "h-20 w-20 text-xl",
    };

    return (
        <div
            className={cn(
                "flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary ring-2 ring-background",
                sizes[size],
                className,
            )}
            aria-hidden
        >
            {initialsFromName(name)}
        </div>
    );
}
