import { cn } from "@/lib/utils"

// skeleton loader — shows a pulsing placeholder while content loads
// gives the user something to look at instead of a blank screen
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800", className)}
      {...props}
    />
  )
}

export { Skeleton }
