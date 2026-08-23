import { Button } from "@/Components/ui/button";
import { FileSpreadsheet, FileText } from "lucide-react";

export default function ReportExportCard({ onExportPdf, onExportExcel }) {
    return (
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <h3 className="text-base font-semibold text-foreground">
                Export Laporan
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
                Unduh laporan berdasarkan filter yang dipilih.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
                <Button
                    type="button"
                    onClick={onExportPdf}
                    className="bg-red-600 hover:bg-red-700"
                >
                    <FileText className="mr-2 h-4 w-4" />
                    Export PDF
                </Button>
                <Button
                    type="button"
                    onClick={onExportExcel}
                    className="bg-emerald-600 hover:bg-emerald-700"
                >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export Excel
                </Button>
            </div>
        </div>
    );
}
