import { usePageMeta } from "@/Components/Layout/PageMetaContext";
import { useEffect } from "react";

export function DashboardPageHeader({ title, subtitle }) {
    const { setMeta } = usePageMeta();

    useEffect(() => {
        setMeta({
            title: title || "Dashboard",
            breadcrumbs: title ? [{ label: "Dashboard" }] : [],
        });
        return () => setMeta({ title: null, breadcrumbs: [] });
    }, [title, setMeta]);

    return (
        <div className="mb-6">
            <div className="rounded-[10px] border border-[#E5E7EB] bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Lab Audio Video · SMKN 7 Bekasi
                </p>
                <h1 className="mt-2 font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    {title}
                </h1>
                {subtitle && (
                    <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
}
