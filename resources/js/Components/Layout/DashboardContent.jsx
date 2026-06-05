import { cn } from "@/lib/utils";

export default function DashboardContent({ children, className }) {
    return (
        <main className={cn("min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-4 lg:p-6", className)}>
            {children}
        </main>
    );
}
