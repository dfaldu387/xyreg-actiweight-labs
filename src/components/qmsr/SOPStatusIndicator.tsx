/**
 * SOPStatusIndicator - Visual SOP health indicator for QMS node cards
 * 
 * Shows a colored dot indicating the status of linked SOPs:
 * - Green (Emerald): All SOPs approved
 * - Yellow (Amber): Some SOPs in progress
 * - Red: No SOPs linked or required SOPs missing
 * - Gray: Node has no SOP requirements
 */

import React from 'react';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type SOPStatus = 'complete' | 'in-progress' | 'missing' | 'na';

export interface SOPStatusCount {
  total: number;
  approved: number;
  pending: number;
}

interface SOPStatusIndicatorProps {
  status: SOPStatus;
  counts?: SOPStatusCount;
  onClick?: () => void;
  className?: string;
}

const STATUS_CONFIG: Record<SOPStatus, {
  color: string;
  bgColor: string;
  label: string;
}> = {
  complete: {
    color: 'bg-emerald-500',
    bgColor: 'bg-emerald-50',
    label: 'All SOPs Approved',
  },
  'in-progress': {
    color: 'bg-amber-500',
    bgColor: 'bg-amber-50',
    label: 'SOPs In Progress',
  },
  missing: {
    color: 'bg-red-500',
    bgColor: 'bg-red-50',
    label: 'SOPs Missing',
  },
  na: {
    color: 'bg-slate-400',
    bgColor: 'bg-slate-50',
    label: 'No SOP Requirements',
  },
};

function getTooltipText(status: SOPStatus, counts?: SOPStatusCount): string {
  if (status === 'na') return 'No SOP requirements for this node';
  if (status === 'missing') return 'No SOPs linked - click to add';
  
  if (counts) {
    const { total, approved, pending } = counts;
    if (approved === total && total > 0) {
      return `${approved}/${total} SOPs Approved`;
    }
    return `${approved}/${total} SOPs Approved${pending > 0 ? `, ${pending} pending` : ''}`;
  }
  
  return STATUS_CONFIG[status].label;
}

export function SOPStatusIndicator({
  status,
  counts,
  onClick,
  className,
}: SOPStatusIndicatorProps) {
  const config = STATUS_CONFIG[status];
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center gap-1.5 px-1 py-0.5 -ml-1 rounded transition-colors nodrag nopan',
              onClick && 'cursor-pointer hover:bg-slate-100',
              className
            )}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerDownCapture={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onClick?.();
            }}
          >
            <FileText className="h-3 w-3 text-slate-500" />
            <span className="text-[10px] text-slate-500 font-medium">SOPs</span>
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                config.color,
                status === 'missing' && 'animate-pulse'
              )}
            />
            {counts && counts.total > 0 && (
              <span className="text-[9px] text-slate-400">
                {counts.approved}/{counts.total}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {getTooltipText(status, counts)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Calculate SOP status based on linked SOPs and expected count
 */
export function calculateSOPStatus(
  linkedCount: number,
  approvedCount: number,
  expectedCount: number
): SOPStatus {
  if (expectedCount === 0) return 'na';
  if (linkedCount === 0) return 'missing';
  
  if (approvedCount === linkedCount && linkedCount >= expectedCount) {
    return 'complete';
  }
  
  return 'in-progress';
}
