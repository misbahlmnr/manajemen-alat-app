import { cn } from "@/lib/utils";
import { Package, Wrench } from "lucide-react";

export default function EquipmentImage({
    imageUrl,
    name,
    itemType = "alat",
    className,
    iconClassName = "h-8 w-8",
}) {
    const Icon = itemType === "bahan" ? Package : Wrench;

    if (imageUrl) {
        return (
            <img
                src={imageUrl}
                alt={name}
                className={cn("object-cover", className)}
            />
        );
    }

    return (
        <div
            className={cn(
                "flex items-center justify-center bg-muted text-muted-foreground",
                className,
            )}
        >
            <Icon className={iconClassName} />
        </div>
    );
}
