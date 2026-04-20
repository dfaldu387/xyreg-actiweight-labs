import React from 'react';
import { CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { StandardVersionStatus } from '@/hooks/useStandardVersionStatus';

interface StandardStatusBadgeProps {
  status?: StandardVersionStatus;
  compact?: boolean;
}

const STALE_DAYS = 7;

export function StandardStatusBadge({ status, compact = false }: StandardStatusBadgeProps) {
  if (!status) return null;

  const isInForce = status.status === 'In Force';
  const checkedDate = status.last_checked_at ? new Date(status.last_checked_at) : null;
  const lastChecked = checkedDate ? checkedDate.toLocaleDateString() : 'Never';
  const ageMs = checkedDate ? Date.now() - checkedDate.getTime() : Infinity;
  const isStale = ageMs > STALE_DAYS * 24 * 60 * 60 * 1000;

  const badge = (
    <span className="inline-flex items-center gap-1">
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
          isInForce
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}
      >
        {isInForce ? (
          <CheckCircle2 className="h-3 w-3" />
        ) : (
          <AlertTriangle className="h-3 w-3" />
        )}
        {compact ? (isInForce ? '✓' : '!') : status.status}
      </span>
      {isStale && (
        <span
          className="inline-flex h-2 w-2 rounded-full bg-amber-500"
          aria-label="Status check overdue"
        />
      )}
    </span>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="text-xs space-y-1">
            <p className="font-semibold">{status.standard_name}</p>
            <p>Status: <span className={isInForce ? 'text-emerald-600' : 'text-red-600'}>{status.status}</span></p>
            {status.successor_name && (
              <p>Replaced by: {status.successor_name}</p>
            )}
            <p className="text-muted-foreground">Last checked: {lastChecked}</p>
            {isStale && (
              <p className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                <Clock className="h-3 w-3" />
                Status check overdue (&gt;{STALE_DAYS} days)
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
