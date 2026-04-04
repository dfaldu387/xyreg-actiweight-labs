
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays, addDays } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PhaseIdentifierBadge } from "@/components/settings/phases/PhaseIdentifierBadge";
import { AlertTriangle, Edit, Eye, Info } from "lucide-react";
import {
  getDragZone,
  calculateNewDates,
  calculateSequencedPhaseUpdates,
  calculatePositionFromDate,
  DragState,
  TimelineMetrics,
  PhaseForSequencing,
  SequencedPhaseUpdate,
  suggestDependencies
} from '@/utils/ganttDragHandlers';
import { usePhaseReordering } from '@/hooks/usePhaseReordering';
import { usePhaseDependencies } from '@/hooks/usePhaseDependencies';
import { useDependencyAwarePositioning, type PhasePosition } from '@/hooks/useDependencyAwarePositioning';
import { sortPhasesByDependencies } from '@/utils/dependencySorting';
import { PhaseDependencyService } from '@/services/phaseDependencyService';

interface InteractivePhaseBarProps {
  phase: {
    id: string;
    name: string;
    startDate?: Date;
    endDate?: Date;
    status: string;
    isCurrentPhase?: boolean;
    isOverdue?: boolean;
    position: number;
  };
  position: { left: number; width: number };
  metrics: TimelineMetrics;
  sequencePhases: boolean;
  allPhases: PhaseForSequencing[];
  onDateChange: (phaseId: string, startDate: Date | undefined, endDate: Date | undefined) => void;
  onBatchDateChange?: (updates: SequencedPhaseUpdate[]) => void;
  disabled?: boolean;
  companyId?: string;
  productId?: string;
  onDrillDown?: () => void;
  dependencies?: any[]; // Add dependencies prop for span dependency checking
}

export function InteractivePhaseBar({
  phase,
  position,
  metrics,
  sequencePhases,
  allPhases,
  onDateChange,
  onBatchDateChange,
  disabled = false,
  companyId,
  productId,
  onDrillDown,
  dependencies: propDependencies
}: InteractivePhaseBarProps) {
  const navigate = useNavigate();
  
  // Load phase dependencies for dependency-aware drag calculations
  const { dependencies: phaseDependencies } = usePhaseDependencies(companyId || '');
  
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: null,
    phaseId: null,
    startX: 0,
    startDate: null,
    startEndDate: null,
    originalDuration: 0
  });

  const [hoverZone, setHoverZone] = useState<'move' | 'resize-start' | 'resize-end' | null>(null);
  const [previewDates, setPreviewDates] = useState<{ startDate: Date; endDate: Date; isValid?: boolean; violations?: string[]; warnings?: string[] } | null>(null);
  const [sequencedPreview, setSequencedPreview] = useState<SequencedPhaseUpdate[]>([]);
  const [positionChanged, setPositionChanged] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { reorderPhases } = usePhaseReordering();
  const { handlePhaseMoveWithDependencies, validatePhaseMove, dependencies } = useDependencyAwarePositioning(companyId || '', productId || '');
  
  // console.log('[InteractivePhaseBar] Hook initialized with:', { companyId, productId, phase: phase.id });
  const hasValidDates = phase.startDate && phase.endDate;
  
  // Check if this phase is a span dependency target
  const spanDependency = (propDependencies || phaseDependencies)?.find(dep => 
    dep.dependency_type === 'span_between_phases' && dep.target_phase_id === phase.id
  );
  
  // Calculate span position if this is a span dependency
  const spanPosition = useMemo(() => {
    if (!spanDependency) return null;
    
    const sourcePhase = allPhases.find(p => p.id === spanDependency.source_phase_id);
    const endPhase = allPhases.find(p => p.id === spanDependency.end_phase_id);
    
    if (!sourcePhase?.endDate || !endPhase?.startDate) return null;
    
    const spanStart = sourcePhase.endDate;
    const spanEnd = endPhase.startDate;
    
    const left = calculatePositionFromDate(spanStart, metrics);
    const right = calculatePositionFromDate(spanEnd, metrics);
    const width = Math.max(0.5, right - left);
    
    return { left, width, spanStart, spanEnd };
  }, [spanDependency, allPhases, metrics]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!dragState.isDragging || !containerRef.current || disabled) return;

      const rect = containerRef.current.getBoundingClientRect();
      const currentX = event.clientX - rect.left;

      // // console.log('[InteractivePhaseBar] Mouse move during drag:', {
      //   phaseId: phase.id,
      //   currentX,
      //   sequencePhases,
      //   allPhasesCount: allPhases.length
      // });

      const newDates = calculateNewDates(
        dragState,
        currentX,
        metrics,
        sequencePhases,
        allPhases,
        phase.id,
        dependencies,
        true // Enable dependency validation
      );

      if (newDates) {
        setPreviewDates(newDates);

        // Check if this is a move operation and if the position has changed significantly
        if (dragState.dragType === 'move' && dragState.startDate && phase.startDate) {
          const originalPosition = calculatePositionFromDate(dragState.startDate, metrics);
          const newPosition = calculatePositionFromDate(newDates.startDate, metrics);
          const positionDiff = Math.abs(newPosition - originalPosition);

          // If the position changed by more than 5% of the timeline, consider it a reorder
          if (positionDiff > 5) {
            setPositionChanged(true);
          }
        }

        // Calculate sequenced updates for preview - always show when batch handler available
        if (onBatchDateChange) {
          // console.log('[InteractivePhaseBar] Calculating dependency-aware sequenced updates for preview');
          const sequencedUpdates = calculateSequencedPhaseUpdates(
            phase.id,
            newDates.startDate,
            newDates.endDate,
            allPhases,
            dragState.dragType || 'move',
            phaseDependencies
          );
          setSequencedPreview(sequencedUpdates);
          // console.log('[InteractivePhaseBar] Sequenced preview updates:', sequencedUpdates.length);
        } else {
          setSequencedPreview([]);
        }
      }
    };

    const handleMouseUp = async () => {
      if (dragState.isDragging && previewDates && dragState.phaseId && !disabled) {
       


        // If position changed significantly, we need to reorder phases
        if (positionChanged && companyId && dragState.dragType === 'move') {
          // console.log('[InteractivePhaseBar] Position changed - reordering phases');

          // Calculate new order based on the new position
          const sortedPhases = [...allPhases].sort((a, b) => a.position - b.position);
          const draggedPhase = sortedPhases.find(p => p.id === dragState.phaseId);

          if (draggedPhase) {
            // Calculate where the phase should be positioned based on the new date
            const newPosition = calculatePositionFromDate(previewDates.startDate, metrics);

            // Find the phase that should come after this position
            let newIndex = 0;
            for (let i = 0; i < sortedPhases.length; i++) {
              if (sortedPhases[i].id === draggedPhase.id) continue;
              if (sortedPhases[i].startDate &&
                calculatePositionFromDate(sortedPhases[i].startDate, metrics) > newPosition) {
                break;
              }
              newIndex++;
            }

            // Create new order
            const newOrder = sortedPhases.filter(p => p.id !== draggedPhase.id);
            newOrder.splice(newIndex, 0, draggedPhase);

            // Get the phase_id for each phase to call reorder function
            const phaseIds = newOrder.map(p => p.id);

            try {
              const result = await reorderPhases(companyId, phaseIds);
              if (result.success) {
                // console.log('[InteractivePhaseBar] Phase reordering successful');
              } else {
                console.error('[InteractivePhaseBar] Phase reordering failed:', result.error);
              }
            } catch (error) {
              console.error('[InteractivePhaseBar] Phase reordering error:', error);
            }
          }
        }

        // Apply changes directly if no warnings
        applyChanges(previewDates.startDate, previewDates.endDate);
      }

      setDragState({
        isDragging: false,
        dragType: null,
        phaseId: null,
        startX: 0,
        startDate: null,
        startEndDate: null,
        originalDuration: 0
      });
      setPreviewDates(null);
      setSequencedPreview([]);
      setPositionChanged(false);
      setHoverZone(null);
    };

    if (dragState.isDragging && !disabled) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = dragState.dragType === 'move' ? 'grabbing' : 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [dragState, previewDates, sequencedPreview, metrics, sequencePhases, allPhases, onDateChange, onBatchDateChange, disabled, phase.id, positionChanged, companyId, reorderPhases]);

  const handleMouseDown = (event: React.MouseEvent) => {
    // console.log('[InteractivePhaseBar] Mouse down detected on phase:', phase.name);
    if (!hasValidDates || !barRef.current || !containerRef.current || disabled) {
      // console.log('[InteractivePhaseBar] Mouse down blocked:', { hasValidDates, hasBarRef: !!barRef.current, hasContainerRef: !!containerRef.current, disabled });
      return;
    }

    event.preventDefault();

    const dragType = getDragZone(event, barRef.current);
    const rect = containerRef.current.getBoundingClientRect();
    const startX = event.clientX - rect.left;

   

    setDragState({
      isDragging: true,
      dragType,
      phaseId: phase.id,
      startX,
      startDate: phase.startDate!,
      startEndDate: phase.endDate!,
      originalDuration: 0
    });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!dragState.isDragging && barRef.current && !disabled) {
      const zone = getDragZone(event, barRef.current);
      setHoverZone(zone);
    }
  };

  const handleMouseLeave = () => {
    if (!dragState.isDragging) {
      setHoverZone(null);
    }
  };

  // Helper function to map company dependencies to product phase dependencies  
  const getRelevantDependencies = useCallback(() => {
    try {
      // console.log('[InteractivePhaseBar] Getting dependencies from hook');
      // console.log('[InteractivePhaseBar] Available dependencies:', dependencies.length);
      // console.log('[InteractivePhaseBar] Available phases:', allPhases.map(p => ({ id: p.id, name: p.name, position: p.position })));
      
      if (dependencies.length === 0) {
        // console.log('[InteractivePhaseBar] No dependencies found in hook');
        return [];
      }

      // console.log('[InteractivePhaseBar] Raw dependencies:', dependencies);

      // Map company phase IDs to product phase IDs - handle both template IDs and direct phase matches
      const mappedDependencies = dependencies
        .filter(dep => dep.dependency_type === 'finish_to_start') // Only handle finish_to_start for now
        .map(dep => {
          // console.log('[InteractivePhaseBar] Processing dependency:', dep.source_phase_id, '->', dep.target_phase_id);
          
          // Try to find source and target phases using multiple strategies
          let sourcePhase = null;
          let targetPhase = null;
          
          // Strategy 1: Direct ID match (for regular UUID dependencies)
          sourcePhase = allPhases.find(p => p.id === dep.source_phase_id);
          targetPhase = allPhases.find(p => p.id === dep.target_phase_id);
          
          if (sourcePhase && targetPhase) {
            // console.log('[InteractivePhaseBar] Direct ID match found:', sourcePhase.name, '->', targetPhase.name);
          } else {
            // Strategy 2: Template ID to position mapping
            const sourcePosition = getPositionFromTemplateId(dep.source_phase_id);
            const targetPosition = getPositionFromTemplateId(dep.target_phase_id);
            
            // console.log('[InteractivePhaseBar] Template positions:', sourcePosition, '->', targetPosition);
            
            if (sourcePosition !== null) {
              sourcePhase = allPhases.find(p => p.position === sourcePosition);
              // console.log('[InteractivePhaseBar] Source by position:', sourcePhase?.name || 'NOT FOUND');
            }
            if (targetPosition !== null) {
              targetPhase = allPhases.find(p => p.position === targetPosition);
              // console.log('[InteractivePhaseBar] Target by position:', targetPhase?.name || 'NOT FOUND');
            }
          }

          if (sourcePhase && targetPhase) {
            const mapped = {
              ...dep,
              source_phase_id: sourcePhase.id,
              target_phase_id: targetPhase.id,
              source_phase_name: sourcePhase.name,
              target_phase_name: targetPhase.name
            };
            // console.log('[InteractivePhaseBar] Successfully mapped dependency:', `${sourcePhase.name} -> ${targetPhase.name}`);
            return mapped;
          }
          // console.log('[InteractivePhaseBar] Could not map dependency - missing phases');
          return null;
        })
        .filter(Boolean);

     
      return mappedDependencies;
    } catch (error) {
      console.error('[InteractivePhaseBar] Error loading relevant dependencies:', error);
      return [];
    }
  }, [allPhases, dependencies]);

  // Helper function to extract position from template ID
  const getPositionFromTemplateId = (templateId: string): number | null => {
    // console.log('[InteractivePhaseBar] Parsing template ID:', templateId);
    
    // Pattern 1: 00000000-0000-0000-0000-000000000001 (template IDs)
    let match = templateId.match(/00000000-0000-0000-0000-00000000000(\d+)$/);
    if (match) {
      const position = parseInt(match[1], 10);
      // console.log('[InteractivePhaseBar] Template ID pattern match - position:', position);
      return position;
    }
    
    // Pattern 2: Check if this is already a product phase ID
    const directPhase = allPhases.find(p => p.id === templateId);
    if (directPhase) {
      // console.log('[InteractivePhaseBar] Found direct phase match - position:', directPhase.position);
      return directPhase.position;
    }
    
    // console.log('[InteractivePhaseBar] No template ID pattern matched for:', templateId);
    return null;
  };

  // Log dependency information on component mount/update
  useEffect(() => {
    if (dependencies.length > 0 && allPhases.length > 0) {
      // console.log('[InteractivePhaseBar] Checking dependency mapping on mount/update');
      const relevantDependencies = getRelevantDependencies();
      // console.log('[InteractivePhaseBar] Mapped dependencies on mount:', relevantDependencies.length);
      
      // Log specific dependency that should affect Concept → Project phases
      const conceptToProject = relevantDependencies.find(dep => 
        dep.source_phase_name?.includes('Concept') && dep.target_phase_name?.includes('Project')
      );
      if (conceptToProject) {
        // console.log('[InteractivePhaseBar] Found Concept→Project dependency:', conceptToProject);
      } else {
        // console.log('[InteractivePhaseBar] Concept→Project dependency NOT FOUND');
        // console.log('[InteractivePhaseBar] Available dependencies:', relevantDependencies.map(d => `${d.source_phase_name} → ${d.target_phase_name}`));
      }
    }
  }, [dependencies, allPhases, getRelevantDependencies]);

  // Helper function to sort sequenced updates using dependency rules
  const getSortedSequenceUpdates = (updates: SequencedPhaseUpdate[]): SequencedPhaseUpdate[] => {
    try {
      // Get relevant dependencies (mapped from company to product phases)
      const relevantDependencies = getRelevantDependencies();
      if (relevantDependencies.length === 0) {
        // console.log('[InteractivePhaseBar] No relevant dependencies found, using original sequence');
        return updates;
      }

      // Convert updates to phase format for dependency sorting
      const phasesForSorting = updates.map(update => ({
        id: update.phaseId,
        name: allPhases.find(p => p.id === update.phaseId)?.name || 'Unknown',
        position: allPhases.find(p => p.id === update.phaseId)?.position || 0,
        calculated_start_day: 0 // We'll calculate this based on dependencies
      }));

      // Sort using dependency rules
      const sortedPhases = sortPhasesByDependencies(phasesForSorting, relevantDependencies);
      
      // Rebuild updates in the sorted order with proper sequencing
      const sortedUpdates: SequencedPhaseUpdate[] = [];
      let currentDate = updates[0]?.startDate || new Date();

      sortedPhases.forEach((sortedPhase) => {
        const originalUpdate = updates.find(u => u.phaseId === sortedPhase.id);
        if (originalUpdate) {
          const duration = differenceInDays(originalUpdate.endDate, originalUpdate.startDate);
          const endDate = addDays(currentDate, duration);
          
          sortedUpdates.push({
            phaseId: sortedPhase.id,
            startDate: currentDate,
            endDate: endDate
          });
          
          currentDate = addDays(endDate, 1); // Next phase starts the day after
        }
      });

      // console.log('[InteractivePhaseBar] Applied dependency-based sorting to sequence updates');
      return sortedUpdates;
    } catch (error) {
      console.error('[InteractivePhaseBar] Error sorting sequence updates:', error);
      return updates; // Fall back to original sequence
    }
  };


  const applyChanges = async (startDate: Date, endDate: Date) => {
    // console.log('[InteractivePhaseBar] applyChanges called for phase:', phase.id, phase.name);
    // console.log('[InteractivePhaseBar] New dates:', startDate.toISOString().split('T')[0], '->', endDate.toISOString().split('T')[0]);
    
    // ALWAYS accept the drag first - the moved phase becomes the new anchor
    // console.log('[InteractivePhaseBar] Setting new anchor position for phase:', phase.name);
    onDateChange(phase.id, startDate, endDate);
    
    // Then recalculate dependent phases based on the new anchor
    if (onBatchDateChange) {
      // console.log('[InteractivePhaseBar] Recalculating timeline from new anchor position');
      
      // Get relevant dependencies
      const relevantDependencies = getRelevantDependencies();
      
      if (relevantDependencies.length > 0) {
        // console.log('[InteractivePhaseBar] Using dependency-aware recalculation');
        await recalculateFromAnchor(startDate, endDate, relevantDependencies);
      }
    }
  };

  // Recalculate timeline using dependency-aware logic from new anchor
  const recalculateFromAnchor = async (anchorStart: Date, anchorEnd: Date, dependencies: any[]) => {
    try {
      const updates: SequencedPhaseUpdate[] = [];
      
      // Start with the moved phase as anchor
      updates.push({
        phaseId: phase.id,
        startDate: anchorStart,
        endDate: anchorEnd
      });

      // Build a map of current phases for easy lookup
      const phaseMap = new Map(allPhases.map(p => [p.id, {
        ...p,
        startDate: p.id === phase.id ? anchorStart : p.startDate,
        endDate: p.id === phase.id ? anchorEnd : p.endDate
      }]));

      // Process downstream dependencies (phases that depend on the moved phase)
      const processDownstreamDependencies = (sourcePhaseId: string) => {
        const sourcePhase = phaseMap.get(sourcePhaseId);
        if (!sourcePhase || !sourcePhase.endDate) return;

        const dependentPhases = dependencies.filter(dep => 
          dep.source_phase_id === sourcePhaseId && dep.dependency_type === 'finish_to_start'
        );

        dependentPhases.forEach(dep => {
          const targetPhase = phaseMap.get(dep.target_phase_id);
          if (!targetPhase) return;

          const lagDays = dep.lag_days || 0;
          const newStartDate = addDays(sourcePhase.endDate!, lagDays + 1);
          const duration = targetPhase.endDate && targetPhase.startDate 
            ? differenceInDays(targetPhase.endDate, targetPhase.startDate)
            : 14; // Default 2 weeks
          const newEndDate = addDays(newStartDate, duration);

          // Update in our map
          phaseMap.set(dep.target_phase_id, {
            ...targetPhase,
            startDate: newStartDate,
            endDate: newEndDate
          });

          // Add to updates
          updates.push({
            phaseId: dep.target_phase_id,
            startDate: newStartDate,
            endDate: newEndDate
          });

          // console.log(`[InteractivePhaseBar] Adjusted dependent phase ${targetPhase.name}: ${newStartDate.toISOString().split('T')[0]} -> ${newEndDate.toISOString().split('T')[0]}`);

          // Recursively process dependencies of this phase
          processDownstreamDependencies(dep.target_phase_id);
        });
      };

      // Process upstream dependencies (phases that the moved phase depends on)
      const processUpstreamDependencies = (targetPhaseId: string) => {
        const targetPhase = phaseMap.get(targetPhaseId);
        if (!targetPhase || !targetPhase.startDate) return;

        const prerequisitePhases = dependencies.filter(dep => 
          dep.target_phase_id === targetPhaseId && dep.dependency_type === 'finish_to_start'
        );

        prerequisitePhases.forEach(dep => {
          const sourcePhase = phaseMap.get(dep.source_phase_id);
          if (!sourcePhase) return;

          const lagDays = dep.lag_days || 0;
          const requiredEndDate = addDays(targetPhase.startDate!, -(lagDays + 1));
          const duration = sourcePhase.endDate && sourcePhase.startDate 
            ? differenceInDays(sourcePhase.endDate, sourcePhase.startDate)
            : 14;
          const newStartDate = addDays(requiredEndDate, -duration);

          // Only move upstream if it would create a conflict
          if (!sourcePhase.endDate || sourcePhase.endDate > requiredEndDate) {
            // Update in our map
            phaseMap.set(dep.source_phase_id, {
              ...sourcePhase,
              startDate: newStartDate,
              endDate: requiredEndDate
            });

            // Add to updates
            updates.push({
              phaseId: dep.source_phase_id,
              startDate: newStartDate,
              endDate: requiredEndDate
            });

            // console.log(`[InteractivePhaseBar] Adjusted prerequisite phase ${sourcePhase.name}: ${newStartDate.toISOString().split('T')[0]} -> ${requiredEndDate.toISOString().split('T')[0]}`);

            // Recursively process dependencies of this phase
            processUpstreamDependencies(dep.source_phase_id);
          }
        });
      };

      // Start cascade from the moved phase
      processDownstreamDependencies(phase.id);
      processUpstreamDependencies(phase.id);

      // console.log('[InteractivePhaseBar] Applying dependency-aware recalculation with', updates.length, 'updates');
      if (updates.length > 1) { // Only apply batch if there are dependent changes
        await onBatchDateChange!(updates);
      }

    } catch (error) {
      console.error('[InteractivePhaseBar] Error in dependency-aware recalculation:', error);
    }
  };

  const getCursor = () => {
    if (disabled) return 'not-allowed';
    if (dragState.isDragging) {
      return dragState.dragType === 'move' ? 'grabbing' : 'col-resize';
    }
    if (hoverZone === 'move') return 'grab';
    if (hoverZone === 'resize-start' || hoverZone === 'resize-end') return 'col-resize';
    return 'default';
  };

  // Calculate duration between start and end dates
  // Check if this is an unlimited phase - show "Ongoing" instead of days
  const isUnlimitedPhase = phase.name === "(08) Launch & Post-Launch" ||
    phase.name === "(C4) Post-Market Surveillance (PMS)";

  const calculatePhaseDuration = (startDate?: Date, endDate?: Date): string => {
    if (!startDate || !endDate) return "";

    if (isUnlimitedPhase) {
      return "Ongoing";
    }

    const days = differenceInDays(endDate, startDate);

    if (days < 0) return "Invalid dates";
    if (days === 0) return "Same day";
    if (days === 1) return "1 day";
    return `${days} days`;
  };

  const handlePhaseHeaderClick = () => {
    if (onDrillDown) {
      onDrillDown();
    } else if (!disabled) {
      // Navigate to the detailed phase view
      const currentUrl = window.location.pathname;
      const baseUrl = currentUrl.replace(/\/[^/]*$/, ''); // Remove the last segment (e.g., '/lifecycle')
      navigate(`${baseUrl}/phase/${phase.id}`);
    }
  };

  // Use span position and dates if this is a span dependency
  const actualPosition = spanPosition || position;
  const displayDates = previewDates || (spanPosition ? { startDate: spanPosition.spanStart, endDate: spanPosition.spanEnd } : (hasValidDates ? { startDate: phase.startDate!, endDate: phase.endDate! } : null));
  const affectedPhasesCount = sequencedPreview.length;
  const hasViolations = previewDates?.violations && previewDates.violations.length > 0;
  const hasWarnings = previewDates?.warnings && previewDates.warnings.length > 0;

  // Calculate duration text
  const durationText = displayDates ? calculatePhaseDuration(displayDates.startDate, displayDates.endDate) : "";

  // Calculate red coloring for unlimited phases
  const shouldShowRed = isUnlimitedPhase && metrics.mainProjectEndDate && displayDates;

  let redStartPosition = null;
  let isFullyRed = false;

  if (shouldShowRed) {
    if (displayDates.startDate >= metrics.mainProjectEndDate) {
      // Phase starts at or after main project end - should be fully red
      isFullyRed = true;
      redStartPosition = 0;
    } else {
      // Phase starts before main project end - red for extension portion only
      isFullyRed = false;
      redStartPosition = Math.max(0, ((calculatePositionFromDate(metrics.mainProjectEndDate, metrics) - actualPosition.left) / actualPosition.width) * 100);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-2">
          {/* Clickable phase name */}
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-medium truncate transition-colors ${disabled ? 'text-muted-foreground' : 'cursor-pointer hover:text-primary'
                }`}
              onClick={disabled ? undefined : handlePhaseHeaderClick}
            >
              {phase.name}
              {spanDependency && <span className="text-purple-600 ml-2">(Span)</span>}
            </span>
          </div>
          {/* Add Eye Icon to the right of the phase name */}
          <Eye className="h-4 w-4 cursor-pointer" onClick={handlePhaseHeaderClick} />
          {/* Status badge positioned right after phase name */}
          <Badge
            variant={phase.isCurrentPhase ? "default" : "secondary"}
            className="text-xs h-5 flex items-center justify-center"
          >
            {phase.status}
          </Badge>

          {/* Duration display positioned after status */}
          {durationText && (
            <Badge variant="secondary" className="text-xs h-5 flex items-center justify-center">
              {durationText}
            </Badge>
          )}

          {displayDates && (
            <span className="text-xs text-muted-foreground">
              {format(displayDates.startDate, 'MMM dd, yyyy')} - {format(displayDates.endDate, 'MMM dd, yyyy')}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2 min-h-[20px]">
          {dragState.isDragging && affectedPhasesCount > 1 && (
            <Badge variant="secondary" className="text-xs h-5 flex items-center justify-center bg-blue-100 text-blue-800">
              +{affectedPhasesCount - 1} phases affected
            </Badge>
          )}
        </div>
      </div>

      <div className="relative h-4 bg-gray-100 rounded">
        {/* Special styling for span dependencies */}
        {(hasValidDates || spanPosition) && (
          <div
            ref={barRef}
            className={`absolute h-full rounded transition-all relative overflow-hidden ${dragState.isDragging ? 'opacity-70' : ''
              } ${hoverZone ? 'ring-2 ring-blue-300' : ''
              } ${disabled ? 'opacity-50' : ''} ${dragState.isDragging && sequencePhases ? 'ring-2 ring-orange-300' : ''
              } ${hasViolations ? 'ring-2 ring-red-500' : ''} ${hasWarnings && !hasViolations ? 'ring-2 ring-amber-400' : ''
              } ${spanPosition ? 'ring-2 ring-purple-300' : ''}`}
            style={{
              left: `${actualPosition.left}%`,
              width: `${actualPosition.width}%`,
              cursor: spanPosition ? 'not-allowed' : getCursor() // Disable dragging for span dependencies
            }}
            onMouseDown={spanPosition ? undefined : handleMouseDown} // Disable interaction for span dependencies
            onMouseMove={spanPosition ? undefined : handleMouseMove}
            onMouseLeave={spanPosition ? undefined : handleMouseLeave}
          >
            {/* Main phase bar */}
            <div
              className={`absolute inset-0 rounded ${(() => {
                // Special styling for span dependencies
                if (spanPosition) return 'bg-purple-400 bg-opacity-70';
                // Background color logic
                if (phase.status === 'Completed') return 'bg-green-500';
                if (phase.isCurrentPhase) return 'bg-blue-500';
                if (phase.endDate && phase.status !== 'Completed') {
                  const today = new Date();
                  const daysDiff = differenceInDays(phase.endDate, today);
                  if (daysDiff < 0) return 'bg-red-500'; // Past due
                }
                return 'bg-gray-400';
              })()
                } ${(() => {
                  // Border logic - red border if less than 7 days left
                  if (spanPosition) return ''; // No warning borders for span dependencies
                  if (phase.endDate && phase.status !== 'Completed') {
                    const today = new Date();
                    const daysDiff = differenceInDays(phase.endDate, today);
                    if (daysDiff >= 0 && daysDiff <= 7) return 'border-4 border-red-500';
                  }
                  return '';
                })()
                }`}
            >
              {/* Add pattern for span dependencies */}
              {spanPosition && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-300 to-transparent opacity-50 rounded"></div>
              )}
            </div>

            {/* Red extension portion for unlimited phases */}
            {shouldShowRed && redStartPosition !== null && (
              <div
                className="absolute top-0 bottom-0 bg-black rounded-r"
                style={{
                  left: `${redStartPosition}%`,
                  right: '0'
                }}
              />
            )}

            {/* Resize handles - disabled for span dependencies */}
            {!disabled && !spanPosition && (
              <>
                <div
                  className="absolute left-0 top-0 w-3 h-full cursor-col-resize bg-blue-500/20 hover:bg-blue-500/50 z-20"
                  title="Drag to resize phase start"
                />
                <div
                  className="absolute right-0 top-0 w-3 h-full cursor-col-resize bg-blue-500/20 hover:bg-blue-500/50 z-20"
                  title="Drag to resize phase end"
                />
              </>
            )}
          </div>
        )}

        {!hasValidDates && !spanPosition && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-gray-500">No dates scheduled</span>
          </div>
        )}
      </div>

      {/* Preview tooltip during drag */}
      {dragState.isDragging && previewDates && (
        <div className={`absolute top-10 left-1/2 transform -translate-x-1/2 text-white text-xs px-2 py-1 rounded z-10 ${hasViolations ? 'bg-red-600' : 'bg-black'
          }`}>
          <div className="text-center">
            {format(previewDates.startDate, 'MMM dd, yyyy')} - {format(previewDates.endDate, 'MMM dd, yyyy')}
          </div>
          {calculatePhaseDuration(previewDates.startDate, previewDates.endDate) && (
            <div className="text-center text-xs opacity-75 mt-1">
              {calculatePhaseDuration(previewDates.startDate, previewDates.endDate)}
            </div>
          )}
          {onBatchDateChange && affectedPhasesCount > 1 && (
            <div className="text-center text-xs opacity-75 mt-1">
              Will update {affectedPhasesCount} phases sequentially
            </div>
          )}
        </div>
      )}

    </div>
  );
}
