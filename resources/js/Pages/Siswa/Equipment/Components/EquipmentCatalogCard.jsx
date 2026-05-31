import AvailabilityBadge from "@/Components/AvailabilityBadge";
import ConditionBadge from "@/Pages/Admin/Equipment/Components/ConditionBadge";
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
import { Box, Eye, FileText } from "lucide-react";

export default function EquipmentCatalogCard({ equipment }) {
    return (
        <Card className="flex h-full flex-col rounded-2xl border-border/60 shadow-card transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <Box className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <CardTitle className="line-clamp-2 text-base leading-snug">
                            {equipment.name}
                        </CardTitle>
                        <CardDescription className="font-mono text-xs">
                            {equipment.code}
                        </CardDescription>
                    </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <AvailabilityBadge label={equipment.availability_label} />
                    <ConditionBadge condition={equipment.condition} />
                </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-3 pb-3 text-sm">
                <p className="text-muted-foreground">{equipment.category}</p>
                {equipment.description && (
                    <p className="line-clamp-2 text-muted-foreground">
                        {equipment.description}
                    </p>
                )}
                <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 px-3 py-2">
                    <span className="text-muted-foreground">Stok tersedia</span>
                    <span className="font-semibold tabular-nums text-foreground">
                        {equipment.available}{" "}
                        <span className="font-normal text-muted-foreground">
                            / {equipment.stock}
                        </span>
                    </span>
                </div>
                <p className="text-xs text-muted-foreground">
                    Lokasi:{" "}
                    <span className="font-medium text-foreground">
                        {equipment.location}
                    </span>
                </p>
            </CardContent>

            <CardFooter className="flex gap-2 border-t border-border/60 pt-4">
                <Button variant="outline" className="flex-1" asChild>
                    <Link href={equipment.show_url}>
                        <Eye className="mr-2 h-4 w-4" />
                        Detail
                    </Link>
                </Button>
                {equipment.can_borrow && equipment.borrow_url && (
                    <Button className="flex-1" asChild>
                        <Link href={equipment.borrow_url}>
                            <FileText className="mr-2 h-4 w-4" />
                            Pinjam
                        </Link>
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
