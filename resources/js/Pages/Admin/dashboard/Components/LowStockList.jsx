export default function LowStockList({ items }) {
    return (
        <div className="grid gap-3 sm:grid-cols-2">
            {items.map((item) => (
                <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-warning/20 bg-warning/5 px-4 py-3"
                >
                    <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                            Min. stok: {item.minStock} {item.unit ?? "unit"}
                        </p>
                    </div>
                    <span className="text-sm font-semibold text-warning">
                        {item.stockRemaining ?? item.available} tersisa
                    </span>
                </div>
            ))}
        </div>
    );
}
