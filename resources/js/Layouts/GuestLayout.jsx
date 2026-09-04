import BrandLogo from "@/Components/BrandLogo";
import { Link } from "@inertiajs/react";

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-background px-4 pt-8 sm:justify-center sm:pt-0">
            <div>
                <Link
                    href="/"
                    className="flex flex-col items-center gap-3 transition-opacity hover:opacity-90"
                >
                    <BrandLogo
                        size={56}
                        className="rounded-[10px] bg-card p-1.5 shadow-[var(--shadow-card)] ring-1 ring-border"
                    />
                    <div className="text-center">
                        <p className="font-display text-sm font-bold text-foreground">
                            Lab Audio Video
                        </p>
                        <p className="text-xs text-muted-foreground">
                            SMKN 7 Bekasi
                        </p>
                    </div>
                </Link>
            </div>

            <div className="mt-8 w-full overflow-hidden rounded-[10px] border border-border bg-card px-6 py-6 shadow-[var(--shadow-card)] sm:max-w-md">
                {children}
            </div>
        </div>
    );
}
