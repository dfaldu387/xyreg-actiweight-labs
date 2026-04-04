import React, { useMemo, useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, PlayCircle, Clock, AlertTriangle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PhaseTooltipContent } from './PhaseTooltipContent';
import { ChangePhaseDialog } from './ChangePhaseDialog';
import { useProductPhasesProgress, PhaseProgressData } from '@/hooks/useProductPhasesProgress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProductPhaseDependency } from '@/services/productPhaseDependencyService';
import { useTranslation } from '@/hooks/useTranslation';

interface Phase {
  id: string;
  name: string;
  status: string;
  start_date?: string;
  end_date?: string;
  actual_completion_date?: string;
  position: number;
  is_overdue?: boolean;
}

interface PhaseTimelineVisualizerProps {
  phases: Phase[];
  currentPhase: string;
  productId: string;
  onPhaseChange?: () => void;
}

type PhaseStatus = 'completed' | 'current' | 'upcoming' | 'overdue' | 'inactive';

type PhaseStyle = {
  container: string;
  icon: JSX.Element;
  badge?: boolean;
};

const getPhaseStyles = (status: PhaseStatus): PhaseStyle => {
  switch (status) {
    case 'completed':
      return {
        container: 'text-white',
        icon: <CheckCircle2 className="h-4 w-4" />,
      };
    case 'current':
      return {
        container: 'text-black',
        icon: <PlayCircle className="h-4 w-4 text-black" />,
        badge: true,
      };
    case 'upcoming':
      return {
        container: 'text-black',
        icon: <Clock className="h-4 w-4 text-black" />,
      };
    case 'overdue':
      return {
        container: 'text-white',
        icon: <AlertTriangle className="h-4 w-4" />,
      };
    case 'inactive':
      return {
        container: 'text-gray-400',
        icon: <Clock className="h-4 w-4 text-gray-400" />,
      };
  }
};

const PHASE_STATUS_LABELS: Record<PhaseStatus, string> = {
  completed: 'Completed',
  current: 'Active',
  upcoming: 'Upcoming',
  overdue: 'Overdue',
  inactive: 'Inactive',
};

const getPhaseStatusLabel = (status: PhaseStatus): string =>
  PHASE_STATUS_LABELS[status] || 'Upcoming';

const getPhaseBackgroundColor = (status: PhaseStatus): string => {
  switch (status) {
    case 'completed':
      return 'linear-gradient(135deg, #10B981, #16A34A)';
    case 'current':
      return '#FFFFFF'; // White background for active phase
    case 'upcoming':
      return '#FFFFFF'; // White background for upcoming
    case 'overdue':
      return 'linear-gradient(135deg, #F87171, #EF4444)';
    case 'inactive':
      return '#F3F4F6';
  }
};

const getPhaseNumberColor = (status: PhaseStatus): string => {
  switch (status) {
    case 'completed':
      return 'bg-[#10B981] text-white';
    case 'current':
      return 'bg-[#3B82F6] text-white';
    case 'upcoming':
      return 'bg-[#A855F7] text-white';
    case 'overdue':
      return 'bg-[#EF4444] text-white';
    case 'inactive':
      return 'bg-[#D1D5DB] text-gray-600';
  }
};

const getConnectorColor = (status: PhaseStatus): string => {
  switch (status) {
    case 'completed':
      return '#10B981';
    case 'inactive':
      return '#D1D5DB';
    default:
      return '#6B7280';
  }
};

// Chevron clip path for sequential phases
const CHEVRON_CLIP = 'polygon(0 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 0 100%, 20px 50%)';

const formatPhaseDate = (phase: Phase) => {
  if (phase.start_date) {
    return new Date(phase.start_date).toLocaleDateString();
  }
  if (phase.end_date) {
    return new Date(phase.end_date).toLocaleDateString();
  }
  return null;
};

const isPhaseActiveByDate = (phase: Phase): boolean => {
  if (!phase.start_date || !phase.end_date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(phase.start_date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(phase.end_date);
  endDate.setHours(0, 0, 0, 0);
  return today >= startDate && today <= endDate;
};

export function PhaseTimelineVisualizer({
  phases,
  currentPhase,
  productId,
  onPhaseChange
}: PhaseTimelineVisualizerProps) {
  const { lang } = useTranslation();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dependencyPhaseIds, setDependencyPhaseIds] = useState<Set<string>>(new Set());
  const [dependencyMap, setDependencyMap] = useState<Map<string, ProductPhaseDependency[]>>(new Map());

  useEffect(() => {
    let isActive = true;
    const fetchDependencies = async () => {
      if (!productId) return;
      try {
        const { data, error } = await supabase
          .from('product_phase_dependencies')
          .select('*')
          .eq('product_id', productId);

        if (error) {
          console.error('[PhaseTimelineVisualizer] Failed to fetch dependencies', error);
          if (isActive) setDependencyPhaseIds(new Set());
          return;
        }

        const idSet = new Set<string>();
        const map = new Map<string, ProductPhaseDependency[]>();

        data?.forEach((dep) => {
          if (dep.source_phase_id) {
            idSet.add(dep.source_phase_id);
            const list = map.get(dep.source_phase_id) || [];
            list.push(dep as ProductPhaseDependency);
            map.set(dep.source_phase_id, list);
          }
          if (dep.target_phase_id) {
            idSet.add(dep.target_phase_id);
            const list = map.get(dep.target_phase_id) || [];
            list.push(dep as ProductPhaseDependency);
            map.set(dep.target_phase_id, list);
          }
        });

        if (isActive) {
          setDependencyPhaseIds(idSet);
          setDependencyMap(map);
        } else {
          setDependencyPhaseIds(new Set());
          setDependencyMap(new Map());
        }
      } finally {
      }
    };

    fetchDependencies();
    return () => {
      isActive = false;
    };
  }, [productId]);

  const baseSortedPhases = useMemo(
    () => [...phases]
      .filter(phase => {
        // Filter out "No Phase" entries
        const phaseName = phase.name?.toLowerCase().trim() || '';
        return phaseName !== 'no phase' && phaseName !== 'nophase' && phaseName !== '';
      })
      .sort((a, b) => a.position - b.position),
    [phases]
  );
  // Find phase that is currently active based on date range
  const dateBasedActivePhase = useMemo(() => {
    return baseSortedPhases.find(phase => {
      // Skip completed phases
      if (phase.status === 'Completed' || phase.status === 'completed') return false;
      return isPhaseActiveByDate(phase);
    });
  }, [baseSortedPhases]);

  const effectiveCurrentPhase = useMemo(
    () => {
      // Prioritize date-based active phase
      if (dateBasedActivePhase) {
        return dateBasedActivePhase.name;
      }
      // Fall back to prop-based current phase or first phase
      return currentPhase || (baseSortedPhases[0]?.name || '');
    },
    [dateBasedActivePhase, currentPhase, baseSortedPhases]
  );

  const currentPhaseIndex = baseSortedPhases.findIndex(p => p.name === effectiveCurrentPhase);
  const currentPhaseData = baseSortedPhases[currentPhaseIndex];
  const nextPhaseData = baseSortedPhases[currentPhaseIndex + 1];

  const hasDependencies = dependencyPhaseIds.size > 0;

  // Sequential phases: phases that HAVE dependencies (either as source or target)
  const timelinePhases = useMemo(
    () => baseSortedPhases.filter((phase) => dependencyPhaseIds.has(phase.id)),
    [baseSortedPhases, dependencyPhaseIds]
  );

  // Concurrent phases: phases that DON'T have dependencies
  const independentPhases = useMemo(() => {
    const phasesWithoutDependencies = baseSortedPhases.filter(
      (phase) => !dependencyPhaseIds.has(phase.id)
    );
    
    // Sort by start_date chronologically
    return phasesWithoutDependencies.sort((a, b) => {
      // If both have start_date, sort by start_date
      if (a.start_date && b.start_date) {
        return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
      }
      // If only a has start_date, it comes first
      if (a.start_date && !b.start_date) return -1;
      // If only b has start_date, it comes first
      if (!a.start_date && b.start_date) return 1;
      // If neither has start_date, maintain original order (by position)
      return a.position - b.position;
    });
  }, [baseSortedPhases, dependencyPhaseIds]);

  // Use chevron layout only if we have dependencies and sequential phases
  const useChevronLayout = hasDependencies && timelinePhases.length > 0;

  const totalPhases = baseSortedPhases.length;
  const completedPhases = baseSortedPhases.filter(p => {
    const status = p.status?.toLowerCase() || '';
    return status === 'completed' || status === 'closed';
  }).length;
  const overallProgress = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;

  const getPhaseStatus = (phase: Phase, index: number) => {
    const normalizedStatus = phase.status?.toLowerCase() || '';

    // First check explicit status from database
    if (normalizedStatus === 'completed' || normalizedStatus === 'closed') {
      return 'completed';
    }
    if (normalizedStatus === 'inactive') {
      return 'inactive';
    }

    // Check if phase is overdue
    if (phase.is_overdue) {
      return 'overdue';
    }

    // Check if phase is active by date (prioritize this for current status)
    const isActiveByDate =
      isPhaseActiveByDate(phase) &&
      normalizedStatus !== 'completed' &&
      normalizedStatus !== 'closed' &&
      normalizedStatus !== 'inactive';
    if (isActiveByDate) {
      return 'current';
    }

    // Check if phase matches the effective current phase
    if (phase.name === effectiveCurrentPhase && normalizedStatus !== 'inactive') {
      return 'current';
    }

    // For sequential phases, mark as completed if they come before the current phase
    // BUT only if the current phase is actually started/completed
    if (index < currentPhaseIndex && currentPhaseIndex >= 0) {
      const currentPhaseStatus = baseSortedPhases[currentPhaseIndex]?.status?.toLowerCase() || '';
      // Only mark previous phases as completed if current phase is started/completed
      if (currentPhaseStatus === 'completed' || currentPhaseStatus === 'in progress' || currentPhaseStatus === 'started') {
        return 'completed';
      }
    }

    // Default to upcoming for phases that haven't started
    return 'upcoming';
  };

  const handleAdvancePhase = async () => {
    if (!currentPhaseData || !nextPhaseData) return;

    try {
      // Update current phase to completed
      const { error: updateError } = await supabase
        .from('lifecycle_phases')
        .update({
          status: 'Completed',
          actual_completion_date: new Date().toISOString()
        })
        .eq('id', currentPhaseData.id);

      if (updateError) throw updateError;

      // Update product's current phase
      const { error: productError } = await supabase
        .from('products')
        .update({ current_lifecycle_phase: nextPhaseData.name })
        .eq('id', productId);

      if (productError) throw productError;

      // Update next phase to In Progress
      const { error: nextError } = await supabase
        .from('lifecycle_phases')
        .update({ status: 'In Progress' })
        .eq('id', nextPhaseData.id);

      if (nextError) throw nextError;

      toast({
        title: lang('phaseTimeline.phaseAdvanced'),
        description: lang('phaseTimeline.advancedToPhase').replace('{{phase}}', nextPhaseData.name),
      });

      setDialogOpen(false);
      onPhaseChange?.();
    } catch (error) {
      console.error('Error advancing phase:', error);
      toast({
        title: lang('phaseTimeline.error'),
        description: lang('phaseTimeline.failedToAdvance'),
        variant: "destructive"
      });
    }
  };

  // Batch fetch all phase progress data in a single API call
  const { data: allPhasesProgress } = useProductPhasesProgress(productId);

  // Get progress for current phase from batched data
  const currentProgress = currentPhaseData?.id
    ? allPhasesProgress?.get(currentPhaseData.id)
    : undefined;

  const canAdvancePhase = currentPhaseIndex >= 0 && currentPhaseIndex < totalPhases - 1;

  return (
    <div className="bg-card rounded-lg border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <h3 className="text-lg font-semibold">
            {lang('phaseTimeline.lifecyclePhaseTimeline')}
          </h3>
        </div>
      </div>

      {/* Progress indicator */}
      <p className="text-sm text-muted-foreground mb-4">
        {lang('phaseTimeline.phasesCompleted')
          .replace('{{completed}}', String(completedPhases))
          .replace('{{total}}', String(totalPhases))
          .replace('{{progress}}', String(overallProgress))}
      </p>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-2 bg-[#6B7280] rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${overallProgress}%`,
              background: 'linear-gradient(to right, #10B981, #3B82F6, #6B7280)'
            }}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#10B981' }} />
          <span className="text-sm text-muted-foreground">{lang('phaseTimeline.approved')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#3B82F6' }} />
          <span className="text-sm text-muted-foreground">{lang('phaseTimeline.active')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#A855F7' }} />
          <span className="text-sm text-muted-foreground">{lang('phaseTimeline.upcoming')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#EF4444' }} />
          <span className="text-sm text-muted-foreground">{lang('phaseTimeline.overdue')}</span>
        </div>
      </div>

      {/* Sequential Phases (with dependencies) */}
      {timelinePhases.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-sm font-medium text-muted-foreground">{lang('phaseTimeline.sequentialPhases')}</h4>
            <Badge variant="outline" className="text-xs">
              {timelinePhases.length}
            </Badge>
          </div>
          <div className={`flex items-start ${useChevronLayout ? 'gap-0' : 'gap-3'} overflow-x-auto pb-2`}>
            {timelinePhases.map((phase, index) => {
              const originalIndex = baseSortedPhases.findIndex(p => p.id === phase.id);
              const status = getPhaseStatus(phase, originalIndex) as PhaseStatus;
              if (useChevronLayout) {
                return (
                  <ChevronPhaseSegment
                    key={phase.id}
                    phase={phase}
                    index={originalIndex}
                    status={status}
                    progress={allPhasesProgress?.get(phase.id)}
                    isFirst={index === 0}
                    isLast={index === timelinePhases.length - 1}
                  />
                );
              }

              return (
                <div key={phase.id} className="flex-shrink-0">
                  <PhaseSegment
                    phase={phase}
                    index={originalIndex}
                    status={status}
                    progress={allPhasesProgress?.get(phase.id)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Concurrent Phases (without dependencies) */}
      {independentPhases.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-sm font-medium text-muted-foreground">{lang('phaseTimeline.concurrentPhases')}</h4>
            <Badge variant="outline" className="text-xs">
              {independentPhases.length}
            </Badge>
          </div>
          <div className="flex items-start gap-2 overflow-x-auto pb-2">
            {independentPhases.map((phase, index) => {
              const originalIndex = baseSortedPhases.findIndex(p => p.id === phase.id);
              const status = getPhaseStatus(phase, originalIndex) as PhaseStatus;
              const isLast = index === independentPhases.length - 1;
              return (
                <React.Fragment key={phase.id}>
                  <PhaseSegment
                    phase={phase}
                    index={originalIndex}
                    status={status}
                    progress={allPhasesProgress?.get(phase.id)}
                  />
                  {/* {!isLast && (
                    <div
                      className="h-0.5 w-8 flex-shrink-0 self-center mt-10"
                      style={{ backgroundColor: getConnectorColor(status) }}
                    />
                  )} */}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {currentPhaseData && nextPhaseData && (
        <ChangePhaseDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          currentPhase={currentPhaseData.name}
          nextPhase={nextPhaseData.name}
          canAdvance={currentProgress?.canAdvance || false}
          onConfirm={handleAdvancePhase}
        />
      )}
    </div>
  );
}

function PhaseSegment({
  phase,
  index,
  status,
  progress,
}: {
  phase: Phase;
  index: number;
  status: PhaseStatus;
  progress?: PhaseProgressData;
}) {
  const { lang } = useTranslation();
  const styles = getPhaseStyles(status);
  const isActive = status === 'current';

  const getLocalizedStatusLabel = (s: PhaseStatus): string => {
    const statusKeyMap: Record<PhaseStatus, string> = {
      completed: 'phaseTimeline.completed',
      current: 'phaseTimeline.active',
      upcoming: 'phaseTimeline.upcoming',
      overdue: 'phaseTimeline.overdue',
      inactive: 'phaseTimeline.inactive',
    };
    return lang(statusKeyMap[s]) || lang('phaseTimeline.upcoming');
  };

  const displayStatusLabel = getLocalizedStatusLabel(status);

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const startDate = formatDate(phase.start_date);
  const endDate = formatDate(phase.end_date);
  const dateLabel = startDate && endDate
    ? `${startDate} - ${endDate}`
    : startDate
      ? `${lang('phaseTimeline.start')} ${startDate}`
      : endDate
        ? `${lang('phaseTimeline.end')} ${endDate}`
        : null;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div className="flex flex-col items-center gap-2">
            {/* Phase Pill */}
            <div
              className={`
                relative flex items-center gap-2 px-4 py-2.5 rounded-full 
                whitespace-nowrap transition-all cursor-pointer hover:scale-105
                ${styles.container}
                ${status === 'current' ? 'border-4' : 'border-2'}
              `}
              style={{
                background: getPhaseBackgroundColor(status),
                borderColor: status === 'completed' ? '#16A34A' :
                  status === 'current' ? '#2563EB' :
                    status === 'upcoming' ? '#E5E7EB' :
                      status === 'overdue' ? '#EF4444' :
                        status === 'inactive' ? '#E5E7EB' : '#6B7280'
              }}
            >
              {styles.icon}
              <div className="flex flex-col text-left leading-tight">
                {dateLabel && (
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {dateLabel}
                  </span>
                )}
                <span className="text-sm font-medium">{phase.name}</span>
              </div>
              {/* {styles.badge && (
                <Badge 
                  className="ml-1 text-white text-xs"
                  style={{ backgroundColor: '#2563EB' }}
                >
                  ACTIVE
                </Badge>
              )} */}
              {status === 'current' && progress && (
                <div className="ml-2 text-xs font-semibold text-black">
                  {progress.overallProgress}%
                </div>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="w-72 p-4" side="bottom">
          <PhaseTooltipContent phase={phase} progress={progress} displayStatus={displayStatusLabel} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ChevronPhaseSegment({
  phase,
  index,
  status,
  progress,
  isFirst,
  isLast,
}: {
  phase: Phase;
  index: number;
  status: PhaseStatus;
  progress?: PhaseProgressData;
  isFirst: boolean;
  isLast: boolean;
}) {
  const { lang } = useTranslation();
  const styles = getPhaseStyles(status);

  const getLocalizedStatusLabel = (s: PhaseStatus): string => {
    const statusKeyMap: Record<PhaseStatus, string> = {
      completed: 'phaseTimeline.completed',
      current: 'phaseTimeline.active',
      upcoming: 'phaseTimeline.upcoming',
      overdue: 'phaseTimeline.overdue',
      inactive: 'phaseTimeline.inactive',
    };
    return lang(statusKeyMap[s]) || lang('phaseTimeline.upcoming');
  };

  const displayStatusLabel = getLocalizedStatusLabel(status);

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const startDate = formatDate(phase.start_date);
  const endDate = formatDate(phase.end_date);
  const phaseDate = startDate && endDate
    ? `${startDate} - ${endDate}`
    : startDate
      ? `${lang('phaseTimeline.start')} ${startDate}`
      : endDate
        ? `${lang('phaseTimeline.end')} ${endDate}`
        : lang('phaseTimeline.dateTBD');

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div
            className={`relative ${!isFirst ? '-ml-5' : ''}`}
            style={{ zIndex: 10 - index }}
          >
            {/* Outer wrapper for border - slightly larger */}
            <div
              style={{
                minWidth: '240px',
                minHeight: '70px',
                clipPath: CHEVRON_CLIP,
                WebkitClipPath: CHEVRON_CLIP,
                // Only change border color for delayed/overdue phases
                background: status === 'overdue' ? '#EF4444' :
                  status === 'completed' ? '#16A34A' :
                    status === 'current' ? '#2563EB' :
                      status === 'upcoming' ? '#E5E7EB' :
                        status === 'inactive' ? '#E5E7EB' : '#6B7280',
                position: 'relative',
              }}
            >
              {/* Inner content - slightly smaller to create border effect */}
              <div
                className={`relative px-6 py-3 text-xs font-medium ${styles.container}`}
                style={{
                  position: 'absolute',
                  top: `${status === 'current' ? '4px' : '2px'}`,
                  left: `${status === 'current' ? '4px' : '2px'}`,
                  right: `${status === 'current' ? '4px' : '2px'}`,
                  bottom: `${status === 'current' ? '4px' : '2px'}`,
                  clipPath: CHEVRON_CLIP,
                  WebkitClipPath: CHEVRON_CLIP,
                  background: getPhaseBackgroundColor(status),
                }}
              >
                {/* Date on top */}
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
                  <span>{phaseDate}</span>
                  <div className={styles.container}>
                    {styles.icon}
                  </div>
                </div>
                {/* Phase name on bottom */}
                <p className="text-[13px] font-semibold tracking-tight">{phase.name}</p>
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="w-72 p-4" side="bottom">
          <PhaseTooltipContent phase={phase} progress={progress} displayStatus={displayStatusLabel} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
