import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// shadcn Badge — small status indicators and labels
const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors border",
  {
    variants: {
      variant: {
        default: "bg-zinc-900 text-white border-transparent dark:bg-zinc-100 dark:text-zinc-900",
        secondary: "bg-zinc-100 text-zinc-900 border-transparent dark:bg-zinc-800 dark:text-zinc-100",
        outline: "text-zinc-700 border-zinc-200 dark:text-zinc-300 dark:border-zinc-700",
        destructive: "bg-red-100 text-red-700 border-transparent dark:bg-red-950 dark:text-red-400",
        success: "bg-emerald-100 text-emerald-700 border-transparent dark:bg-emerald-950 dark:text-emerald-400",
        warning: "bg-amber-100 text-amber-700 border-transparent dark:bg-amber-950 dark:text-amber-400",
        info: "bg-blue-100 text-blue-700 border-transparent dark:bg-blue-950 dark:text-blue-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
