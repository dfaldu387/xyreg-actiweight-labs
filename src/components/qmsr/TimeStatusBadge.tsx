/**
 * TimeStatusBadge - Shows "Days Since Last Update" on nodes
 * 
 * Displays a small badge with time-based status:
 * - Green: < 30 days (recent)
 * - Amber: 30-90 days (attention)
 * - Red: > 90 days (overdue)
 */

import React from 'react';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type TimeStatus = 'recent' | 'attention' | 'overdue' | 'unknown';

interface TimeStatusBadgeProps {
  daysSinceUpdate: number | null;
  lastUpdated: string | null;
  className?: string;
}

// Thresholds (in days)
export const TIME_STATUS_THRESHOLDS = {
  recent: 30,
  attention: 90,
};

/**
 * Calculate time status from days since update
 */
export function getTimeStatus(daysSinceUpdate: number | null): TimeStatus {
  if (daysSinceUpdate === null) return 'unknown';
  if (daysSinceUpdate <= TIME_STATUS_THRESHOLDS.recent) return 'recent';
  if (daysSinceUpdate <= TIME_STATUS_THRESHOLDS.attention) return 'attention';
  return 'overdue';
}

/**
 * Calculate days since a given date
 */
export function calculateDaysSince(dateString: string | null): number | null {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

const timeStatusConfig = {
  recent: {
    icon: CheckCircle,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    label: 'Recently updated',
  },
  attention: {
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    label: 'Review recommended',
  },
  overdue: {
    icon: AlertCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    label: 'Overdue for review',
  },
  unknown: {
    icon: Clock,
    color: 'text-slate-400',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    label: 'No update recorded',
  },
};

/**
 * Format days into a readable string
 */
function formatDays(days: number | null): string {
  if (days === null) return 'Never';
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days}d ago`;
  if (days < 365) {
    const months = Math.floor(days / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }
  const years = Math.floor(days / 365);
  return years === 1 ? '1 year ago' : `${years} years ago`;
}

export function TimeStatusBadge({
  daysSinceUpdate,
  lastUpdated,
  className,
}: TimeStatusBadgeProps) {
  const status = getTimeStatus(daysSinceUpdate);
  const config = timeStatusConfig[status];
  const Icon = config.icon;
  
  const formattedTime = formatDays(daysSinceUpdate);
  const fullDate = lastUpdated 
    ? new Date(lastUpdated).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Never updated';
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium border',
              config.bg,
              config.border,
              config.color,
              className
            )}
          >
            <Icon className="h-2.5 w-2.5" />
            <span>{formattedTime}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-white border-slate-200 text-slate-700"
        >
          <div className="text-xs">
            <p className="font-medium">{config.label}</p>
            <p className="text-slate-500">Last updated: {fullDate}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
