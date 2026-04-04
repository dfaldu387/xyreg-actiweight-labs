import { forwardRef, useEffect } from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = ({ children, ...props }: any) => {
  return (
    <TooltipPrimitive.Root {...props}>
      {children}
    </TooltipPrimitive.Root>
  )
}

const TooltipTrigger = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ ...props }, ref) => (
  <TooltipPrimitive.Trigger ref={ref} {...props as any} />
))
TooltipTrigger.displayName = "TooltipTrigger"

const TooltipContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { sideOffset?: number; side?: "top" | "right" | "bottom" | "left"; align?: "start" | "center" | "end"; avoidCollisions?: boolean }
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden ml-[28px] rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props as any}
    />
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = "TooltipContent"

// Create a component that applies global tooltip styles
export const TooltipStyles = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      [data-tooltip-disabled="true"] > *[data-state] {
        pointer-events: none !important;
      }
      
      [data-tooltip-disabled="true"] * {
        pointer-events: auto !important;
      }
      
      [data-tooltip-disabled="true"] [data-radix-tooltip-trigger],
      [data-tooltip-disabled="true"] [role="tooltip"],
      .disable-tooltips [data-radix-tooltip-trigger],
      .disable-tooltips [role="tooltip"] {
        pointer-events: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
      }
      
      .no-tooltip * [data-radix-tooltip-trigger] {
        pointer-events: none !important;
      }
      
      /* Prevent any portals from tooltips from showing */
      [data-tooltip-disabled="true"] ~ [data-radix-portal] {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return null;
};

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }