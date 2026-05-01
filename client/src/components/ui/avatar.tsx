import { cn } from "@/lib/utils"

// shadcn Avatar — user profile picture with fallback initials
interface AvatarProps {
  src?: string | null
  name: string
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-12 h-12 text-base",
}

// generates a deterministic color from a name string
// so each user always gets the same color (no randomness)
const nameToColor = (name: string): string => {
  const colors = [
    "from-violet-500 to-purple-600",
    "from-blue-500 to-cyan-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-rose-500 to-pink-500",
    "from-indigo-500 to-blue-500",
    "from-fuchsia-500 to-pink-500",
    "from-lime-500 to-green-500",
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          "rounded-full object-cover ring-2 ring-white dark:ring-zinc-900",
          sizeClasses[size],
          className
        )}
      />
    )
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-medium text-white bg-gradient-to-br ring-2 ring-white dark:ring-zinc-900",
        sizeClasses[size],
        nameToColor(name),
        className
      )}
      title={name}
    >
      {initials}
    </div>
  )
}

export { Avatar }
