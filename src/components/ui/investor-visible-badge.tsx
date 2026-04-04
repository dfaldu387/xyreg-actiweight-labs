import React from 'react';
import { Eye } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface InvestorVisibleBadgeProps {
  className?: string;
}

export function InvestorVisibleBadge({ className }: InvestorVisibleBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span 
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
              "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
              "cursor-help select-none",
              className
            )}
          >
            <Eye className="h-3 w-3" />
            <span>Visible to Investors</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p>This field will appear on your public Investor View page when sharing with potential investors.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Compact icon-only version for tab indicators
export function InvestorVisibleIcon({ className }: { className?: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span 
            className={cn(
              "inline-flex items-center justify-center h-5 w-5 rounded-full",
              "bg-indigo-50 dark:bg-indigo-950/50 cursor-help",
              className
            )}
          >
            <Eye className="h-3 w-3 text-indigo-700 dark:text-indigo-300" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Visible on Investor View page</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
