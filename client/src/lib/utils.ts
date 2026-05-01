import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// shadcn's cn() utility — merges tailwind classes without conflicts
// e.g., cn("px-4", "px-6") → "px-6" (not "px-4 px-6")
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
