import { addDays, subDays, differenceInDays } from 'date-fns';
import { PhaseDependency } from './phaseDependencyService';

export interface EnhancedPhase {
  id: string;
  name?: string;
  startDate?: Date;
  endDate?: Date;
  duration_days?: number;
  position?: number;
  is_continuous_process?: boolean;
  start_percentage?: number;
  end_percentage?: number;
}

export interface CalculatedPhaseDates {
  phase_id: string;
  calculated_start_date: string;
  calculated_end_date: string;
}

export class EnhancedDependencyService {
  /**
   * Calculate phase timeline considering all dependency types including span dependencies
   */
  static calculateTimelineWithDependencies(
    phases: EnhancedPhase[],
    dependencies: PhaseDependency[],
    targetDate: Date,
    mode: 'forward' | 'backward' = 'forward'
  ): EnhancedPhase[] {
    console.log('[EnhancedDependencyService] Calculating timeline with dependencies');
    console.log('[EnhancedDependencyService] Dependencies:', dependencies);

    if (!phases?.length) return [];

    // Create a working copy of phases
    const workingPhases = phases.map(phase => ({ ...phase }));
    
    // Process span dependencies first as they determine phase durations
    this.processSpanDependencies(workingPhases, dependencies);
    
    // Then process standard dependencies
    if (mode === 'backward') {
      return this.calculateBackwardWithDependencies(workingPhases, dependencies, targetDate);
    } else {
      return this.calculateForwardWithDependencies(workingPhases, dependencies, targetDate);
    }
  }

  /**
   * Process span dependencies to set phase constraints
   * span_between_phases: target phase spans from end of source phase to start of end phase
   */
  private static processSpanDependencies(phases: EnhancedPhase[], dependencies: PhaseDependency[]) {
    // Skip span dependency processing for now since end_phase_id column doesn't exist
    // This will be implemented when the database structure is updated to support full span dependencies
    console.log('[EnhancedDependencyService] Skipping span dependency processing - feature disabled');
  }

  /**
   * Calculate forward timeline with dependencies
   */
  private static calculateForwardWithDependencies(
    phases: EnhancedPhase[],
    dependencies: PhaseDependency[],
    projectStartDate: Date
  ): EnhancedPhase[] {
    console.log('[EnhancedDependencyService] Forward calculation starting from:', projectStartDate);

    // Build dependency map
    const dependencyMap = new Map<string, PhaseDependency[]>();
    dependencies.forEach(dep => {
      if (!dependencyMap.has(dep.target_phase_id)) {
        dependencyMap.set(dep.target_phase_id, []);
      }
      dependencyMap.get(dep.target_phase_id)!.push(dep);
    });

    // Calculate phases in dependency order
    const calculatedPhases: EnhancedPhase[] = [];
    const processedPhases = new Set<string>();
    const phaseResults = new Map<string, { startDate: Date; endDate: Date }>();

    // Helper to get the earliest start date for a phase based on its dependencies
    const getEarliestStartDate = (phaseId: string): Date => {
      const deps = dependencyMap.get(phaseId) || [];
      let earliestStart = projectStartDate;

      for (const dep of deps) {
        const sourcePhaseResult = phaseResults.get(dep.source_phase_id);
        if (sourcePhaseResult) {
          let requiredDate: Date;
          
          switch (dep.dependency_type) {
            case 'finish_to_start':
              requiredDate = addDays(sourcePhaseResult.endDate, dep.lag_days + 1);
              break;
            case 'start_to_start':
              requiredDate = addDays(sourcePhaseResult.startDate, dep.lag_days);
              break;
            case 'finish_to_finish':
              // This will be handled when calculating end date
              continue;
            case 'start_to_finish':
              // This will be handled when calculating end date
              continue;
            default:
              continue;
          }
          
          if (requiredDate > earliestStart) {
            earliestStart = requiredDate;
          }
        }
      }

      return earliestStart;
    };

    // Sort phases by position for processing order
    const sortedPhases = [...phases].sort((a, b) => (a.position || 0) - (b.position || 0));

    // Process each phase
    for (const phase of sortedPhases) {
      if (processedPhases.has(phase.id)) continue;

      // Skip span-controlled phases for now
      if ((phase as any).isSpanControlled) continue;

      const startDate = getEarliestStartDate(phase.id);
      const duration = phase.duration_days || 30;
      const endDate = addDays(startDate, duration);

      phaseResults.set(phase.id, { startDate, endDate });
      
      calculatedPhases.push({
        ...phase,
        startDate,
        endDate
      });
      
      processedPhases.add(phase.id);
    }

    // Now process span-controlled phases
    for (const phase of phases) {
      if (!(phase as any).isSpanControlled) continue;

      const startConstraintResult = (phase as any).spanStartConstraintId ? 
        phaseResults.get((phase as any).spanStartConstraintId) : null;
      const endConstraintResult = (phase as any).spanEndConstraintId ? 
        phaseResults.get((phase as any).spanEndConstraintId) : null;

      let startDate: Date;
      let endDate: Date;
      
      // For span dependencies: start after first constraint ends, end before second constraint starts
      if (startConstraintResult) {
        startDate = addDays(startConstraintResult.endDate, 1); // Start day after constraint phase ends
        console.log(`  - Span starts day after ${(phase as any).spanStartConstraintId} ends: ${startDate.toISOString().split('T')[0]}`);
      } else {
        startDate = projectStartDate; // No start constraint, use project start
      }
      
      if (endConstraintResult) {
        endDate = subDays(endConstraintResult.startDate, 1); // End day before constraint phase starts
        console.log(`  - Span ends day before ${(phase as any).spanEndConstraintId} starts: ${endDate.toISOString().split('T')[0]}`);
      } else {
        // No end constraint, use phase duration from start
        const duration = phase.duration_days || 30;
        endDate = addDays(startDate, duration);
      }

      // Ensure end date is after start date
      if (endDate <= startDate) {
        console.warn(`  - Span constraint resulted in invalid date range, using minimum 1 day duration`);
        endDate = addDays(startDate, 1);
      }

      phaseResults.set(phase.id, { startDate, endDate });
      
      calculatedPhases.push({
        ...phase,
        startDate,
        endDate,
        duration_days: differenceInDays(endDate, startDate)
      });
      
      processedPhases.add(phase.id);
    }

    return calculatedPhases;
  }

  /**
   * Calculate backward timeline with dependencies
   */
  private static calculateBackwardWithDependencies(
    phases: EnhancedPhase[],
    dependencies: PhaseDependency[],
    projectEndDate: Date
  ): EnhancedPhase[] {
    // For backward calculation, we need to reverse the logic
    // This is more complex and would require topological sorting
    // For now, fall back to simple backward calculation
    console.log('[EnhancedDependencyService] Backward calculation - using simplified approach');
    
    // Sort descending by position so we process the last phase first (closest to project end)
    const sortedPhases = [...phases].sort((a, b) => (b.position || 0) - (a.position || 0));
    let currentDate = new Date(projectEndDate);

    const calculatedPhases = sortedPhases.map(phase => {
      const duration = phase.duration_days || 30;
      const endDate = new Date(currentDate);
      const startDate = subDays(endDate, duration);

      currentDate = subDays(startDate, 1);

      return {
        ...phase,
        startDate,
        endDate
      };
    });

    // Sort back to ascending position order for display
    return calculatedPhases.sort((a, b) => (a.position || 0) - (b.position || 0));
  }

  /**
   * Validate dependencies for circular references and logical consistency
   */
  static validateDependencies(dependencies: PhaseDependency[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check for circular dependencies using depth-first search
    const graph = new Map<string, string[]>();
    
    // Build adjacency list
    dependencies.forEach(dep => {
      if (!graph.has(dep.source_phase_id)) {
        graph.set(dep.source_phase_id, []);
      }
      graph.get(dep.source_phase_id)!.push(dep.target_phase_id);
      
      // For span dependencies, also add end phase relationship
      if (dep.dependency_type === 'span_between_phases' && (dep as any).end_phase_id) {
        if (!graph.has((dep as any).end_phase_id)) {
          graph.set((dep as any).end_phase_id, []);
        }
        graph.get((dep as any).end_phase_id)!.push(dep.target_phase_id);
      }
    });
    
    // Check for cycles
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (node: string): boolean => {
      if (recursionStack.has(node)) return true;
      if (visited.has(node)) return false;
      
      visited.add(node);
      recursionStack.add(node);
      
      const neighbors = graph.get(node) || [];
      for (const neighbor of neighbors) {
        if (hasCycle(neighbor)) return true;
      }
      
      recursionStack.delete(node);
      return false;
    };
    
    for (const node of graph.keys()) {
      if (hasCycle(node)) {
        errors.push('Circular dependency detected');
        break;
      }
    }
    
    // Validate span dependencies
    dependencies
      .filter(dep => dep.dependency_type === 'span_between_phases')
      .forEach(dep => {
        const endPhaseId = (dep as any).end_phase_id;
        if (!endPhaseId) {
          errors.push(`Span dependency missing end phase: ${dep.id}`);
        }
        if (dep.source_phase_id === endPhaseId) {
          errors.push(`Span dependency source and end cannot be the same phase: ${dep.id}`);
        }
        if (dep.target_phase_id === dep.source_phase_id || dep.target_phase_id === endPhaseId) {
          errors.push(`Span dependency target cannot be source or end phase: ${dep.id}`);
        }
      });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}