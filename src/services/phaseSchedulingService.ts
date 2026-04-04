import { supabase } from "@/integrations/supabase/client";
import { PhaseDependencyService } from "./phaseDependencyService";

export interface PhaseWithScheduling {
  id: string;
  name: string;
  description?: string;
  position: number;
  company_id: string;
  category_id?: string;
  sub_section_id?: string | null;
  compliance_section_ids?: string[];
  is_active: boolean;
  duration_days?: number | null;
  start_date?: string | null;
  // Calculated fields
  calculated_start_day: number;
  calculated_end_day: number;
  is_calculated: boolean;
}

/**
 * Single Source of Truth for Phase Scheduling
 * Uses ONLY the dependency-based system for all calculations
 */
export class PhaseSchedulingService {

  /**
   * Get phases with calculated start days for a company
   * This is the ONLY method that should be used to get phase timing data
   */
  static async getPhasesWithScheduling(companyId: string): Promise<PhaseWithScheduling[]> {

    try {


      // Get ACTIVE phases via company_chosen_phases (the phases the company actually chose)
      const { data: chosenPhases, error } = await supabase
        .from('company_chosen_phases')
        .select(`
          position,
          company_phases!inner(
            id,
            name,
            description,
            position,
            company_id,
            category_id,
            sub_section_id,
            compliance_section_ids,
            is_active,
            duration_days,
            start_date,
            is_continuous_process,
            typical_start_day
          )
        `)
        .eq('company_id', companyId)
        .order('position');

      if (error) {
        console.error('[PhaseSchedulingService] Error fetching chosen phases:', error);
        throw error;
      }

      // Convert to phases array
      const phases = (chosenPhases || []).map(cp => {
        const companyPhase = cp.company_phases as any; // Type cast to handle typical_start_day not in generated types
        return {
          id: companyPhase.id,
          name: companyPhase.name,
          description: companyPhase.description,
          position: cp.position, // Use the chosen position, not the original position
          company_id: companyPhase.company_id,
          category_id: companyPhase.category_id,
          sub_section_id: companyPhase.sub_section_id || null,
          compliance_section_ids: companyPhase.compliance_section_ids || [],
          is_active: companyPhase.is_active,
          duration_days: companyPhase.duration_days,
          start_date: companyPhase.start_date,
          is_continuous_process: companyPhase.is_continuous_process || false,
          typical_start_day: companyPhase.typical_start_day
        };
      });



      if (!phases || phases.length === 0) {

        return [];
      }


      // Get dependencies for the company to check which phases actually have incoming dependencies
      const dependenciesResult = await PhaseDependencyService.getDependencies(companyId);

      // Build a simple dependency-based calculation instead of relying on buggy RPC
      const phaseSchedule = new Map<string, { startDay: number; endDay: number }>();

      // If no dependencies exist, use typical_start_day for all phases
      if (!dependenciesResult.success || !dependenciesResult.dependencies || dependenciesResult.dependencies.length === 0) {

        phases.forEach(phase => {
          const startDay = phase.typical_start_day ?? 0;
          const endDay = startDay + (phase.duration_days || 30);
          phaseSchedule.set(phase.id, { startDay, endDay });
        });
      } else if (dependenciesResult.success) {
        const dependencies = dependenciesResult.dependencies;
        const phasesWithIncomingDeps = new Set(dependencies.map(dep => dep.target_phase_id));

        // Create a map of dependencies for easier lookup
        const dependencyMap = new Map<string, string>(); // target -> source
        dependencies.forEach(dep => {
          if (dep.dependency_type === 'finish_to_start') {
            dependencyMap.set(dep.target_phase_id, dep.source_phase_id);
          }
        });

        // Calculate start days based on simple dependency chain
        const calculatePhaseStartDay = (phaseId: string, visited = new Set<string>()): number => {
          if (visited.has(phaseId)) return 0; // Circular dependency protection
          visited.add(phaseId);

          const sourcePhaseId = dependencyMap.get(phaseId);
          if (!sourcePhaseId) {
            // No dependencies - use typical_start_day if available, otherwise default to 0
            const phase = phases.find(p => p.id === phaseId);
            return phase?.typical_start_day ?? 0;
          }

          // Find the source phase
          const sourcePhase = phases.find(p => p.id === sourcePhaseId);
          if (!sourcePhase) {
            // Source phase not found - use typical_start_day if available
            const phase = phases.find(p => p.id === phaseId);
            return phase?.typical_start_day ?? 0;
          }

          // Calculate when source phase ends
          const sourceStartDay = calculatePhaseStartDay(sourcePhaseId, visited);
          const sourceDuration = sourcePhase.duration_days || 30;
          return sourceStartDay + sourceDuration;
        };

        // First pass: Calculate basic schedules for all phases
        phases.forEach(phase => {
          // For concurrent phases (is_continuous_process = true), use typical_start_day directly
          if (phase.is_continuous_process && phase.typical_start_day !== null && phase.typical_start_day !== undefined) {
            const startDay = phase.typical_start_day;
            const endDay = startDay + (phase.duration_days || 30);
            phaseSchedule.set(phase.id, { startDay, endDay });
          } else {
            // For linear phases, calculate based on dependencies
            const startDay = calculatePhaseStartDay(phase.id);
            const endDay = startDay + (phase.duration_days || 30);
            phaseSchedule.set(phase.id, { startDay, endDay });
          }
        });

        // Second pass: Find max end day for continuous phases
        let maxProjectEndDay = 0;
        phases.forEach(phase => {
          const schedule = phaseSchedule.get(phase.id);
          if (schedule) {
            maxProjectEndDay = Math.max(maxProjectEndDay, schedule.endDay);
          }
        });

        // Third pass: Update only Risk Management to span entire project
        phases.forEach(phase => {
          // Only Risk Management should span the full project timeline
          if (phase.name?.toLowerCase().includes('risk management')) {

            phaseSchedule.set(phase.id, { startDay: 0, endDay: maxProjectEndDay });
          }
          // Technical Documentation and Supplier Management keep their normal durations
        });
      }

      const phasesWithScheduling: PhaseWithScheduling[] = phases.map(phase => {
        // Use our calculated schedule
        const schedule = phaseSchedule.get(phase.id);
        let calculated_start_day = 0;
        let calculated_end_day = phase.duration_days || 30;
        let is_calculated = false;

        if (schedule) {
          calculated_start_day = schedule.startDay;
          calculated_end_day = schedule.endDay;
          is_calculated = true;
        } else {
          // No schedule calculated - use typical_start_day if available (for concurrent phases or phases without dependencies)
          if (phase.typical_start_day !== null && phase.typical_start_day !== undefined) {
            calculated_start_day = phase.typical_start_day;
            calculated_end_day = calculated_start_day + (phase.duration_days || 30);
            is_calculated = true;
          } else {
          }
        }

        return {
          id: phase.id,
          name: phase.name,
          description: phase.description,
          position: phase.position,
          company_id: phase.company_id,
          category_id: phase.category_id,
          sub_section_id: phase.sub_section_id,
          compliance_section_ids: phase.compliance_section_ids || [],
          is_active: phase.is_active,
          duration_days: phase.duration_days,
          start_date: phase.start_date,
          calculated_start_day,
          calculated_end_day,
          is_calculated
        };
      });

      // PROPER topological sort based on actual dependencies
      const dependencies = dependenciesResult.success ? dependenciesResult.dependencies : [];

      // Build adjacency list for dependencies
      const dependsOn = new Map<string, string[]>(); // target -> [sources]
      const dependents = new Map<string, string[]>(); // source -> [targets]

      dependencies.forEach(dep => {
        if (dep.dependency_type === 'finish_to_start') {
          // target depends on source finishing
          if (!dependsOn.has(dep.target_phase_id)) {
            dependsOn.set(dep.target_phase_id, []);
          }
          dependsOn.get(dep.target_phase_id)!.push(dep.source_phase_id);

          if (!dependents.has(dep.source_phase_id)) {
            dependents.set(dep.source_phase_id, []);
          }
          dependents.get(dep.source_phase_id)!.push(dep.target_phase_id);
        }
      });

      // Topological sort using Kahn's algorithm
      const sorted: PhaseWithScheduling[] = [];
      const queue: PhaseWithScheduling[] = [];
      const inDegree = new Map<string, number>();

      // Initialize in-degree count
      phasesWithScheduling.forEach(phase => {
        inDegree.set(phase.id, dependsOn.get(phase.id)?.length || 0);
        if (inDegree.get(phase.id) === 0) {
          queue.push(phase);
        }
      });

      // Process queue
      while (queue.length > 0) {
        const current = queue.shift()!;
        sorted.push(current);

        // Reduce in-degree for dependent phases
        const deps = dependents.get(current.id) || [];
        deps.forEach(depId => {
          const currentInDegree = inDegree.get(depId) || 0;
          inDegree.set(depId, currentInDegree - 1);

          if (inDegree.get(depId) === 0) {
            const depPhase = phasesWithScheduling.find(p => p.id === depId);
            if (depPhase) {
              queue.push(depPhase);
            }
          }
        });
      }

      // Sort phases without dependencies by original position
      const remaining = phasesWithScheduling.filter(p => !sorted.find(s => s.id === p.id));
      remaining.sort((a, b) => a.position - b.position);

      // Combine: dependency-ordered phases first, then remaining phases
      const finalSorted = [...sorted, ...remaining];

      return finalSorted;

    } catch (error) {
      console.error('[PhaseSchedulingService] Error getting phases with scheduling:', error);
      throw error;
    }
  }

  /**
   * Get calculated start day for a specific phase
   * Used by components that need just the start day
   */
  static async getPhaseStartDay(companyId: string, phaseId: string): Promise<number> {
    try {
      const phases = await this.getPhasesWithScheduling(companyId);
      const phase = phases.find(p => p.id === phaseId);
      return phase ? phase.calculated_start_day : 0;
    } catch (error) {
      console.error('[PhaseSchedulingService] Error getting phase start day:', error);
      return 0;
    }
  }

  /**
   * Recalculate all phase schedules for a company
   * Should be called when dependencies or durations change
   */
  static async recalculateCompanySchedule(companyId: string): Promise<boolean> {
    try {

      const result = await PhaseDependencyService.applySchedule(companyId);

      if (result.success) {
      } else {
        console.error('[PhaseSchedulingService] Schedule recalculation failed:', result.error);
      }

      return result.success;
    } catch (error) {
      console.error('[PhaseSchedulingService] Error recalculating schedule:', error);
      return false;
    }
  }
}