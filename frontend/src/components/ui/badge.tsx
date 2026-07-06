import * as React from "react"
import { cn } from "@/lib/utils"

type Variant = "default" | "pro" | "warning"

const variantClasses: Record<Variant, string> = {
  default: "bg-white/5 border-border text-text-muted",
  pro: "bg-gradient-to-r from-amber-400 to-amber-500 text-black border-transparent",
  warning: "bg-warning/10 border-warning/30 text-warning",
}

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full border px-3 py-0.5 text-xs font-bold uppercase tracking-wide",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}
