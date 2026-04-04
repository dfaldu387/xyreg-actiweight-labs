
import { toast } from 'sonner';

export interface PhaseForValidation {
  id: string;
  name: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  conflictingPhase?: string;
}

export interface TimelineConflict {
  phaseId: string;
  phaseName: string;
  conflictType: 'start_after_end' | 'end_before_start' | 'timeline_order';
  message: string;
}

/**
 * Validates the entire timeline for logical consistency
 */
export function validateEntireTimeline(phases: PhaseForValidation[]): TimelineConflict[] {
  const conflicts: TimelineConflict[] = [];
  
  for (let i = 0; i < phases.length; i++) {
    const currentPhase = phases[i];
    
    // Check if phase's own dates are consistent
    if (currentPhase.startDate && currentPhase.endDate && currentPhase.startDate > currentPhase.endDate) {
      conflicts.push({
        phaseId: currentPhase.id,
        phaseName: currentPhase.name,
        conflictType: 'start_after_end',
        message: `${currentPhase.name} start date is after its end date`
      });
    }
    
    // Check against all subsequent phases
    for (let j = i + 1; j < phases.length; j++) {
      const laterPhase = phases[j];
      
      // Current phase end date should not be after later phase end date
      if (currentPhase.endDate && laterPhase.endDate && currentPhase.endDate > laterPhase.endDate) {
        conflicts.push({
          phaseId: currentPhase.id,
          phaseName: currentPhase.name,
          conflictType: 'timeline_order',
          message: `${currentPhase.name} ends after ${laterPhase.name} (${currentPhase.endDate.toLocaleDateString()} > ${laterPhase.endDate.toLocaleDateString()})`
        });
      }
      
      // Current phase end date should not be after later phase start date
      if (currentPhase.endDate && laterPhase.startDate && currentPhase.endDate > laterPhase.startDate) {
        conflicts.push({
          phaseId: currentPhase.id,
          phaseName: currentPhase.name,
          conflictType: 'timeline_order',
          message: `${currentPhase.name} ends after ${laterPhase.name} starts (${currentPhase.endDate.toLocaleDateString()} > ${laterPhase.startDate.toLocaleDateString()})`
        });
      }
    }
  }
  
  return conflicts;
}

/**
 * Validates that a phase's start date maintains timeline consistency
 */
export function validatePhaseStartDate(
  phases: PhaseForValidation[],
  phaseId: string,
  newStartDate: Date | undefined
): ValidationResult {
  if (!newStartDate) {
    return { isValid: true };
  }

  const phaseIndex = phases.findIndex(p => p.id === phaseId);
  if (phaseIndex === -1) {
    return { isValid: false, message: 'Phase not found' };
  }

  const currentPhase = phases[phaseIndex];
  
  // Check against own end date
  if (currentPhase.endDate && newStartDate > currentPhase.endDate) {
    return {
      isValid: false,
      message: `Start date cannot be after the end date (${currentPhase.endDate.toLocaleDateString()})`
    };
  }

  // Check against preceding phases
  for (let i = 0; i < phaseIndex; i++) {
    const precedingPhase = phases[i];
    
    if (precedingPhase.endDate && newStartDate < precedingPhase.endDate) {
      return {
        isValid: false,
        message: `Start date cannot be earlier than ${precedingPhase.name} end date (${precedingPhase.endDate.toLocaleDateString()})`,
        conflictingPhase: precedingPhase.name
      };
    }
  }

  // Check against following phases
  for (let i = phaseIndex + 1; i < phases.length; i++) {
    const followingPhase = phases[i];
    
    if (followingPhase.startDate && newStartDate > followingPhase.startDate) {
      return {
        isValid: false,
        message: `Start date cannot be after ${followingPhase.name} start date (${followingPhase.startDate.toLocaleDateString()})`,
        conflictingPhase: followingPhase.name
      };
    }
    
    if (followingPhase.endDate && newStartDate > followingPhase.endDate) {
      return {
        isValid: false,
        message: `Start date cannot be after ${followingPhase.name} end date (${followingPhase.endDate.toLocaleDateString()})`,
        conflictingPhase: followingPhase.name
      };
    }
  }

  return { isValid: true };
}

/**
 * Validates that a phase's end date maintains timeline consistency
 */
export function validatePhaseEndDate(
  phases: PhaseForValidation[],
  phaseId: string,
  newEndDate: Date | undefined
): ValidationResult {
  if (!newEndDate) {
    return { isValid: true };
  }

  const phaseIndex = phases.findIndex(p => p.id === phaseId);
  if (phaseIndex === -1) {
    return { isValid: false, message: 'Phase not found' };
  }

  const currentPhase = phases[phaseIndex];
  
  // Check against own start date
  if (currentPhase.startDate && newEndDate < currentPhase.startDate) {
    return {
      isValid: false,
      message: `End date cannot be earlier than the start date (${currentPhase.startDate.toLocaleDateString()})`
    };
  }

  // Check against following phases
  for (let i = phaseIndex + 1; i < phases.length; i++) {
    const followingPhase = phases[i];
    
    if (followingPhase.startDate && newEndDate > followingPhase.startDate) {
      return {
        isValid: false,
        message: `End date cannot be after ${followingPhase.name} start date (${followingPhase.startDate.toLocaleDateString()})`,
        conflictingPhase: followingPhase.name
      };
    }
    
    if (followingPhase.endDate && newEndDate > followingPhase.endDate) {
      return {
        isValid: false,
        message: `End date cannot be after ${followingPhase.name} end date (${followingPhase.endDate.toLocaleDateString()})`,
        conflictingPhase: followingPhase.name
      };
    }
  }

  return { isValid: true };
}

/**
 * Gets the minimum allowed date for a phase start date
 */
export function getMinStartDate(phases: PhaseForValidation[], phaseId: string): Date | undefined {
  const phaseIndex = phases.findIndex(p => p.id === phaseId);
  if (phaseIndex <= 0) {
    return undefined;
  }

  let minDate: Date | undefined = undefined;
  
  // Find the latest end date from all preceding phases
  for (let i = 0; i < phaseIndex; i++) {
    const precedingPhase = phases[i];
    if (precedingPhase.endDate && (!minDate || precedingPhase.endDate > minDate)) {
      minDate = precedingPhase.endDate;
    }
  }

  return minDate;
}

/**
 * Gets the maximum allowed date for a phase end date
 */
export function getMaxEndDate(phases: PhaseForValidation[], phaseId: string): Date | undefined {
  const phaseIndex = phases.findIndex(p => p.id === phaseId);
  if (phaseIndex === -1 || phaseIndex >= phases.length - 1) {
    return undefined;
  }

  let maxDate: Date | undefined = undefined;
  
  // Find the earliest start or end date from all following phases
  for (let i = phaseIndex + 1; i < phases.length; i++) {
    const followingPhase = phases[i];
    
    if (followingPhase.startDate && (!maxDate || followingPhase.startDate < maxDate)) {
      maxDate = followingPhase.startDate;
    }
    
    if (followingPhase.endDate && (!maxDate || followingPhase.endDate < maxDate)) {
      maxDate = followingPhase.endDate;
    }
  }

  return maxDate;
}

/**
 * Suggests fixes for timeline conflicts
 */
export function suggestTimelineFix(conflicts: TimelineConflict[]): string[] {
  const suggestions: string[] = [];
  
  if (conflicts.length === 0) return suggestions;
  
  suggestions.push("Timeline Issues Detected:");
  conflicts.forEach(conflict => {
    suggestions.push(`• ${conflict.message}`);
  });
  
  suggestions.push("");
  suggestions.push("Suggested Actions:");
  suggestions.push("1. Review phase dates to ensure chronological order");
  suggestions.push("2. Adjust earlier phases' end dates to be before later phases");
  suggestions.push("3. Consider if phase sequence needs to be reordered");
  
  return suggestions;
}
