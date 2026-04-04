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
import { useTranslation } from '@/hooks/useTranslation';

interface HelixMapLegendLightProps {
  overallHealth: 'healthy' | 'attention' | 'critical';
  criticalCount: number;
  activeCount: number;
  validatedCount: number;
  dormantCount: number;
  onReviewCritical?: () => void;
  onExportPackage?: () => void;
  className?: string;
  showLevelIndicators?: boolean;
}

const statusItems = [
  {
    key: 'dormant',
    labelKey: 'deviceProcessEngine.legendDormant',
    color: 'bg-slate-400',
    icon: Circle,
    descriptionKey: 'deviceProcessEngine.legendDormantDesc',
    tooltipKey: 'deviceProcessEngine.legendDormantTooltip'
  },
  {
    key: 'active',
    labelKey: 'deviceProcessEngine.legendActive',
    color: 'bg-amber-500',
    icon: Clock,
    descriptionKey: 'deviceProcessEngine.legendActiveDesc',
    tooltipKey: 'deviceProcessEngine.legendActiveTooltip'
  },
  {
    key: 'validated',
    labelKey: 'deviceProcessEngine.legendValidated',
    color: 'bg-emerald-500',
    icon: CheckCircle,
    descriptionKey: 'deviceProcessEngine.legendValidatedDesc',
    tooltipKey: 'deviceProcessEngine.legendValidatedTooltip'
  },
  {
    key: 'critical',
    labelKey: 'deviceProcessEngine.legendCritical',
    color: 'bg-red-500',
    icon: AlertTriangle,
    descriptionKey: 'deviceProcessEngine.legendCriticalDesc',
    tooltipKey: 'deviceProcessEngine.legendCriticalTooltip'
  },
];

const levelIndicators = [
  {
    key: 'company',
    labelKey: 'deviceProcessEngine.companyLevel',
    icon: Building2,
    descriptionKey: 'deviceProcessEngine.companyLevelDesc',
    color: 'text-purple-600',
  },
  {
    key: 'device',
    labelKey: 'deviceProcessEngine.deviceLevel',
    icon: Cpu,
    descriptionKey: 'deviceProcessEngine.deviceLevelDesc',
    color: 'text-cyan-600',
  },
];

export function HelixMapLegendLight({ 
  overallHealth,
  criticalCount,
  activeCount,
  validatedCount,
  dormantCount,
  onReviewCritical,
  onExportPackage,
  className,
  showLevelIndicators = true
}: HelixMapLegendLightProps) {
  const { lang } = useTranslation();
  const counts = {
    dormant: dormantCount,
    active: activeCount,
    validated: validatedCount,
    critical: criticalCount,
  };

  return (
    <div className={cn(
      'flex items-center justify-between gap-6 px-6 py-3',
      'bg-slate-50 border-t border-slate-200',
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
                      <span className="text-[10px] font-medium text-slate-700">
                        {lang(item.labelKey)}
                        {count > 0 && (
                          <span className="ml-1 text-slate-400">({count})</span>
                        )}
                      </span>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent 
                  side="top" 
                  className="max-w-xs bg-white border-slate-200 text-slate-700"
                >
                  <p className="text-xs">{lang(item.tooltipKey)}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}

          {/* Separator and Level indicators */}
          {showLevelIndicators && (
            <>
              <div className="h-6 w-px bg-slate-200" />

              {levelIndicators.map(item => {
                const Icon = item.icon;
                return (
                  <Tooltip key={item.key}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5 cursor-help">
                        <Icon className={cn('h-3.5 w-3.5', item.color)} />
                        <span className={cn('text-[10px] font-medium', item.color)}>
                          {lang(item.labelKey)}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent 
                      side="top" 
                      className="bg-white border-slate-200 text-slate-700"
                    >
                      <p className="text-xs">{lang(item.descriptionKey)}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </>
          )}
        </div>
      </TooltipProvider>

      {/* Live Status Indicator */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-semibold text-emerald-700">{lang('deviceProcessEngine.live')}</span>
        <span className="text-[10px] text-slate-500">{lang('deviceProcessEngine.updatedJustNow')}</span>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-2">
        {criticalCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-7 gap-1.5 text-[10px]',
              'bg-red-50 text-red-600 border border-red-200',
              'hover:bg-red-100 hover:text-red-700'
            )}
            onClick={onReviewCritical}
          >
            <AlertTriangle className="h-3 w-3" />
            {lang('deviceProcessEngine.reviewCritical')}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-7 gap-1.5 text-[10px]',
            'bg-white text-slate-600 border border-slate-200',
            'hover:bg-slate-50 hover:text-slate-700'
          )}
          onClick={onExportPackage}
        >
          <FileText className="h-3 w-3" />
          {lang('deviceProcessEngine.exportPackage')}
          <ExternalLink className="h-2.5 w-2.5 opacity-50" />
        </Button>
      </div>
    </div>
  );
}
