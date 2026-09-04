import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Logo TAV — pakai /images/logo-tav.png jika ada, fallback ke SVG.
 * variant="onDark" menambah padding/ring lembut agar shield hitam terbaca di sidebar.
 */
export default function BrandLogo({
    className,
    size = 48,
    alt = "Logo TAV",
    variant = "default",
}) {
    const [src, setSrc] = useState("/images/logo-tav.png");

    useEffect(() => {
        const img = new Image();
        img.onload = () => setSrc("/images/logo-tav.png");
        img.onerror = () => setSrc("/images/logo-tav.svg");
        img.src = "/images/logo-tav.png";
    }, []);

    return (
        <img
            src={src}
            alt={alt}
            width={size}
            height={size}
            className={cn(
                "shrink-0 object-contain bg-transparent",
                variant === "onDark"
                    ? "rounded-[8px] bg-white/95 p-1 shadow-sm ring-1 ring-white/20"
                    : "rounded-[8px]",
                className,
            )}
            style={{ width: size, height: size }}
        />
    );
}
