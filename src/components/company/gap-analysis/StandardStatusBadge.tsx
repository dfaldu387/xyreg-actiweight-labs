import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { StandardVersionStatus } from '@/hooks/useStandardVersionStatus';

interface StandardStatusBadgeProps {
  status?: StandardVersionStatus;
  compact?: boolean;
}

export function StandardStatusBadge({ status, compact = false }: StandardStatusBadgeProps) {
  if (!status) return null;

  const isInForce = status.status === 'In Force';
  const lastChecked = status.last_checked_at
    ? new Date(status.last_checked_at).toLocaleDateString()
    : 'Never';

  const badge = (
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
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
