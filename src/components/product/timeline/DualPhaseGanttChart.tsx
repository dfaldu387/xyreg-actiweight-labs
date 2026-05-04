import React, { useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Rocket, BarChart3 } from "lucide-react";
import { PhaseGanttChart } from "./PhaseGanttChart";
// import { ReadOnlyPhaseGanttChart } from "./ReadOnlyPhaseGanttChart";

import { useActivities } from "@/hooks/useActivities";
import { useActivityDateSync } from "@/hooks/useActivityDateSync";
import { useCompanyActivePhases } from "@/hooks/useCompanyActivePhases";
// NOTE: We previously lazy-loaded `GanttChartV23` here, but its `@svar-ui/*`
// transitive deps fail to resolve in the preview, which breaks the entire
// Product Dashboard chunk. The read-only timeline now reuses the safe
// `PhaseGanttChart` (rendered with `isReadOnly` props disabled).
import { useTranslation } from '@/hooks/useTranslation';
interface Phase {
  id: string;
  name: string;
  startDate?: Date;
  endDate?: Date;
  status: string;
  isCurrentPhase?: boolean;
  isOverdue?: boolean;
  position: number;
  typical_start_day?: number;
  typical_duration_days?: number;
  phase_id?: string;
  is_pre_launch?: boolean;
}
interface DualPhaseGanttChartProps {
  phases: Phase[];
  product?: any;
  progress?: number;
  onPhaseStartDateChange?: (phaseId: string, date: Date | undefined) => void;
  onPhaseEndDateChange?: (phaseId: string, date: Date | undefined) => void;
  onBatchPhaseUpdates?: (updates: any[]) => Promise<boolean>;
  companyId?: string;
  projectedLaunchDate?: Date;
  actualLaunchDate?: Date;
  isReadOnly?: boolean;
}
export function DualPhaseGanttChart({
  phases,
  product,
  progress,
  onPhaseStartDateChange,
  onPhaseEndDateChange,
  onBatchPhaseUpdates,
  companyId,
  projectedLaunchDate,
  actualLaunchDate,
  isReadOnly = false
}: DualPhaseGanttChartProps) {
  const { lang } = useTranslation();
  // Fetch activities for this product to pass to timeline components
  const { activities, updateActivity } = useActivities(companyId, product?.id, phases);
  const { syncActivityDatesWithPhase } = useActivityDateSync();
  
  // Get company active phases for proper sorting (matches company settings exactly)
  const { getPhasePosition } = useCompanyActivePhases(companyId || null);
  
  // Normalize activity dates function
  const normalizeActivityDates = useCallback(async () => {
    if (!companyId || !product?.id || activities.length === 0 || phases.length === 0) return;
    
    // Process all activities with unreasonable durations
    for (const activity of activities) {
      if (!activity.start_date || !activity.end_date) continue;
      
      const start = new Date(activity.start_date);
      const end = new Date(activity.end_date);
      const currentDuration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      // If duration is more than 7 days, normalize it
      if (currentDuration > 7) {
        const phase = phases.find(p => p.id === activity.phase_id);
        if (!phase?.startDate) continue;
        
        // Set activity to start at beginning of phase with 2-day duration
        const newStart = new Date(phase.startDate);
        const newEnd = new Date(newStart);
        newEnd.setDate(newStart.getDate() + 2); // 2-day duration
        
        try {
          await updateActivity(activity.id, {
            start_date: newStart.toISOString().split('T')[0],
            end_date: newEnd.toISOString().split('T')[0]
          });
        } catch (error) {
          console.error(`[DualPhaseGanttChart] Error normalizing ${activity.name}:`, error);
        }
      }
    }
  }, [activities, phases, companyId, product?.id, updateActivity]);
  
  // Trigger normalization when activities are loaded  
  React.useEffect(() => {
    if (activities.length > 0 && phases.length > 0) {
      const hasLongActivities = activities.some(a => {
        if (!a.start_date || !a.end_date) return false;
        const start = new Date(a.start_date);
        const end = new Date(a.end_date);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return days > 7; // More than 7 days
      });
      
      if (hasLongActivities) {
        normalizeActivityDates();
      }
    }
  }, [activities, phases, normalizeActivityDates]);
  // Sort phases by company-defined positions and split into pre-launch and post-launch
  const {
    preLaunchPhases,
    postLaunchPhases,
    launchDate,
    hasLaunched
  } = useMemo(() => {
    // First, sort all phases by company-defined positions
    const sortedPhases = [...phases].sort((a, b) => {
      const positionA = getPhasePosition(a.name);
      const positionB = getPhasePosition(b.name);
      
      // Primary sort: by company-defined position
      if (positionA !== positionB) {
        return positionA - positionB;
      }
      
      // Secondary sort: by phase position if available
      const phasePositionA = a.position || 999;
      const phasePositionB = b.position || 999;
      return phasePositionA - phasePositionB;
    });
    
    const preLaunch: Phase[] = [];
    const postLaunch: Phase[] = [];
    
    sortedPhases.forEach(phase => {
      // Use is_pre_launch field to determine phase category
      // Explicitly check for false to categorize as post-launch
      if (phase.is_pre_launch === false) {
        postLaunch.push(phase);
      } else {
        // Default to pre-launch if true or undefined (for backward compatibility)
        preLaunch.push(phase);
      }
    });

    // Determine launch date and status
    const launched = !!actualLaunchDate;
    const effectiveLaunchDate = actualLaunchDate || projectedLaunchDate;
    return {
      preLaunchPhases: preLaunch,
      postLaunchPhases: postLaunch,
      launchDate: effectiveLaunchDate,
      hasLaunched: launched
    };
  }, [phases, actualLaunchDate, projectedLaunchDate, getPhasePosition]);

  // We'll conditionally render the appropriate component inline

  return (
    <div className="space-y-6">
      {/* Combined Gantt Chart with Horizontal Scroll */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[1200px]">
          {/* All phases combined in one view */}
          {[...preLaunchPhases, ...postLaunchPhases].length > 0 ? (
            <PhaseGanttChart
              phases={[...preLaunchPhases, ...postLaunchPhases]}
              product={product}
              progress={progress}
              onPhaseStartDateChange={isReadOnly ? undefined : onPhaseStartDateChange}
              onPhaseEndDateChange={isReadOnly ? undefined : onPhaseEndDateChange}
              onBatchPhaseUpdates={isReadOnly ? undefined : onBatchPhaseUpdates}
              companyId={companyId}
              activities={activities}
              onActivityUpdate={isReadOnly ? undefined : updateActivity}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  {lang('ganttChart.noPhasesConfigured')}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {lang('ganttChart.configurePhasesDescription')}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}