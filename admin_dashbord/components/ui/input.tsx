import * as React from "react"
import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base
        "h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-sm  transition-colors outline-none",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "placeholder:text-muted-foreground",

        // Border & background
        "border-input hover:border-blue-400 dark:bg-input/30",

        // Focus (blue)
        "focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/40",

        // Selection
        "selection:bg-blue-500 selection:text-white",

        // Disabled
        "disabled:cursor-not-allowed disabled:opacity-50",

        // Error
        "aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/30",

        className
      )}
      {...props}
    />
  )
}

export { Input }
