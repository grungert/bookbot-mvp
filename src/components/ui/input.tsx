import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base styles
        "h-10 w-full min-w-0 rounded-lg px-3 py-2 text-base md:text-sm",
        "bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm",
        "border border-blue-200/50 dark:border-blue-500/20",
        "placeholder:text-muted-foreground/60",
        "transition-all duration-200 outline-none",
        // Focus styles - blue/purple gradient glow
        "focus-visible:border-blue-400/60 dark:focus-visible:border-blue-400/40",
        "focus-visible:ring-2 focus-visible:ring-blue-500/20 dark:focus-visible:ring-blue-400/20",
        "focus-visible:bg-white/70 dark:focus-visible:bg-gray-900/70",
        // Hover styles
        "hover:border-blue-300/60 dark:hover:border-blue-400/30",
        // Selection styles
        "selection:bg-blue-500/20 selection:text-foreground",
        // File input styles
        "file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        // Disabled styles
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // Invalid/error styles
        "aria-invalid:border-red-400/60 aria-invalid:ring-red-500/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
