/**
 * Utility functions for sorting phases by dependencies
 * Upstream phases (those without dependencies) start first
 */

export interface PhaseWithDependencies {
  id: string;
  name: string;
  position: number;
  calculated_start_day?: number;
  [key: string]: any;
}

export interface PhaseDependency {
  id: string;
  source_phase_id: string;
  target_phase_id: string;
  dependency_type: string;
  source_phase_name?: string;
  target_phase_name?: string;
}

/**
 * Sort phases by:
 * Rule 1: Phases with dependencies first
 * Rule 2: Within phases with dependencies, sort by start day (0 first, then ascending)
 * Rule 3: Phases without dependencies last, sorted by start day ascending
 */
export function sortPhasesByDependencies<T extends PhaseWithDependencies>(
  phases: T[],
  dependencies: PhaseDependency[]
): T[] {
  

  // Build map of which phases have ANY dependencies (incoming OR outgoing)
  const phasesWithAnyDeps = new Set<string>();
  dependencies.forEach(dep => {
    // All dependency types create a relationship between phases
    phasesWithAnyDeps.add(dep.target_phase_id); // incoming dependency
    phasesWithAnyDeps.add(dep.source_phase_id); // outgoing dependency
  });

  // Separate phases into two groups
  const phasesWithDeps: T[] = [];
  const phasesWithoutDeps: T[] = [];

  phases.forEach(phase => {
    if (phasesWithAnyDeps.has(phase.id)) {
      phasesWithDeps.push(phase);
      
    } else {
      phasesWithoutDeps.push(phase);
      
    }
  });

  // Sort each group by start day (0 first, then ascending)
  const sortByStartDay = (a: T, b: T) => {
    const startDayA = a.calculated_start_day ?? 0;
    const startDayB = b.calculated_start_day ?? 0;
    
    if (startDayA !== startDayB) {
      return startDayA - startDayB;
    }
    
    // If start days are equal, sort by position as fallback
    return a.position - b.position;
  };

  // Rule 2: Sort phases with dependencies by start day
  phasesWithDeps.sort(sortByStartDay);
  
  // Rule 3: Sort phases without dependencies by start day
  phasesWithoutDeps.sort(sortByStartDay);

  // Rule 1: Phases with dependencies first, then phases without dependencies
  const result = [...phasesWithDeps, ...phasesWithoutDeps];

  
  result.forEach((phase, index) => {
    const hasDeps = phasesWithAnyDeps.has(phase.id) ? 'HAS DEPS' : 'NO DEPS';
    const startDay = phase.calculated_start_day ?? 0;
    
  });

  return result;
}

/**
 * Get phases grouped by dependency level
 * Level 0: No dependencies (upstream)
 * Level 1: Depends on level 0 phases
 * Level 2: Depends on level 1 phases, etc.
 */
export function getPhasesByDependencyLevel<T extends PhaseWithDependencies>(
  phases: T[],
  dependencies: PhaseDependency[]
): T[][] {
  const sorted = sortPhasesByDependencies(phases, dependencies);
  const levels: T[][] = [];
  const phaseToLevel = new Map<string, number>();
  
  // Build dependency map
  const dependsOn = new Map<string, string[]>();
  phases.forEach(phase => dependsOn.set(phase.id, []));
  
  dependencies.forEach(dep => {
    // All dependency types create a relationship where target depends on source
    // The specific type (finish_to_start, start_to_finish, etc.) affects timing calculation
    // but for dependency level grouping, all types indicate a dependency relationship
    dependsOn.get(dep.target_phase_id)?.push(dep.source_phase_id);
  });

  // Assign levels
  sorted.forEach(phase => {
    const deps = dependsOn.get(phase.id) || [];
    if (deps.length === 0) {
      // No dependencies = level 0
      phaseToLevel.set(phase.id, 0);
    } else {
      // Level = max level of dependencies + 1
      const depLevels = deps.map(depId => phaseToLevel.get(depId) || 0);
      const maxDepLevel = Math.max(...depLevels);
      phaseToLevel.set(phase.id, maxDepLevel + 1);
    }
  });

  // Group by level
  sorted.forEach(phase => {
    const level = phaseToLevel.get(phase.id) || 0;
    if (!levels[level]) {
      levels[level] = [];
    }
    levels[level].push(phase);
  });

  return levels;
}