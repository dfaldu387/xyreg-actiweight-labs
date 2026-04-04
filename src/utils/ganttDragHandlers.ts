
import { addDays, differenceInDays, format } from "date-fns";

export interface DragState {
  isDragging: boolean;
  dragType: 'move' | 'resize-start' | 'resize-end' | null;
  phaseId: string | null;
  startX: number;
  startDate: Date | null;
  startEndDate: Date | null;
  originalDuration: number;
}

export interface TimelineMetrics {
  earliestDate: Date;
  latestDate: Date;
  totalDays: number;
  containerWidth: number;
  mainProjectEndDate?: Date;
}

export interface PhaseForSequencing {
  id: string;
  name?: string;
  startDate?: Date;
  endDate?: Date;
  position: number;
}

export interface SequencedPhaseUpdate {
  phaseId: string;
  startDate: Date;
  endDate: Date;
  position?: number;
}

export const calculateDateFromPosition = (
  xPosition: number,
  containerWidth: number,
  metrics: TimelineMetrics
): Date => {
  const percentage = Math.max(0, Math.min(1, xPosition / containerWidth));
  const dayOffset = Math.round(percentage * metrics.totalDays);
  return addDays(metrics.earliestDate, dayOffset);
};

export const calculatePositionFromDate = (
  date: Date,
  metrics: TimelineMetrics
): number => {
  const dayOffset = differenceInDays(date, metrics.earliestDate);
  return (dayOffset / metrics.totalDays) * 100;
};

export const getDragZone = (
  event: React.MouseEvent,
  barElement: HTMLElement
): 'move' | 'resize-start' | 'resize-end' => {
  const rect = barElement.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const width = rect.width;
  
  // Increased edge threshold for better usability - minimum 12px or 25% of width
  const edgeThreshold = Math.min(Math.max(12, width * 0.25), width * 0.4);
  
  if (x <= edgeThreshold) {
    return 'resize-start';
  } else if (x >= width - edgeThreshold) {
    return 'resize-end';
  } else {
    return 'move';
  }
};

export const calculateNewDates = (
  dragState: DragState,
  currentX: number,
  metrics: TimelineMetrics,
  sequencePhases: boolean = false,
  allPhases: PhaseForSequencing[] = [],
  currentPhaseId?: string,
  dependencies: any[] = [],
  validateDependencies: boolean = true
): { startDate: Date; endDate: Date; isValid?: boolean; violations?: string[]; warnings?: string[] } | null => {
  console.log('[calculateNewDates] Input:', {
    dragType: dragState.dragType,
    sequencePhases,
    currentPhaseId,
    allPhasesCount: allPhases.length,
    dragState: {
      startDate: dragState.startDate,
      startEndDate: dragState.startEndDate,
      startX: dragState.startX
    }
  });

  if (!dragState.startDate || !dragState.startEndDate) {
    console.warn('[calculateNewDates] Missing start or end date in drag state');
    return null;
  }
  
  const deltaX = currentX - dragState.startX;
  const containerWidth = metrics.containerWidth;
  const daysDelta = Math.round((deltaX / containerWidth) * metrics.totalDays);
  
  console.log('[calculateNewDates] Delta calculation:', {
    deltaX,
    containerWidth,
    totalDays: metrics.totalDays,
    daysDelta
  });
  
  let newStartDate: Date;
  let newEndDate: Date;
  
  switch (dragState.dragType) {
    case 'move':
      newStartDate = addDays(dragState.startDate, daysDelta);
      newEndDate = addDays(dragState.startEndDate, daysDelta);
      break;
      
    case 'resize-start':
      newStartDate = addDays(dragState.startDate, daysDelta);
      newEndDate = dragState.startEndDate;
      
      // Ensure start is before end with minimum 1 day duration
      if (newStartDate >= newEndDate) {
        newStartDate = addDays(newEndDate, -1);
      }
      break;
      
    case 'resize-end':
      newStartDate = dragState.startDate;
      newEndDate = addDays(dragState.startEndDate, daysDelta);
      
      // Ensure end is after start with minimum 1 day duration
      if (newEndDate <= newStartDate) {
        newEndDate = addDays(newStartDate, 1);
      }
      break;
      
    default:
      console.warn('[calculateNewDates] Unknown drag type:', dragState.dragType);
      return null;
  }
  
  let result = { 
    startDate: newStartDate, 
    endDate: newEndDate, 
    isValid: true, 
    violations: [] as string[], 
    warnings: [] as string[] 
  };
  
  // Smart dependency validation - show warnings instead of blocking
  if (validateDependencies && dependencies.length > 0 && currentPhaseId) {
    const violations: string[] = [];
    const warnings: string[] = [];
    
    // Check incoming dependencies (predecessors)
    const incomingDeps = dependencies.filter(dep => dep.target_phase_id === currentPhaseId);
    for (const dep of incomingDeps) {
      const sourcePhase = allPhases.find(p => p.id === dep.source_phase_id);
      if (sourcePhase?.endDate) {
        const requiredStartDate = addDays(sourcePhase.endDate, dep.lag_days + 1);
        if (newStartDate < requiredStartDate) {
          warnings.push(`Moving before ${format(requiredStartDate, 'MMM dd')} breaks dependency with ${sourcePhase.name || 'predecessor'}`);
        }
      }
    }
    
    // Check outgoing dependencies (successors)
    const outgoingDeps = dependencies.filter(dep => dep.source_phase_id === currentPhaseId);
    for (const dep of outgoingDeps) {
      const targetPhase = allPhases.find(p => p.id === dep.target_phase_id);
      if (targetPhase?.startDate) {
        const maxEndDate = addDays(targetPhase.startDate, -(dep.lag_days + 1));
        if (newEndDate > maxEndDate) {
          warnings.push(`Moving after ${format(maxEndDate, 'MMM dd')} breaks dependency with ${targetPhase.name || 'successor'}`);
        }
      }
    }
    
    // Enhanced validation: allow moves but show warnings
    result.isValid = true; // Always allow moves in smart mode
    result.violations = violations;
    result.warnings = warnings;
  }
  
  console.log('[calculateNewDates] Result:', {
    startDate: result.startDate.toISOString().split('T')[0],
    endDate: result.endDate.toISOString().split('T')[0],
    isValid: result.isValid,
    violations: result.violations,
    warnings: result.warnings
  });
  
  return result;
};

// Smart dependency suggestion system
export const suggestDependencies = (
  movedPhase: PhaseForSequencing,
  allPhases: PhaseForSequencing[],
  existingDependencies: any[] = []
): Array<{
  sourcePhaseId: string;
  sourcePhaseName: string;
  type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
  reason: string;
}> => {
  const suggestions = [];
  const sortedPhases = [...allPhases].sort((a, b) => a.position - b.position);
  const movedPhaseIndex = sortedPhases.findIndex(p => p.id === movedPhase.id);
  
  if (movedPhaseIndex <= 0) return suggestions;
  
  // Suggest dependency with immediate predecessor
  const predecessorPhase = sortedPhases[movedPhaseIndex - 1];
  if (predecessorPhase && !existingDependencies.some(dep => 
    dep.source_phase_id === predecessorPhase.id && dep.target_phase_id === movedPhase.id
  )) {
    suggestions.push({
      sourcePhaseId: predecessorPhase.id,
      sourcePhaseName: predecessorPhase.name || `Phase ${predecessorPhase.position}`,
      type: 'finish_to_start',
      reason: 'Sequential dependency with previous phase'
    });
  }
  
  return suggestions;
};

export const calculateSequencedPhaseUpdates = (
  draggedPhaseId: string,
  newStartDate: Date,
  newEndDate: Date,
  allPhases: PhaseForSequencing[],
  dragType: 'move' | 'resize-start' | 'resize-end' = 'move',
  dependencies: any[] = []
): SequencedPhaseUpdate[] => {
  // Auto-sequencing disabled - only return the dragged phase update
  return [{
    phaseId: draggedPhaseId,
    startDate: newStartDate,
    endDate: newEndDate,
    position: allPhases.find(p => p.id === draggedPhaseId)?.position || 0
  }];
};

// New function to handle position updates when phases are reordered
export const calculatePositionUpdates = (
  draggedPhaseId: string,
  newPosition: number,
  allPhases: PhaseForSequencing[]
): SequencedPhaseUpdate[] => {
  console.log('[calculatePositionUpdates] Starting position update calculation:', {
    draggedPhaseId,
    newPosition,
    totalPhases: allPhases.length
  });

  const updates: SequencedPhaseUpdate[] = [];
  const sortedPhases = [...allPhases].sort((a, b) => a.position - b.position);
  const draggedPhase = sortedPhases.find(p => p.id === draggedPhaseId);
  
  if (!draggedPhase) {
    console.error('[calculatePositionUpdates] Dragged phase not found');
    return updates;
  }

  const oldPosition = draggedPhase.position;
  
  // If position hasn't changed, no updates needed
  if (oldPosition === newPosition) {
    console.log('[calculatePositionUpdates] Position unchanged, no updates needed');
    return updates;
  }

  // Create new order by moving the phase
  const newOrder = [...sortedPhases];
  const [movedPhase] = newOrder.splice(oldPosition - 1, 1);
  newOrder.splice(newPosition - 1, 0, movedPhase);
  
  // Update positions for all affected phases
  newOrder.forEach((phase, index) => {
    const newPos = index + 1;
    if (phase.position !== newPos) {
      updates.push({
        phaseId: phase.id,
        startDate: phase.startDate || new Date(),
        endDate: phase.endDate || new Date(),
        position: newPos
      });
    }
  });

  console.log('[calculatePositionUpdates] Position updates:', {
    totalUpdates: updates.length,
    updates: updates.map(u => ({
      phaseId: u.phaseId,
      oldPosition: sortedPhases.find(p => p.id === u.phaseId)?.position,
      newPosition: u.position
    }))
  });

  return updates;
};
