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
  ExternalLink
} from 'lucide-react';

interface HelixMapLegendProps {
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
    glowColor: 'shadow-slate-500/50',
    icon: Circle,
    description: 'Not started',
    tooltip: 'No rationale documents created yet. Work has not begun on this decision node.'
  },
  { 
    key: 'active', 
    label: 'Active', 
    color: 'bg-amber-500',
    glowColor: 'shadow-amber-500/50',
    icon: Clock,
    description: 'In progress',
    tooltip: 'Work in progress. Rationales are being drafted or awaiting review and approval.'
  },
  { 
    key: 'validated', 
    label: 'Validated', 
    color: 'bg-emerald-500',
    glowColor: 'shadow-emerald-500/50',
    icon: CheckCircle,
    description: 'Approved',
    tooltip: 'All rationale documents have been approved. This node is compliant and ready for audit.'
  },
  { 
    key: 'critical', 
    label: 'Critical', 
    color: 'bg-red-500',
    glowColor: 'shadow-red-500/50',
    icon: AlertTriangle,
    description: 'Needs action',
    tooltip: 'Critical gap requiring immediate attention. May be overdue, blocked, or linked to an open CAPA.'
  },
];

export function HelixMapLegend({ 
  overallHealth,
  criticalCount,
  activeCount,
  validatedCount,
  dormantCount,
  onReviewCritical,
  onExportPackage,
  className 
}: HelixMapLegendProps) {
  const counts = {
    dormant: dormantCount,
    active: activeCount,
    validated: validatedCount,
    critical: criticalCount,
  };

  // Live status - updated just now indicator

  return (
    <div className={cn(
      'flex items-center justify-between gap-6 px-6 py-3',
      'bg-gray-50 border-t border-gray-200',
      'rounded-b-xl',
      className
    )}>
      {/* Status legend */}
      <TooltipProvider>
        <div className="flex items-center gap-6">
          {statusItems.map(item => {
            const Icon = item.icon;
            const count = counts[item.key as keyof typeof counts];
            
            return (
              <Tooltip key={item.key}>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 group cursor-help">
                    <div className={cn(
                      'flex items-center justify-center h-6 w-6 rounded-full',
                      item.color
                    )}>
                      <Icon className="h-3 w-3 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-700">
                        {item.label}
                        {count > 0 && (
                          <span className="ml-1 text-gray-500">({count})</span>
                        )}
                      </span>
                      <span className="text-[10px] text-gray-500">{item.description}</span>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent 
                  side="top" 
                  className="max-w-xs bg-white border-gray-200 text-gray-700"
                >
                  <p className="text-xs">{item.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>

      {/* Live Status Indicator */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="text-xs font-semibold text-emerald-700">LIVE</span>
        <span className="text-xs text-gray-500">Updated just now</span>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-2">
        {criticalCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-8 gap-1.5 text-xs',
              'bg-red-100 text-red-700 border border-red-200',
              'hover:bg-red-200 hover:text-red-800'
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
            'h-8 gap-1.5 text-xs',
            'bg-white text-gray-600 border border-gray-200',
            'hover:bg-gray-100 hover:text-gray-800'
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
