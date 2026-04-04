import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Circle,
  FileText,
  ExternalLink,
  Building2,
  Cpu
} from 'lucide-react';

interface HelixMapLegendV2Props {
  overallHealth: 'healthy' | 'attention' | 'critical';
  criticalCount: number;
  activeCount: number;
  validatedCount: number;
  dormantCount: number;
  onReviewCritical?: () => void;
  onExportPackage?: () => void;
  className?: string;
}

const statusItems = [
  { 
    key: 'dormant', 
    label: 'Dormant', 
    color: 'bg-slate-500',
    icon: Circle,
    description: 'Not started',
    tooltip: 'No rationale documents created yet. Work has not begun on this process node.'
  },
  { 
    key: 'active', 
    label: 'Active', 
    color: 'bg-amber-500',
    icon: Clock,
    description: 'In progress',
    tooltip: 'Work in progress. Documents are being drafted or awaiting review and approval.'
  },
  { 
    key: 'validated', 
    label: 'Validated', 
    color: 'bg-emerald-500',
    icon: CheckCircle,
    description: 'Approved',
    tooltip: 'All documents have been approved. This node is compliant and ready for audit.'
  },
  { 
    key: 'critical', 
    label: 'Critical', 
    color: 'bg-red-500',
    icon: AlertTriangle,
    description: 'Needs action',
    tooltip: 'Critical gap requiring immediate attention. May be overdue, blocked, or linked to an open CAPA.'
  },
];

const levelIndicators = [
  {
    key: 'company',
    label: 'Company Level',
    icon: Building2,
    description: 'Foundation & Feedback',
    color: 'text-purple-400',
  },
  {
    key: 'device',
    label: 'Device Level',
    icon: Cpu,
    description: 'Product Engine',
    color: 'text-cyan-400',
  },
];

export function HelixMapLegendV2({ 
  overallHealth,
  criticalCount,
  activeCount,
  validatedCount,
  dormantCount,
  onReviewCritical,
  onExportPackage,
  className 
}: HelixMapLegendV2Props) {
  const counts = {
    dormant: dormantCount,
    active: activeCount,
    validated: validatedCount,
    critical: criticalCount,
  };

  return (
    <div className={cn(
      'flex items-center justify-between gap-6 px-6 py-3',
      'bg-slate-900 border-t border-slate-800',
      'rounded-b-xl',
      className
    )}>
      {/* Status legend */}
      <TooltipProvider>
        <div className="flex items-center gap-5">
          {statusItems.map(item => {
            const Icon = item.icon;
            const count = counts[item.key as keyof typeof counts];
            
            return (
              <Tooltip key={item.key}>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 group cursor-help">
                    <div className={cn(
                      'flex items-center justify-center h-5 w-5 rounded-full',
                      item.color
                    )}>
                      <Icon className="h-2.5 w-2.5 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-medium text-slate-300">
                        {item.label}
                        {count > 0 && (
                          <span className="ml-1 text-slate-500">({count})</span>
                        )}
                      </span>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent 
                  side="top" 
                  className="max-w-xs bg-slate-800 border-slate-700 text-slate-200"
                >
                  <p className="text-xs">{item.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}

          {/* Separator */}
          <div className="h-6 w-px bg-slate-700" />

          {/* Level indicators */}
          {levelIndicators.map(item => {
            const Icon = item.icon;
            return (
              <Tooltip key={item.key}>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 cursor-help">
                    <Icon className={cn('h-3.5 w-3.5', item.color)} />
                    <span className={cn('text-[10px] font-medium', item.color)}>
                      {item.label}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent 
                  side="top" 
                  className="bg-slate-800 border-slate-700 text-slate-200"
                >
                  <p className="text-xs">{item.description}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>

      {/* Live Status Indicator */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-900/30 border border-emerald-600/30">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-semibold text-emerald-400">LIVE</span>
        <span className="text-[10px] text-slate-500">Updated just now</span>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-2">
        {criticalCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-7 gap-1.5 text-[10px]',
              'bg-red-900/30 text-red-400 border border-red-600/30',
              'hover:bg-red-900/50 hover:text-red-300'
            )}
            onClick={onReviewCritical}
          >
            <AlertTriangle className="h-3 w-3" />
            Review Critical
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-7 gap-1.5 text-[10px]',
            'bg-slate-800 text-slate-400 border border-slate-700',
            'hover:bg-slate-700 hover:text-slate-300'
          )}
          onClick={onExportPackage}
        >
          <FileText className="h-3 w-3" />
          Export Package
          <ExternalLink className="h-2.5 w-2.5 opacity-50" />
        </Button>
      </div>
    </div>
  );
}
