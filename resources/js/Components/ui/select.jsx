import * as React from "react";
import { cn } from "@/lib/utils";

const Select = React.forwardRef(({ className, children, ...props }, ref) => (
    <select
        ref={ref}
        className={cn(
            "flex h-10 w-full rounded-[8px] border border-[#E5E7EB] bg-card px-3 py-2 text-sm transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
        )}
        {...props}
    >
        {children}
    </select>
));
Select.displayName = "Select";

export { Select };
