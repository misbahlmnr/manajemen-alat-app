import { cn } from "@/lib/utils";

export default function DashboardContent({ children, className }) {
    return (
        <main className={cn("min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-5 lg:p-7", className)}>
            {children}
        </main>
    );
}
