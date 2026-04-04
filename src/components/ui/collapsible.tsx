import * as React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

const Collapsible = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { open?: boolean; onOpenChange?: (open: boolean) => void; defaultOpen?: boolean }
>(({ ...props }, ref) => (
  <CollapsiblePrimitive.Root ref={ref} {...props as any} />
))
Collapsible.displayName = "Collapsible"

const CollapsibleTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ ...props }, ref) => (
  <CollapsiblePrimitive.CollapsibleTrigger ref={ref} {...props as any} />
))
CollapsibleTrigger.displayName = "CollapsibleTrigger"

const CollapsibleContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { forceMount?: true }
>(({ ...props }, ref) => (
  <CollapsiblePrimitive.CollapsibleContent ref={ref} {...props as any} />
))
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }