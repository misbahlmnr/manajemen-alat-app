import * as React from "react"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-border bg-muted text-foreground",
        secondary:
          "border-border bg-muted text-foreground",
        destructive:
          "border-red-200/70 bg-red-50 text-red-800/80",
        success:
          "border-slate-200 bg-slate-100 text-slate-700",
        warning:
          "border-amber-200/80 bg-amber-50 text-amber-900/80",
        info:
          "border-slate-200 bg-slate-100 text-slate-700",
        outline: "border-border bg-card text-foreground",
        muted: "border-border bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}) {
  return (<div className={cn(badgeVariants({ variant }), className)} {...props} />);
}

export { Badge, badgeVariants }
