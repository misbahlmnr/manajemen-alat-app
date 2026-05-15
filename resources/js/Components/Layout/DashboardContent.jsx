import { cn } from "@/lib/utils";

export default function DashboardContent({ children, className }) {
    return (
        <main
            className={cn(
                "flex-1 overflow-x-auto bg-background p-4 md:p-6",
                className,
            )}
        >
            {children}
        </main>
    );
}
