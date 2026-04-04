import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock } from 'lucide-react';
import { CircularProgress } from '@/components/ui/circular-progress';
import { InvestorVisibleBadge } from '@/components/ui/investor-visible-badge';
import { useSearchParams } from 'react-router-dom';

interface CurrentLifecycleCardProps {
  currentPhase?: string;
  previousPhase?: string;
  nextPhase?: string;
  daysUntilNextPhase?: number;
  currentPhaseStartDate?: string;
  currentPhaseEndDate?: string;
}

export function CurrentLifecycleCard({
  currentPhase,
  previousPhase,
  nextPhase,
  daysUntilNextPhase,
  currentPhaseStartDate,
  currentPhaseEndDate
}: CurrentLifecycleCardProps) {
  const [searchParams] = useSearchParams();
  const isInInvestorFlow = searchParams.get('returnTo') === 'investor-share';
  
  if (!currentPhase) {
    return null;
  }
  // Calculate days in current phase
  const calculateCurrentPhaseDays = (): number | undefined => {
    if (!currentPhaseStartDate) return undefined;

    const startDate = new Date(currentPhaseStartDate);
    const today = new Date();
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays >= 0 ? diffDays : undefined;
  };

  // Calculate phase completion percentages
  const calculatePhaseCompletion = (): number | undefined => {
    if (!currentPhaseStartDate) return undefined;

    const startDate = new Date(currentPhaseStartDate);
    const today = new Date();
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

    let endDate: Date | null = null;

    // Use end date if provided, otherwise calculate from daysUntilNextPhase
    if (currentPhaseEndDate) {
      endDate = new Date(currentPhaseEndDate);
    } else if (daysUntilNextPhase !== undefined && daysUntilNextPhase >= 0) {
      // Calculate end date from days until next phase
      // End date = today + daysUntilNextPhase
      endDate = new Date(today);
      endDate.setDate(endDate.getDate() + daysUntilNextPhase);
    }

    if (!endDate) return undefined;

    const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    const totalDays = Math.floor((endDateOnly.getTime() - startDateOnly.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.floor((todayDateOnly.getTime() - startDateOnly.getTime()) / (1000 * 60 * 60 * 24));

    if (totalDays <= 0) return undefined;
    if (elapsedDays < 0) return 0;
    if (elapsedDays >= totalDays) return 100;

    return Math.round((elapsedDays / totalDays) * 100);
  };

  const currentPhaseDays = calculateCurrentPhaseDays();
  const phaseCompletion = calculatePhaseCompletion();
  return (
    <div className="grid grid-cols-3 gap-2 max-w-2xl">
      {/* Previous Phase */}
      <div className="border-2 border-gray-300 rounded-lg p-2 bg-white">
        <div className="text-xs text-muted-foreground mb-1 font-medium">Previous Phase</div>
        <div className="text-xs font-medium text-foreground">
          {previousPhase || '—'}
        </div>
      </div>

      {/* Current Phase */}
      <div className="border-2 border-teal-500 rounded-lg p-2 bg-white">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
            <div className="text-xs text-muted-foreground font-medium">Current Phase</div>
            {isInInvestorFlow && <InvestorVisibleBadge className="text-[9px] px-1 py-0" />}
          </div>
          {phaseCompletion !== undefined && (
            <CircularProgress percentage={phaseCompletion} size={28} strokeWidth={2.5} />
          )}
        </div>
        <div className="text-xs font-semibold text-foreground">
          {currentPhase}
        </div>
        {currentPhaseDays !== undefined && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Clock className="h-3 w-3" />
            <span>
              {currentPhaseDays === 0
                ? 'Started today'
                : currentPhaseDays === 1
                  ? '1 day'
                  : `${currentPhaseDays} days`
              }
            </span>
          </div>
        )}
      </div>

      {/* Next Phase */}
      <div className="border-2 border-blue-400 rounded-lg p-2 bg-white">
        <div className="text-xs text-muted-foreground mb-1 font-medium">Next Phase</div>
        <div className="text-xs font-semibold text-foreground">
          {nextPhase || '—'}
        </div>
        {daysUntilNextPhase !== undefined && daysUntilNextPhase >= 0 && nextPhase && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Clock className="h-3 w-3" />
            <span>
              {daysUntilNextPhase === 0
                ? 'Starting today'
                : daysUntilNextPhase === 1
                  ? '1 day'
                  : `${daysUntilNextPhase} days`
              }
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
