import React from 'react';
import { cn } from '@/lib/utils';
import { CAPAStatus, CAPA_STATUS_LABELS } from '@/types/capa';
import { Check, Circle, AlertTriangle, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from '@/hooks/useTranslation';

interface CAPAStateProgressProps {
  currentStatus: CAPAStatus;
  className?: string;
}

const STATES_ORDER: CAPAStatus[] = [
  'draft',
  'triage',
  'investigation',
  'planning',
  'implementation',
  'verification',
  'closed'
];

const STATE_COLORS: Record<CAPAStatus, { bg: string; text: string; border: string }> = {
  draft: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-muted-foreground' },
  triage: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-500' },
  investigation: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-500' },
  planning: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-500' },
  implementation: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-500' },
  verification: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-400', border: 'border-cyan-500' },
  closed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', border: 'border-green-500' },
  rejected: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-500' }
};

export function CAPAStateProgress({ currentStatus, className }: CAPAStateProgressProps) {
  const currentIndex = STATES_ORDER.indexOf(currentStatus);
  const isRejected = currentStatus === 'rejected';
  const { lang } = useTranslation();

  if (isRejected) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-destructive/20 border-2 border-destructive">
          <X className="h-4 w-4 text-destructive" />
        </div>
        <span className="text-sm font-medium text-destructive">{lang('capa.rejected')}</span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-1", className)}>
        {STATES_ORDER.map((status, index) => {
          const isPast = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;
          const colors = STATE_COLORS[status];

          return (
            <React.Fragment key={status}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all",
                      isPast && "bg-primary border-primary",
                      isCurrent && cn(colors.bg, colors.border),
                      isFuture && "bg-muted/50 border-muted-foreground/30"
                    )}
                  >
                    {isPast ? (
                      <Check className="h-4 w-4 text-primary-foreground" />
                    ) : isCurrent ? (
                      <Circle className={cn("h-3 w-3 fill-current", colors.text)} />
                    ) : (
                      <Circle className="h-3 w-3 text-muted-foreground/30" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{CAPA_STATUS_LABELS[status]}</p>
                </TooltipContent>
              </Tooltip>

              {index < STATES_ORDER.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-4 transition-all",
                    index < currentIndex ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

// Compact badge version
export function CAPAStatusBadge({ status }: { status: CAPAStatus }) {
  const colors = STATE_COLORS[status];

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
      colors.bg,
      colors.text
    )}>
      {CAPA_STATUS_LABELS[status]}
    </span>
  );
}
