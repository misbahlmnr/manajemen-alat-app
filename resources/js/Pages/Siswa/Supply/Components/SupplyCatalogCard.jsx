import SupplyStockBadge from "@/Components/SupplyStockBadge";
import StatusBadge from "@/Components/StatusBadge";
import { Button } from "@/Components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import { Link } from "@inertiajs/react";
import { Eye, Package, PackagePlus } from "lucide-react";

export default function SupplyCatalogCard({ supply }) {
    return (
        <Card className="flex h-full flex-col rounded-2xl border-border/60 shadow-card transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-warning/10">
                        <Package className="h-6 w-6 text-warning" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <CardTitle className="line-clamp-2 text-base leading-snug">
                            {supply.name}
                        </CardTitle>
                        <CardDescription className="font-mono text-xs">
                            {supply.code}
                        </CardDescription>
                    </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <SupplyStockBadge label={supply.stock_label} />
                    <StatusBadge status={supply.status} />
                </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-3 pb-3 text-sm">
                <p className="text-muted-foreground">{supply.category}</p>
                {supply.description && (
                    <p className="line-clamp-2 text-muted-foreground">
                        {supply.description}
                    </p>
                )}
                <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 px-3 py-2">
                    <span className="text-muted-foreground">Stok tersedia</span>
                    <span className="font-semibold tabular-nums text-foreground">
                        {supply.available}{" "}
                        <span className="font-normal text-muted-foreground">
                            {supply.unit}
                        </span>
                    </span>
                </div>
                {supply.min_stock != null && (
                    <p className="text-xs text-muted-foreground">
                        Stok minimum:{" "}
                        <span className="font-medium text-foreground">
                            {supply.min_stock} {supply.unit}
                        </span>
                    </p>
                )}
                <p className="text-xs text-muted-foreground">
                    Lokasi:{" "}
                    <span className="font-medium text-foreground">
                        {supply.location}
                    </span>
                </p>
            </CardContent>

            <CardFooter className="flex gap-2 border-t border-border/60 pt-4">
                <Button variant="outline" className="flex-1" asChild>
                    <Link href={supply.show_url}>
                        <Eye className="mr-2 h-4 w-4" />
                        Detail
                    </Link>
                </Button>
                {supply.can_request && supply.request_url && (
                    <Button className="flex-1" asChild>
                        <Link href={supply.request_url}>
                            <PackagePlus className="mr-2 h-4 w-4" />
                            Ambil
                        </Link>
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
