import { createContext, useCallback, useContext, useMemo, useState } from "react";

const PageMetaContext = createContext({
    title: null,
    breadcrumbs: [],
    setMeta: () => {},
});

export function PageMetaProvider({ children }) {
    const [meta, setMetaState] = useState({ title: null, breadcrumbs: [] });

    const setMeta = useCallback((next) => {
        setMetaState((prev) => {
            const title = next?.title ?? null;
            const breadcrumbs = Array.isArray(next?.breadcrumbs)
                ? next.breadcrumbs
                : [];
            if (
                prev.title === title &&
                JSON.stringify(prev.breadcrumbs) === JSON.stringify(breadcrumbs)
            ) {
                return prev;
            }
            return { title, breadcrumbs };
        });
    }, []);

    const value = useMemo(
        () => ({
            title: meta.title,
            breadcrumbs: meta.breadcrumbs,
            setMeta,
        }),
        [meta, setMeta],
    );

    return (
        <PageMetaContext.Provider value={value}>
            {children}
        </PageMetaContext.Provider>
    );
}

export function usePageMeta() {
    return useContext(PageMetaContext);
}
