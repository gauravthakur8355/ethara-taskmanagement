import * as React from "react"
import { cn } from "@/lib/utils"

// shadcn-style Select — custom dropdown without radix
// keeps things lightweight while looking premium
interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  placeholder?: string
  className?: string
  disabled?: boolean
}

function Select({ value, onValueChange, children, placeholder, className, disabled }: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      disabled={disabled}
      className={cn(
        "flex h-11 w-full items-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus-visible:ring-zinc-300 appearance-none cursor-pointer",
        !value && "text-zinc-400",
        className
      )}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {children}
    </select>
  )
}

function SelectOption({ value, children }: { value: string; children: React.ReactNode }) {
  return <option value={value}>{children}</option>
}

export { Select, SelectOption }
