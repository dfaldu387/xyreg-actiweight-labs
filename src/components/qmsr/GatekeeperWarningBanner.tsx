/**
 * GatekeeperWarningBanner - Shows when Company Foundation blocks Market Entry
 * 
 * Displays a warning when any Rung 1 (Company Foundation) node is in a critical state,
 * preventing the device from reaching "Market Entry" status.
 */

import React from 'react';
import { AlertTriangle, ArrowRight, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

interface GatekeeperWarningBannerProps {
  onViewCompanyDashboard?: () => void;
  criticalNodeCount?: number;
  className?: string;
}

export function GatekeeperWarningBanner({
  onViewCompanyDashboard,
  criticalNodeCount = 1,
  className,
}: GatekeeperWarningBannerProps) {
  const { lang } = useTranslation();
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 px-4 py-3',
        'bg-red-50 border border-red-200 rounded-lg',
        'animate-in fade-in-0 slide-in-from-top-2 duration-300',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-red-100">
          <AlertTriangle className="h-4 w-4 text-red-600" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-red-800">
            {lang('deviceProcessEngine.marketEntryBlocked')}
          </h4>
          <p className="text-xs text-red-600">
            {criticalNodeCount === 1
              ? lang('deviceProcessEngine.foundationGapSingular').replace('{count}', String(criticalNodeCount))
              : lang('deviceProcessEngine.foundationGapPlural').replace('{count}', String(criticalNodeCount))}
          </p>
        </div>
      </div>

      {onViewCompanyDashboard && (
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-8 gap-2 text-xs',
            'bg-white border-red-200 text-red-700',
            'hover:bg-red-50 hover:text-red-800 hover:border-red-300'
          )}
          onClick={onViewCompanyDashboard}
        >
          <Building2 className="h-3.5 w-3.5" />
          {lang('deviceProcessEngine.viewCompanyDashboard')}
          <ArrowRight className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
