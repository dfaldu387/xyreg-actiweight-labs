
import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar, BarChart3, AlertCircle } from "lucide-react";
import { format, differenceInDays, addDays, min, max } from "date-fns";
import { InteractivePhaseBar } from "./InteractivePhaseBar";
import { AutoSequenceControls } from "./AutoSequenceControls";
import { TimelineDateLines } from "./TodayLine";
import { TimelineAxisHeader } from "./TimelineAxisHeader";
import { DependencyArrows } from "./DependencyArrows";
import { 
  TimelineMetrics, 
  PhaseForSequencing, 
  SequencedPhaseUpdate,
  calculatePositionFromDate 
} from '@/utils/ganttDragHandlers';
import { getLegacyTimelineConfig, adjustPhasesForLegacyProduct, getLegacyProductMessage } from "@/utils/legacyTimelineUtils";
import { detectProductType } from '@/utils/productTypeDetection';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { PhaseDependencyService, type PhaseDependency } from '@/services/phaseDependencyService';
import { InteractiveActivityBar } from "./InteractiveActivityBar";
import { useCompanyActivePhases } from "@/hooks/useCompanyActivePhases";

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

interface Activity {
  id: string;
  name: string;
  start_date?: string;
  end_date?: string;
  status: string;
  type: string;
  phase_id?: string;
}

interface PhaseGanttChartProps {
  phases: Phase[];
  product?: any; // Add product data to enable legacy detection
  progress?: number;
  onPhaseStartDateChange?: (phaseId: string, date: Date | undefined) => void;
  onPhaseEndDateChange?: (phaseId: string, date: Date | undefined) => void;
  onBatchPhaseUpdates?: (updates: SequencedPhaseUpdate[]) => Promise<boolean>;
  companyId?: string;
  projectedLaunchDate?: Date;
  actualLaunchDate?: Date;
  hideHeader?: boolean; // Add prop to hide header when used inside other components
  activities?: Activity[];
  onActivityUpdate?: (id: string, updates: Partial<Activity>) => Promise<Activity>;
}

export function PhaseGanttChart({ 
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
  activities = [],
  onActivityUpdate
}: PhaseGanttChartProps) {
  const [sequencePhases, setSequencePhases] = useState(false);
  const [dependencies, setDependencies] = useState<PhaseDependency[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Get company active phases for proper sorting (matches company settings exactly)
  const { getPhasePosition } = useCompanyActivePhases(companyId || null);

  // Load dependencies for visualization
  useEffect(() => {
    const loadDependencies = async () => {
      if (companyId) {
        try {
          const result = await PhaseDependencyService.getDependencies(companyId);
          if (result.success) {
            setDependencies(result.dependencies);
          }
        } catch (error) {
          console.error('Error loading dependencies for visualization:', error);
        }
      }
    };
    
    loadDependencies();
  }, [companyId]);

  // Get legacy timeline configuration
  const legacyConfig = product ? getLegacyTimelineConfig(product) : { isLegacyProduct: false, launchDate: new Date(), shouldShowLegacyIndicator: false };
  const legacyMessage = getLegacyProductMessage(legacyConfig);
  
  // For legacy products, disable auto-sequencing since phases are fixed in the past
  const isSequencingDisabled = legacyConfig.isLegacyProduct;

  // Filter and sort phases by company-defined positions
  const filteredPhases = useMemo(() => {
    let phasesToFilter = phases;
    
    if (product) {
      const productType = detectProductType(product);
      if (productType === 'legacy_product') {
        // For legacy products, only show post-launch phases and any non-completed phases
        phasesToFilter = phases.filter(phase => {
          const isPostLaunch = phase.is_pre_launch === false;
          return isPostLaunch || phase.status !== 'Completed';
        });
      }
    }
    
    // Sort phases by company-defined positions
    return [...phasesToFilter].sort((a, b) => {
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
  }, [phases, product, getPhasePosition]);

  // Calculate timeline metrics
  const metrics = useMemo<TimelineMetrics>(() => {
    const phasesWithDates = filteredPhases.filter(p => p.startDate && p.endDate);
    
    if (phasesWithDates.length === 0) {
      const now = new Date();
      const futureDate = addDays(now, 365);
      return {
        earliestDate: now,
        latestDate: futureDate,
        totalDays: 365,
        containerWidth: 800 // Default width
      };
    }

    // All phases are now treated equally in the dependency-based system
    const continuousPostLaunchPhases: typeof phasesWithDates = [];
    const mainProjectPhases = phasesWithDates;

    const startDates = phasesWithDates.map(p => p.startDate!);
    const endDates = phasesWithDates.map(p => p.endDate!);
    
    // Include projected launch date in timeline calculations if provided
    const allDates = [...startDates, ...endDates];
    if (projectedLaunchDate) {
      allDates.push(projectedLaunchDate);
    }
    if (actualLaunchDate) {
      allDates.push(actualLaunchDate);
    }
    
    const earliest = min(allDates);
    const latest = max(allDates);
    const totalDays = Math.max(1, differenceInDays(latest, earliest));

    // Calculate main project end date (excluding unlimited phases)
    const mainProjectEndDate = mainProjectPhases.length > 0 
      ? max(mainProjectPhases.map(p => p.endDate!))
      : undefined;

    // For continuous post-launch phases, extend them by a reasonable amount for display
    const projectDuration = mainProjectEndDate ? differenceInDays(mainProjectEndDate, earliest) : totalDays;
    const fivePercentExtension = Math.max(1, Math.round(projectDuration * 0.05));
    
    // Update continuous post-launch phases for display
    const updatedLatest = continuousPostLaunchPhases.reduce((currentLatest, phase) => {
      if (phase.startDate && phase.endDate) {
        // For continuous post-launch phases, show them with reasonable extension for display
        const phaseDuration = differenceInDays(phase.endDate, phase.startDate);
        // If the phase appears to be artificially extended (like 1 year default), show it appropriately
        const isDisplayExtension = phaseDuration >= 365;
        
        if (isDisplayExtension) {
          // Keep the current end date for display purposes
          return phase.endDate > currentLatest ? phase.endDate : currentLatest;
        } else {
          // For shorter continuous phases, extend them by 5% of project duration
          const extendedEndDate = addDays(phase.startDate, fivePercentExtension);
          return extendedEndDate > currentLatest ? extendedEndDate : currentLatest;
        }
      }
      return currentLatest;
    }, latest);

    return {
      earliestDate: earliest,
      latestDate: updatedLatest,
      totalDays: Math.max(1, differenceInDays(updatedLatest, earliest)),
      containerWidth: containerRef.current?.offsetWidth || 800,
      mainProjectEndDate
    };
  }, [filteredPhases]);

  // Transform phases for sequencing (align with PhaseForAutoSequencing interface)
  const phasesForSequencing = useMemo(() => {
    return filteredPhases.map(phase => ({
      id: phase.id,
      startDate: phase.startDate,
      endDate: phase.endDate,
      position: phase.position,
      typical_start_day: phase.typical_start_day,
      typical_duration_days: phase.typical_duration_days,
      
    }));
  }, [filteredPhases]);

  // Transform phases for InteractivePhaseBar (keep existing PhaseForSequencing interface)
  const phasesForDragging = useMemo<PhaseForSequencing[]>(() => {
    return filteredPhases.map(phase => ({
      id: phase.id,
      startDate: phase.startDate,
      endDate: phase.endDate,
      position: phase.position
    }));
  }, [filteredPhases]);

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
      console.warn('[PhaseGanttChart] No batch update handler provided');
      return false;
    }
    
    console.log('[PhaseGanttChart] Processing batch updates:', updates.length);
    return await onBatchPhaseUpdates(updates);
  };

  // Handle batch updates from AutoSequenceControls
  const handleAutoSequenceBatchUpdates = async (updates: { id: string; startDate: Date; endDate: Date }[]): Promise<boolean> => {
    // Convert from AutoSequenceUpdate to SequencedPhaseUpdate format
    const sequencedUpdates: SequencedPhaseUpdate[] = updates.map(update => ({
      phaseId: update.id,
      startDate: update.startDate,
      endDate: update.endDate
    }));
    
    return await handleBatchUpdates(sequencedUpdates);
  };

  // Handle activity date changes
  const handleActivityDateChange = async (activityId: string, startDate: Date | undefined, endDate: Date | undefined) => {
    if (!onActivityUpdate || !startDate || !endDate) return;
    
    console.log('🔥 [PhaseGanttChart] Activity drag completed - updating:', {
      activityId,
      activityName: activities.find(a => a.id === activityId)?.name,
      oldDates: {
        start: activities.find(a => a.id === activityId)?.start_date,
        end: activities.find(a => a.id === activityId)?.end_date
      },
      newDates: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      }
    });
    
    try {
      const result = await onActivityUpdate(activityId, {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0] // This will be mapped to due_date in useActivities
      });
      
      console.log('✅ [PhaseGanttChart] Activity update completed:', result);
    } catch (error) {
      console.error('❌ [PhaseGanttChart] Error updating activity:', error);
    }
  };

  // Get activities for a specific phase - CRITICAL FIX: Normalize data schema
  const getActivitiesForPhase = useCallback((phaseId: string) => {
    const phaseActivities = activities.filter(activity => activity.phase_id === phaseId);
    
    // CRITICAL FIX: Ensure end_date is populated from due_date if missing
    const normalizedActivities = phaseActivities.map(activity => ({
      ...activity,
      end_date: activity.end_date || (activity as any).due_date, // Schema normalization
      start_date: activity.start_date || (activity as any).due_date // Fallback for missing start_date
    }));
    
    console.log('[PhaseGanttChart] SYNCHRONIZED Activities for phase:', {
      phaseId,
      totalActivities: activities.length,
      rawActivities: phaseActivities.map(a => ({
        id: a.id,
        name: a.name,
        start_date: a.start_date,
        end_date: a.end_date,
        due_date: (a as any).due_date
      })),
      normalizedActivities: normalizedActivities.map(a => ({
        id: a.id,
        name: a.name,
        start_date: a.start_date,
        end_date: a.end_date
      }))
    });
    
    return normalizedActivities;
  }, [activities]); // CRITICAL: Depend on activities so it updates when data changes

  // Calculate activity positions for display - CRITICAL FIX: Enhanced debugging
  const calculateActivityPositions = useCallback((phaseActivities: Activity[]) => {
    console.log('[PhaseGanttChart] 🔄 CALCULATING POSITIONS:', {
      activityCount: phaseActivities.length,
      timelineMetrics: {
        start: metrics.earliestDate.toISOString().split('T')[0],
        end: metrics.latestDate.toISOString().split('T')[0],
        totalDays: metrics.totalDays,
        containerWidth: metrics.containerWidth
      }
    });

    return phaseActivities.map(activity => {
      if (!activity.start_date || !activity.end_date) {
        console.warn('[PhaseGanttChart] ⚠️ Activity missing dates - HIDDEN:', {
          id: activity.id,
          name: activity.name,
          start_date: activity.start_date,
          end_date: activity.end_date
        });
        return { left: 0, width: 0 };
      }

      const startDate = new Date(activity.start_date);
      const endDate = new Date(activity.end_date);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error('[PhaseGanttChart] ❌ Invalid dates - HIDDEN:', {
          id: activity.id,
          name: activity.name,
          start_date: activity.start_date,
          end_date: activity.end_date
        });
        return { left: 0, width: 0 };
      }

      const left = calculatePositionFromDate(startDate, metrics);
      const right = calculatePositionFromDate(endDate, metrics);
      const width = Math.max(0.5, right - left); // Minimum width for visibility

      console.log('[PhaseGanttChart] ✅ Activity position calculated:', {
        id: activity.id,
        name: activity.name,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        left,
        right,
        width
      });

      return { left, width };
    });
  }, [metrics, activities]); // CRITICAL FIX: Include activities to re-calculate when data changes

  // Calculate phase positions for display
  const phasePositions = useMemo(() => {
    return filteredPhases.map(phase => {
      if (!phase.startDate || !phase.endDate) {
        return { left: 0, width: 0 };
      }

      const left = calculatePositionFromDate(phase.startDate, metrics);
      const right = calculatePositionFromDate(phase.endDate, metrics);
      const width = Math.max(0.5, right - left); // Minimum width for visibility

      return { left, width };
    });
  }, [filteredPhases, metrics]);

  const phasesWithDates = filteredPhases.filter(p => p.startDate && p.endDate);
  const totalPhases = phases.length;

  return (
    <Card>
      {!hideHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Phase Timeline - Gantt View
            </CardTitle>
            <div className="flex items-center gap-4">
              {progress !== undefined && (
                <Badge variant="outline">
                  {progress}% Complete
                </Badge>
              )}
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  Auto-Sequencing Enabled
                </Badge>
              </div>
            </div>
          </div>

          {/* Dependency Legend - Only show when dependencies exist AND arrows are being displayed */}
          {dependencies.length > 0 ? (
            <div className="flex items-center gap-4 text-xs text-muted-foreground border-l-2 border-primary/20 pl-4">
              <span className="font-medium">Dependencies:</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-blue-500"></div>
                <span>Finish→Start</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-green-500 border-dashed"></div>
                <span>Start→Start</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-orange-500 border-dotted"></div>
                <span>Finish→Finish</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-purple-500"></div>
                <span>Start→Finish</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground border-l-2 border-muted pl-4">
              <span className="font-medium">Dependencies:</span>
              <span className="ml-2">No dependencies defined</span>
            </div>
          )}
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-6">
          {/* Legacy product indicator */}
          {legacyMessage && (
            <Alert className="border-amber-200 bg-amber-50">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                {legacyMessage}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Dependency-based positioning is automatic - no manual controls needed */}

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
          ) : filteredPhases.length === 0 ? (
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
                    
                    {/* Phase bars with activities - CRITICAL FIX: Force re-render when activities change */}
                    {filteredPhases.map((phase, index) => {
                      const phaseActivities = getActivitiesForPhase(phase.id);
                      const activityPositions = calculateActivityPositions(phaseActivities);
                      
                      console.log(`🎯 [PhaseGanttChart] Rendering phase "${phase.name}":`, {
                        phaseId: phase.id,
                        activitiesCount: phaseActivities.length,
                        activitiesData: phaseActivities.map(a => ({
                          id: a.id,
                          name: a.name,
                          start_date: a.start_date,
                          end_date: a.end_date,
                          updated_at: (a as any).updated_at
                        })),
                        positionsCalculated: activityPositions.length
                      });
                      
                      return (
                        <div key={phase.id} className="space-y-1">
                          <InteractivePhaseBar
                            phase={phase}
                            position={phasePositions[index]}
                            metrics={metrics}
                            sequencePhases={true}
                            allPhases={phasesForDragging}
                            onDateChange={handlePhaseChange}
                            onBatchDateChange={handleBatchUpdates}
                            companyId={companyId}
                          />
                          
                          {/* Activities for this phase */}
                          {phaseActivities.map((activity, actIndex) => (
                            <InteractiveActivityBar
                              key={activity.id}
                              activity={activity}
                              position={activityPositions[actIndex]}
                              metrics={metrics}
                              phaseStartDate={phase.startDate}
                              phaseEndDate={phase.endDate}
                              onDateChange={handleActivityDateChange}
                            />
                          ))}
                        </div>
                      );
                    })}
                    
                    {/* Dependency arrows overlay */}
                    {dependencies.length > 0 && (
                      <DependencyArrows
                        dependencies={dependencies.map(dep => ({
                          id: dep.id,
                          product_id: '', // Not used for company-level dependencies
                          source_phase_id: dep.source_phase_id,
                          target_phase_id: dep.target_phase_id,
                          dependency_type: dep.dependency_type as 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish',
                          lag_days: dep.lag_days,
                          created_at: dep.created_at,
                          updated_at: dep.updated_at
                        }))}
                        phases={filteredPhases.map((phase, index) => ({
                          id: phase.id,
                          name: phase.name,
                          position: phasePositions[index]
                        }))}
                        containerHeight={filteredPhases.length * 52} // Approximate row height
                        rowHeight={52}
                      />
                    )}
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
