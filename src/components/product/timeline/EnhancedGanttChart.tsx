import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Calendar, 
  BarChart3, 
  AlertCircle, 
  ArrowLeft,
  Plus,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import { format, differenceInDays, addDays, min, max } from "date-fns";
import { InteractivePhaseBar } from "./InteractivePhaseBar";
import { AutoSequenceControls } from "./AutoSequenceControls";
import { EnhancedAutoSequenceControls } from "./EnhancedAutoSequenceControls";
import { TimelineDateLines } from "./TodayLine";
import { TimelineAxisHeader } from "./TimelineAxisHeader";

import { CISubTaskBar } from "./CISubTaskBar";
import { PhaseDetailGantt } from "./PhaseDetailGantt";
import { 
  TimelineMetrics, 
  PhaseForSequencing, 
  SequencedPhaseUpdate,
  calculatePositionFromDate 
} from '@/utils/ganttDragHandlers';
import { usePhaseCIData } from '@/hooks/usePhaseCIData';
import { usePhaseDependencies } from '@/hooks/usePhaseDependencies';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";


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
  is_pre_launch?: boolean;
}

interface EnhancedGanttChartProps {
  phases: Phase[];
  product?: any;
  progress?: number;
  onPhaseStartDateChange?: (phaseId: string, date: Date | undefined) => void;
  onPhaseEndDateChange?: (phaseId: string, date: Date | undefined) => void;
  onBatchPhaseUpdates?: (updates: SequencedPhaseUpdate[]) => Promise<boolean>;
  companyId?: string;
  projectedLaunchDate?: Date;
  actualLaunchDate?: Date;
  hideHeader?: boolean;
  readOnly?: boolean;
}

type ViewMode = 'overview' | 'phase-detail';

export function EnhancedGanttChart({ 
  phases, 
  product,
  progress,
  onPhaseStartDateChange,
  onPhaseEndDateChange,
  onBatchPhaseUpdates,
  companyId,
  projectedLaunchDate,
  actualLaunchDate,
  hideHeader = false,
  readOnly = false
}: EnhancedGanttChartProps) {
  const [sequencePhases, setSequencePhases] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  
  // Load phase dependencies for auto-sequencing
  const { dependencies } = usePhaseDependencies(companyId || '');
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate timeline metrics
  const metrics = useMemo<TimelineMetrics>(() => {
    const today = new Date();
    const phasesWithDates = phases.filter(p => p.startDate && p.endDate);
    
    if (phasesWithDates.length === 0) {
      const futureDate = addDays(today, 365);
      return {
        earliestDate: today,
        latestDate: futureDate,
        totalDays: 365,
        containerWidth: 800
      };
    }

    const startDates = phasesWithDates.map(p => p.startDate!);
    const endDates = phasesWithDates.map(p => p.endDate!);
    
    const allDates = [...startDates, ...endDates];
    if (projectedLaunchDate) {
      allDates.push(projectedLaunchDate);
    }
    if (actualLaunchDate) {
      allDates.push(actualLaunchDate);
    }
    
    const earliest = min(allDates);
    const latest = max(allDates);
    
    // Always include today in the timeline for scrollback capability
    const timelineStart = min([earliest, today]);
    const timelineEnd = latest;
    
    const totalDays = Math.max(1, differenceInDays(timelineEnd, timelineStart));

    return {
      earliestDate: timelineStart,
      latestDate: timelineEnd,
      totalDays,
      containerWidth: containerRef.current?.offsetWidth || 800
    };
  }, [phases, projectedLaunchDate, actualLaunchDate]);

  // Transform phases for sequencing
  const phasesForSequencing = useMemo(() => {
    return phases.map(phase => ({
      id: phase.id,
      startDate: phase.startDate,
      endDate: phase.endDate,
      position: phase.position,
      typical_start_day: phase.typical_start_day,
      typical_duration_days: phase.typical_duration_days,
    }));
  }, [phases]);

  // Transform phases for dragging
  const phasesForDragging = useMemo<PhaseForSequencing[]>(() => {
    return phases.map(phase => ({
      id: phase.id,
      startDate: phase.startDate,
      endDate: phase.endDate,
      position: phase.position
    }));
  }, [phases]);

  // Calculate phase positions for display
  const phasePositions = useMemo(() => {
    return phases.map(phase => {
      if (!phase.startDate || !phase.endDate) {
        return { left: 0, width: 0 };
      }

      const left = calculatePositionFromDate(phase.startDate, metrics);
      const right = calculatePositionFromDate(phase.endDate, metrics);
      const width = Math.max(0.5, right - left);

      return { left, width };
    });
  }, [phases, metrics]);


  // Handle phase drill-down
  const handlePhaseDrillDown = (phaseId: string) => {
    setSelectedPhase(phaseId);
    setViewMode('phase-detail');
  };

  // Handle returning to overview
  const handleBackToOverview = () => {
    setSelectedPhase(null);
    setViewMode('overview');
  };


  // Handle single phase date changes
  const handlePhaseChange = (phaseId: string, startDate: Date | undefined, endDate: Date | undefined) => {
    if (startDate !== undefined) {
      onPhaseStartDateChange?.(phaseId, startDate);
    }
    if (endDate !== undefined) {
      onPhaseEndDateChange?.(phaseId, endDate);
    }
  };

  // Handle batch updates from auto-sequencing
  const handleBatchUpdates = async (updates: SequencedPhaseUpdate[]): Promise<boolean> => {
    if (!onBatchPhaseUpdates) {
      console.warn('[EnhancedGanttChart] No batch update handler provided');
      return false;
    }
    
    console.log('[EnhancedGanttChart] Processing batch updates:', updates.length);
    return await onBatchPhaseUpdates(updates);
  };

  // Handle batch updates from AutoSequenceControls
  const handleAutoSequenceBatchUpdates = async (updates: { id: string; startDate: Date; endDate: Date }[]): Promise<boolean> => {
    const sequencedUpdates: SequencedPhaseUpdate[] = updates.map(update => ({
      phaseId: update.id,
      startDate: update.startDate,
      endDate: update.endDate
    }));
    
    return await handleBatchUpdates(sequencedUpdates);
  };

  // If in phase detail view, render the dedicated component
  if (viewMode === 'phase-detail' && selectedPhase) {
    const selectedPhaseData = phases.find(p => p.id === selectedPhase);
    if (selectedPhaseData) {
      return (
        <PhaseDetailGantt
          phase={selectedPhaseData}
          product={product}
          companyId={companyId!}
          onBack={handleBackToOverview}
        />
      );
    }
  }

  const phasesWithDates = phases.filter(p => p.startDate && p.endDate);
  const totalPhases = phases.length;

  return (
    <Card>
      {!hideHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Enhanced Phase Timeline - Gantt View
            </CardTitle>
            <div className="flex items-center gap-4">
              {progress !== undefined && (
                <Badge variant="outline">
                  {progress}% Complete
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      
      <CardContent>
        <div className="space-y-6">
          {/* Auto-sequencing disabled */}

          {/* Timeline stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Total Phases: {totalPhases}</span>
            <span>Scheduled: {phasesWithDates.length}</span>
            {phasesWithDates.length > 0 && (
              <>
                <span>Timeline: {format(metrics.earliestDate, 'MMM dd, yyyy')} - {format(metrics.latestDate, 'MMM dd, yyyy')}</span>
                <span>Duration: {metrics.totalDays} days</span>
              </>
            )}
          </div>

          {totalPhases === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No phases configured
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Set up phases in company settings to view and manage timelines using the Gantt chart.
              </p>
            </div>
          ) : phases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No phases scheduled
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Assign start and end dates to phases to visualize the timeline in the Gantt chart.
              </p>
            </div>
          ) : (
            <div ref={containerRef} className="space-y-2">
              {/* Timeline axis header */}
              <TimelineAxisHeader metrics={metrics} />
              
              {/* Horizontal scrollable timeline container */}
              <div className="overflow-x-auto">
                <div className="min-w-full" style={{ minWidth: '800px' }}>
                  {/* Phase bars with Today line overlay */}
                  <div className="relative space-y-1 mt-16">
                    {/* Date lines overlay */}
                    <TimelineDateLines 
                      metrics={metrics} 
                      designFreezeDate={product?.design_freeze_date}
                      projectedLaunchDate={product?.projected_launch_date}
                    />
                    
                    {/* Phase bars with expansion capability */}
                    {phases.map((phase, index) => (
                      <EnhancedPhaseRow
                        key={phase.id}
                        phase={phase}
                        position={phasePositions[index]}
                        metrics={metrics}
                        sequencePhases={false}
                        allPhases={phasesForDragging}
                        onDateChange={handlePhaseChange}
                        onBatchDateChange={handleBatchUpdates}
                        companyId={companyId}
                        onDrillDown={readOnly ? undefined : () => handlePhaseDrillDown(phase.id)}
                        product={product}
                        readOnly={readOnly}
                        dependencies={dependencies}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced phase row component with expansion capability
interface EnhancedPhaseRowProps {
  phase: Phase;
  position: { left: number; width: number };
  metrics: TimelineMetrics;
  sequencePhases: boolean;
  allPhases: PhaseForSequencing[];
  onDateChange: (phaseId: string, startDate: Date | undefined, endDate: Date | undefined) => void;
  onBatchDateChange: (updates: SequencedPhaseUpdate[]) => Promise<boolean>;
  companyId?: string;
  onDrillDown?: () => void;
  product?: any;
  readOnly?: boolean;
  dependencies?: any[];
}

function EnhancedPhaseRow({
  phase,
  position,
  metrics,
  sequencePhases,
  allPhases,
  onDateChange,
  onBatchDateChange,
  companyId,
  onDrillDown,
  product,
  readOnly = false,
  dependencies
}: EnhancedPhaseRowProps) {
  return (
    <div className="space-y-1">
      {/* Main phase bar */}
      <div className="relative group">
        <InteractivePhaseBar
          phase={phase}
          position={position}
          metrics={metrics}
          sequencePhases={sequencePhases}
          allPhases={allPhases}
          onDateChange={onDateChange}
          onBatchDateChange={onBatchDateChange}
          companyId={companyId}
          productId={product?.id}
          disabled={readOnly}
          onDrillDown={onDrillDown}
          dependencies={dependencies}
        />
      </div>
    </div>
  );
}