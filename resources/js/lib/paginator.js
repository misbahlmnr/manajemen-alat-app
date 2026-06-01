/**
 * Normalizes Laravel LengthAwarePaginator props for Inertia.
 * Supports both flat ({ total, current_page, ... }) and nested ({ meta: { ... } }) shapes.
 */
export function normalizePaginator(paginator) {
    if (!paginator) {
        return null;
    }

    const meta = paginator.meta ?? {
        current_page: paginator.current_page,
        last_page: paginator.last_page,
        from: paginator.from,
        to: paginator.to,
        total: paginator.total,
        per_page: paginator.per_page,
    };

    return {
        links: paginator.links ?? [],
        meta,
    };
}

export function paginatorTotal(paginator) {
    return paginator?.meta?.total ?? paginator?.total ?? 0;
}
