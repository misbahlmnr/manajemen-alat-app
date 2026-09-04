import { usePageMeta } from "@/Components/Layout/PageMetaContext";
import { useEffect, useMemo } from "react";

export default function PageHeader({
    title,
    subtitle,
    breadcrumbs = [],
    children,
}) {
    const { setMeta } = usePageMeta();
    const crumbsKey = useMemo(
        () => JSON.stringify(breadcrumbs),
        [breadcrumbs],
    );

    useEffect(() => {
        const crumbs =
            breadcrumbs.length > 0
                ? breadcrumbs
                : title
                  ? [{ label: title }]
                  : [];

        setMeta({ title, breadcrumbs: crumbs });

        return () => setMeta({ title: null, breadcrumbs: [] });
    }, [title, crumbsKey, setMeta, breadcrumbs]);

    return (
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
                <h1 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    {title}
                </h1>
                {subtitle && (
                    <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                        {subtitle}
                    </p>
                )}
            </div>
            {children && (
                <div className="flex flex-wrap items-center gap-2">{children}</div>
            )}
        </div>
    );
}
