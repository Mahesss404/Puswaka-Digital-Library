import React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const textVariants = cva(
  "text-foreground",
  {
    variants: {
      size: {
        default: "text-base",
        xs: "text-xs",
        sm: "text-sm",
        lg: "text-lg font-semibold",
        xl: "text-xl font-bold",
        "2xl": "text-2xl font-bold",
        "3xl": "text-3xl font-bold",
      },
      variant: {
        default: "text-foreground",
        muted: "text-muted-foreground",
      }
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
)

const Text = React.forwardRef(({ className, size, variant, as = "p", ...props }, ref) => {
  const Comp = as
  return (
    <Comp
      ref={ref}
      className={cn(textVariants({ size, variant, className }))}
      {...props}
    />
  )
})
Text.displayName = "Text"

export { Text, textVariants }
