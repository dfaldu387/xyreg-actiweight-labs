import React from 'react';
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { useTranslation } from '@/hooks/useTranslation';

interface PhaseTooltipContentProps {
  phase: {
    name: string;
    status: string;
    start_date?: string;
    end_date?: string;
    actual_completion_date?: string;
  };
  progress?: {
    overallProgress: number;
    stats: {
      total: number;
      approved: number;
      pending: number;
      overdue: number;
    };
  };
  displayStatus?: string;
}

export function PhaseTooltipContent({ phase, progress, displayStatus }: PhaseTooltipContentProps) {
  const { lang } = useTranslation();

  const formatDate = (dateString?: string) => {
    if (!dateString) return lang('phaseTimeline.notSet');
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return lang('phaseTimeline.invalidDate');
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Completed' || status === lang('phaseTimeline.completed')) {
      return <Badge className="bg-green-600 hover:bg-green-600 text-white">{lang('phaseTimeline.completed')}</Badge>;
    }
    if (status === 'In Progress' || status === 'Active' || status === lang('phaseTimeline.active')) {
      return <Badge className="bg-blue-600 hover:bg-blue-600 text-white">{lang('phaseTimeline.active')}</Badge>;
    }
    if (status === 'Inactive' || status === lang('phaseTimeline.inactive')) {
      return <Badge variant="outline" className="text-muted-foreground border-dashed">{lang('phaseTimeline.inactive')}</Badge>;
    }
    return <Badge variant="outline" className="text-muted-foreground">{lang('phaseTimeline.upcoming')}</Badge>;
  };

  return (
    <div className="space-y-3">
      <div>
        <h4 className="font-semibold text-foreground">{phase.name}</h4>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">{lang('phaseTimeline.status')}</p>
          {getStatusBadge(displayStatus || phase.status)}
        </div>
        {progress && (
          <div>
            <p className="text-muted-foreground text-xs">{lang('phaseTimeline.progress')}</p>
            <p className="font-medium text-foreground">{progress.overallProgress}%</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        {phase.start_date && (
          <div>
            <p className="text-muted-foreground text-xs">{lang('phaseTimeline.startDate')}</p>
            <p className="font-medium text-foreground">{formatDate(phase.start_date)}</p>
          </div>
        )}
        {phase.end_date && (
          <div>
            <p className="text-muted-foreground text-xs">{lang('phaseTimeline.targetEnd')}</p>
            <p className="font-medium text-foreground">{formatDate(phase.end_date)}</p>
          </div>
        )}
        {phase.actual_completion_date && (
          <div className="col-span-2">
            <p className="text-muted-foreground text-xs">{lang('phaseTimeline.completedOn')}</p>
            <p className="font-medium text-green-600">{formatDate(phase.actual_completion_date)}</p>
          </div>
        )}
      </div>

      {progress && progress.stats.total > 0 && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">{lang('phaseTimeline.documents')} ({progress.stats.total})</p>
          <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-muted">
            {progress.stats.approved > 0 && (
              <div
                className="bg-green-500"
                style={{width: `${(progress.stats.approved / progress.stats.total) * 100}%`}}
              />
            )}
            {progress.stats.pending > 0 && (
              <div
                className="bg-yellow-500"
                style={{width: `${(progress.stats.pending / progress.stats.total) * 100}%`}}
              />
            )}
            {progress.stats.overdue > 0 && (
              <div
                className="bg-red-500"
                style={{width: `${(progress.stats.overdue / progress.stats.total) * 100}%`}}
              />
            )}
          </div>
          <div className="flex gap-3 mt-2 text-xs">
            <span className="text-green-600">{lang('phaseTimeline.xApproved').replace('{{count}}', String(progress.stats.approved))}</span>
            <span className="text-yellow-600">{lang('phaseTimeline.xPending').replace('{{count}}', String(progress.stats.pending))}</span>
            {progress.stats.overdue > 0 && (
              <span className="text-red-600">{lang('phaseTimeline.xOverdue').replace('{{count}}', String(progress.stats.overdue))}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
