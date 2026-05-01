import React from "react";
import { BookOpen } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface NodeHelpPopoverProps {
  title: string;
  body: React.ReactNode;
  isoClause?: string;
  size?: "sm" | "md";
  ariaLabel?: string;
  className?: string;
}

/**
 * Single, unified inline help affordance used across the RBR node detail drawer.
 * One icon, one popover style — replaces the previous 4 mismatched flavors
 * (Sheet, custom popover, pill button, tooltip).
 */
export function NodeHelpPopover({
  title,
  body,
  isoClause,
  size = "sm",
  ariaLabel,
  className,
}: NodeHelpPopoverProps) {
  const iconSize = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          aria-label={ariaLabel ?? title}
          className={cn(
            "inline-flex items-center justify-center rounded text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors",
            size === "md" ? "h-7 w-7" : "h-6 w-6",
            className,
          )}
        >
          <BookOpen className={iconSize} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="left"
        align="start"
        sideOffset={12}
        className="w-80 text-xs leading-relaxed z-[60] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-semibold text-sm mb-1.5 text-foreground">{title}</p>
        <div className="text-muted-foreground space-y-2">{body}</div>
        {isoClause && (
          <p className="mt-2 text-[10px] font-mono text-purple-600">
            ISO 13485 §{isoClause}
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}