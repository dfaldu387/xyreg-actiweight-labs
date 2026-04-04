
import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    // Internal ref for focus management
    const internalRef = React.useRef<HTMLInputElement>(null);
    const combinedRef = React.useMemo(() => {
      if (typeof ref === 'function') {
        return (node: HTMLInputElement | null) => {
          if (internalRef.current) {
            internalRef.current = node;
          }
          ref(node);
        };
      }
      return ref || internalRef;
    }, [ref]);

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm [&:not(:disabled)]:bg-[hsl(var(--secondary))]",
          className
        )}
        ref={combinedRef}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
