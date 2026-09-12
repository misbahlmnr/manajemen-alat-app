import { AlertTriangle } from "lucide-react";

export default function LowStockList({ items }) {
    return (
        <div className="grid gap-3 sm:grid-cols-2">
            {items.map((item) => (
                <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50/70 px-4 py-3"
                >
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700">
                            <AlertTriangle className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                                {item.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Min. stok: {item.minStock} {item.unit ?? "unit"}
                            </p>
                        </div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-amber-800">
                        {item.stockRemaining ?? item.available} tersisa
                    </span>
                </div>
            ))}
        </div>
    );
}
