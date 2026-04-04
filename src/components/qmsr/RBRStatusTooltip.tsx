import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { RBRPulseStatus } from '@/hooks/useRBRPulseStatus';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Circle,
  ExternalLink,
  FileText,
  Shield
} from 'lucide-react';

interface RBRStatusTooltipProps {
  pulse: RBRPulseStatus;
  onAction?: (action: 'view' | 'create') => void;
}

const statusConfig = {
  dormant: {
    bg: 'bg-muted',
    border: 'border-muted-foreground/30',
    icon: Circle,
    iconColor: 'text-muted-foreground',
    actionLabel: 'Create Rationale',
    actionType: 'create' as const,
  },
  active: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500',
    icon: Clock,
    iconColor: 'text-blue-500',
    actionLabel: 'Review Pending',
    actionType: 'view' as const,
  },
  validated: {
    bg: 'bg-green-500/10',
    border: 'border-green-500',
    icon: CheckCircle,
    iconColor: 'text-green-500',
    actionLabel: 'View Records',
    actionType: 'view' as const,
  },
  critical: {
    bg: 'bg-red-500/10',
    border: 'border-red-500',
    icon: AlertTriangle,
    iconColor: 'text-red-500',
    actionLabel: 'Resolve Issues',
    actionType: 'view' as const,
  },
};

const riskColors = {
  low: 'text-green-600 bg-green-100 dark:bg-green-900/30',
  medium: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
  high: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
  critical: 'text-red-600 bg-red-100 dark:bg-red-900/30',
};

export function RBRStatusTooltip({ pulse, onAction }: RBRStatusTooltipProps) {
  const config = statusConfig[pulse.status];
  const StatusIcon = config.icon;

  const handleAction = () => {
    onAction?.(config.actionType);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className={cn(
      'w-72 rounded-lg border-2 shadow-xl backdrop-blur-sm',
      'bg-popover/95 dark:bg-popover/95',
      config.border
    )}>
      {/* Header */}
      <div className={cn(
        'px-4 py-3 rounded-t-lg border-b',
        config.bg
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className={cn('h-4 w-4', config.iconColor)} />
            <span className="font-mono text-xs font-semibold uppercase">
              {pulse.nodeType}
            </span>
          </div>
          <span className={cn(
            'text-[10px] px-2 py-0.5 rounded-full font-medium uppercase',
            riskColors[pulse.riskLevel]
          )}>
            {pulse.riskLevel} Risk
          </span>
        </div>
        <h3 className="mt-1 text-sm font-semibold text-foreground">
          {pulse.label}
        </h3>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Status row */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Status</span>
          <span className={cn(
            'text-xs font-medium capitalize',
            pulse.status === 'dormant' && 'text-muted-foreground',
            pulse.status === 'active' && 'text-blue-600',
            pulse.status === 'validated' && 'text-green-600',
            pulse.status === 'critical' && 'text-red-600'
          )}>
            {pulse.status === 'critical' ? 'CRITICAL GAP' : pulse.status}
          </span>
        </div>

        {/* ISO 13485 Clause */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Shield className="h-3 w-3" />
            ISO 13485 Clause
          </span>
          <span className="text-xs font-medium text-foreground">
            {pulse.isoClause}
          </span>
        </div>

        {/* Counts */}
        <div className="grid grid-cols-3 gap-2 py-2 border-y border-border/50">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{pulse.count}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-amber-600">{pulse.pendingCount}</p>
            <p className="text-[10px] text-muted-foreground">Pending</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">{pulse.approvedCount}</p>
            <p className="text-[10px] text-muted-foreground">Approved</p>
          </div>
        </div>

        {/* Linked CAPA */}
        {pulse.linkedCAPA && (
          <div className="flex items-center justify-between py-2 px-3 rounded-md bg-red-100 dark:bg-red-900/30">
            <span className="text-xs text-red-700 dark:text-red-400 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Linked CAPA
            </span>
            <span className="text-xs font-mono font-medium text-red-700 dark:text-red-400">
              {pulse.linkedCAPA}
            </span>
          </div>
        )}

        {/* Last Updated */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <FileText className="h-3 w-3" />
            Last Updated
          </span>
          <span className="text-xs text-foreground">
            {formatDate(pulse.lastUpdated)}
          </span>
        </div>

        {/* Action Button */}
        <Button
          size="sm"
          variant={pulse.status === 'critical' ? 'destructive' : 'default'}
          className="w-full gap-2"
          onClick={handleAction}
        >
          {config.actionLabel}
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
