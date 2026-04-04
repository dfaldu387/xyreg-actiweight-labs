/**
 * Utility functions for phase ordering and sorting
 */

export interface PhaseWithOrder {
  id: string;
  name: string;
  position: number;
  is_predefined_core_phase: boolean;
  [key: string]: any;
}

/**
 * Get phase order based on position field rather than extracted numbers
 */
export function getPhaseOrder(phase: PhaseWithOrder): number {
  // Use the position field from database as the primary ordering mechanism
  return phase.position || 0;
}

/**
 * Sort phases by their logical lifecycle order using position field
 */
export function sortPhasesByLogicalOrder<T extends PhaseWithOrder>(phases: T[]): T[] {
  return [...phases].sort((a, b) => {
    // Primary sort by position
    if (a.position !== b.position) {
      return a.position - b.position;
    }
    
    // Secondary sort by system vs custom phases
    if (a.is_predefined_core_phase && !b.is_predefined_core_phase) {
      return -1;
    }
    if (!a.is_predefined_core_phase && b.is_predefined_core_phase) {
      return 1;
    }
    
    // Tertiary sort alphabetically
    return a.name.localeCompare(b.name);
  });
}

/**
 * Sort phases within a category by their logical order
 */
export function sortPhasesInCategory<T extends PhaseWithOrder>(phases: T[], isSystemCategory: boolean): T[] {
  if (isSystemCategory) {
    // For system categories, sort by numeric prefix
    return sortPhasesByLogicalOrder(phases);
  } else {
    // For custom categories, sort by position then name
    return [...phases].sort((a, b) => {
      if (a.position !== b.position) {
        return a.position - b.position;
      }
      return a.name.localeCompare(b.name);
    });
  }
}