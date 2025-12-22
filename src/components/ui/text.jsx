import * as React from "react";
import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";

const textVariants = cva("text-foreground", {
  variants: {
    size: {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
      xl: "text-xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

const Text = React.forwardRef(({ className, size, as: Component = "p", children, ...props }, ref) => {
  return (
    <Component
      ref={ref}
      className={cn(textVariants({ size }), className)}
      {...props}
    >
      {children}
    </Component>
  );
});

Text.displayName = "Text";

export { Text, textVariants };
