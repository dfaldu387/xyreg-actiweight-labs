import { addDays, subDays, differenceInDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { PhaseDependency } from '@/services/phaseDependencyService';

export interface EnhancedPhase {
  id: string;
  name: string;
  phase_id?: string;
  startDate?: Date;
  endDate?: Date;
  duration_days?: number;
  position: number;
  is_continuous_process?: boolean;
  start_percentage?: number;
  end_percentage?: number;
  typical_start_day?: number | null;
}

export interface RecalculationResult {
  success: boolean;
  updatedPhases: EnhancedPhase[];
  errors: string[];
  warnings: string[];
  calculatedProjectStart?: Date;
  calculatedProjectEnd?: Date;
}

export interface RecalculationOptions {
  mode: 'company-settings' | 'preserve-manual';
  timelineMode: 'forward' | 'backward';
  projectStartDate?: Date;
  projectedLaunchDate?: Date;
  enforceConstraints: boolean;
}

/**
 * Enhanced Recalculation Service
 * Handles all dependency types (FF, FS, SS, SF) with proper constraint validation
 */
export class EnhancedRecalculationService {
  
  /**
   * Main recalculation method that handles both company-settings and preserve-manual modes
   */
  static async recalculateTimeline(
    productId: string,
    companyId: string,
    options: RecalculationOptions,
    dependencies: PhaseDependency[] = []
  ): Promise<RecalculationResult> {
    
    try {
      // 1. Get current phases with company phase data
      const { data: currentPhases, error: phasesError } = await supabase
        .from('lifecycle_phases')
        .select(`
          id,
          phase_id,
          name,
          start_date,
          end_date,
          position,
          company_phases!inner(
            duration_days,
            is_continuous_process,
            start_percentage,
            end_percentage,
            typical_start_day
          )
        `)
        .eq('product_id', productId)
        .order('position');

      if (phasesError) {
        return {
          success: false,
          updatedPhases: [],
          errors: [`Failed to fetch phases: ${phasesError.message}`],
          warnings: []
        };
      }

      if (!currentPhases || currentPhases.length === 0) {
        return {
          success: false,
          updatedPhases: [],
          errors: ['No phases found for this product'],
          warnings: []
        };
      }

      // 2. Prepare phases based on mode
      const preparedPhases = options.mode === 'company-settings'
        ? this.preparePhasesWithCompanySettings(currentPhases)
        : this.preparePhasesWithPreservedDurations(currentPhases);

      preparedPhases.forEach(phase => {
        // console.log(`[EnhancedRecalculationService] Phase ${phase.name}: duration=${phase.duration_days} days, position=${phase.position}`);
      });

      // 3. Calculate timeline with dependencies
      const calculatedPhases = this.calculateTimelineWithDependencies(
        preparedPhases,
        dependencies,
        options
      );

      // 4. Validate constraints and auto-adjust if needed
      const validation = this.validateConstraints(calculatedPhases, options);
      if (!validation.valid) {
        return {
          success: false,
          updatedPhases: [],
          errors: validation.errors,
          warnings: validation.warnings
        };
      }

      // Use adjusted phases if timeline was compressed
      const finalPhases = validation.adjustedPhases || calculatedPhases;

      finalPhases.forEach((phase, index) => {
        // console.log(`[EnhancedRecalculationService] Final phase ${index}: ${phase.name} (${phase.id}): ${phase.startDate?.toISOString().split('T')[0]} to ${phase.endDate?.toISOString().split('T')[0]}`);
      });
      
      // Check for duplicate phases and remove them
      const phaseIds = finalPhases.map(p => p.id);
      const uniqueIds = new Set(phaseIds);
      if (phaseIds.length !== uniqueIds.size) {
        const duplicates = phaseIds.filter((id, index) => phaseIds.indexOf(id) !== index);
        
        // Remove duplicates - keep the phase with the most recent dates (latest end date)
        const uniquePhases = finalPhases.reduce((acc, phase) => {
          const existingIndex = acc.findIndex(p => p.id === phase.id);
          if (existingIndex === -1) {
            // First occurrence of this phase
            acc.push(phase);
          } else {
            // Phase already exists, keep the one with later end date (most recent calculation)
            const existingPhase = acc[existingIndex];
            if (phase.endDate && existingPhase.endDate && phase.endDate > existingPhase.endDate) {
            //   console.log(`[ss-dependencies-issues] Replacing ${phase.name} with more recent dates: ${existingPhase.endDate.toISOString().split('T')[0]} → ${phase.endDate.toISOString().split('T')[0]}`);
              acc[existingIndex] = phase;
            } else {
            //   console.log(`[ss-dependencies-issues] Keeping existing ${phase.name} with dates: ${existingPhase.endDate?.toISOString().split('T')[0]} (newer: ${phase.endDate?.toISOString().split('T')[0]})`);
            }
          }
          return acc;
        }, [] as EnhancedPhase[]);
        
        uniquePhases.forEach((phase, index) => {
        //   console.log(`[ss-dependencies-issues] Unique phase ${index}: ${phase.name} (${phase.id}): ${phase.startDate?.toISOString().split('T')[0]} to ${phase.endDate?.toISOString().split('T')[0]}`);
        });
        
        finalPhases.length = 0; // Clear the array
        finalPhases.push(...uniquePhases); // Add unique phases
      }

      // 5. Apply calculated dates to database
      const updateResult = await this.applyCalculatedDates(productId, finalPhases);
      
      return {
        success: updateResult.success,
        updatedPhases: finalPhases,
        errors: updateResult.errors,
        warnings: [...validation.warnings, ...updateResult.warnings],
        calculatedProjectStart: this.getProjectStartDate(finalPhases),
        calculatedProjectEnd: this.getProjectEndDate(finalPhases)
      };

    } catch (error) {
    //   console.error('[EnhancedRecalculationService] Unexpected error:', error);
      return {
        success: false,
        updatedPhases: [],
        errors: [`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      };
    }
  }

  /**
   * Prepare phases using company settings (reset durations)
   */
  private static preparePhasesWithCompanySettings(currentPhases: any[]): EnhancedPhase[] {
    return currentPhases.map(phase => ({
      id: phase.id,
      name: phase.name,
      phase_id: phase.phase_id,
      startDate: phase.start_date ? new Date(phase.start_date) : undefined,
      endDate: phase.end_date ? new Date(phase.end_date) : undefined,
      duration_days: phase.company_phases?.duration_days || 30,
      position: phase.position || 0,
      is_continuous_process: phase.company_phases?.is_continuous_process || false,
      start_percentage: phase.company_phases?.start_percentage,
      end_percentage: phase.company_phases?.end_percentage,
      typical_start_day: phase.company_phases?.typical_start_day
    }));
  }

  /**
   * Prepare phases preserving current durations
   */
  private static preparePhasesWithPreservedDurations(currentPhases: any[]): EnhancedPhase[] {
    return currentPhases.map(phase => {
      let currentDuration = 30; // Default fallback

      // Calculate duration from actual start and end dates if available
      if (phase.start_date && phase.end_date) {
        const startDate = new Date(phase.start_date);
        const endDate = new Date(phase.end_date);
        currentDuration = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      } else {
        // Fallback to company phase duration if no dates available
        currentDuration = phase.company_phases?.duration_days || 30;
      }

      return {
        id: phase.id,
        name: phase.name,
        phase_id: phase.phase_id,
        startDate: phase.start_date ? new Date(phase.start_date) : undefined,
        endDate: phase.end_date ? new Date(phase.end_date) : undefined,
        duration_days: currentDuration,
        position: phase.position || 0,
        is_continuous_process: phase.company_phases?.is_continuous_process || false,
        start_percentage: phase.company_phases?.start_percentage,
        end_percentage: phase.company_phases?.end_percentage,
        typical_start_day: phase.company_phases?.typical_start_day
      };
    });
  }

  /**
   * Calculate timeline with all dependency types (FF, FS, SS, SF)
   */
  private static calculateTimelineWithDependencies(
    phases: EnhancedPhase[],
    dependencies: PhaseDependency[],
    options: RecalculationOptions
  ): EnhancedPhase[] {

    // Build dependency maps
    const incomingDeps = new Map<string, PhaseDependency[]>();
    const outgoingDeps = new Map<string, PhaseDependency[]>();

    phases.forEach(phase => {
      incomingDeps.set(phase.id, []);
      outgoingDeps.set(phase.id, []);
    });

    dependencies.forEach(dep => {
      if (incomingDeps.has(dep.target_phase_id)) {
        incomingDeps.get(dep.target_phase_id)!.push(dep);
      }
      if (outgoingDeps.has(dep.source_phase_id)) {
        outgoingDeps.get(dep.source_phase_id)!.push(dep);
      }
    });

    // Sort phases by position
    const sortedPhases = [...phases].sort((a, b) => a.position - b.position);
    const phaseResults = new Map<string, { startDate: Date; endDate: Date }>();
    const calculatedPhases: EnhancedPhase[] = [];

    // Process phases in dependency order with SS grouping
    const processedPhases = new Set<string>();

    // FIRST: Process Day 0 phases (typical_start_day === 0) - these always start at project start date
    const projectStartDate = options.projectStartDate || new Date();
    const day0Phases = sortedPhases.filter(phase => phase.typical_start_day === 0);

    for (const phase of day0Phases) {
      if (processedPhases.has(phase.id)) continue;

      // Day 0 phases always start at project start date
      const startDate = projectStartDate;
      const endDate = addDays(startDate, phase.duration_days || 30);

      phaseResults.set(phase.id, { startDate, endDate });

      calculatedPhases.push({
        ...phase,
        startDate,
        endDate
      });

      processedPhases.add(phase.id);
    }

    // SECOND: Process remaining phases based on dependencies and position
    for (const phase of sortedPhases) {
      if (processedPhases.has(phase.id)) continue;

      const deps = incomingDeps.get(phase.id) || [];

      // Check for SS dependencies - process both phases together
      const ssDependencies = deps.filter(dep => dep.dependency_type === 'start_to_start');

      if (ssDependencies.length > 0) {
        // Process SS group together
        const ssGroup = [phase];
        ssDependencies.forEach(dep => {
          const targetPhase = sortedPhases.find(p => p.id === dep.target_phase_id);
          if (targetPhase && !processedPhases.has(targetPhase.id)) {
            ssGroup.push(targetPhase);
          }
        });

        // Calculate start date for the entire SS group
        const groupStartDate = this.calculateStartDate(phase, deps.filter(dep => dep.dependency_type !== 'start_to_start'), phaseResults, options);

        // Apply same start date to all phases in SS group
        ssGroup.forEach(groupPhase => {
          const endDate = addDays(groupStartDate, groupPhase.duration_days || 30);

          phaseResults.set(groupPhase.id, { startDate: groupStartDate, endDate });

          calculatedPhases.push({
            ...groupPhase,
            startDate: groupStartDate,
            endDate
          });

          processedPhases.add(groupPhase.id);

        });
      } else {
        // Process individual phase
        const startDate = this.calculateStartDate(phase, deps, phaseResults, options);
        const endDate = addDays(startDate, phase.duration_days || 30);

        phaseResults.set(phase.id, { startDate, endDate });

        calculatedPhases.push({
          ...phase,
          startDate,
          endDate
        });

        processedPhases.add(phase.id);

      }
    }

    // Apply FF and SF constraints (end date dependencies)
    this.applyEndDateConstraints(calculatedPhases, dependencies, phaseResults);

    // Re-evaluate SS dependencies after FF constraints may have changed dates
    this.reevaluateSSDependencies(calculatedPhases, dependencies, phaseResults);

    // Re-evaluate FF dependencies after SS re-evaluation may have changed source dates
    this.reevaluateFFDependencies(calculatedPhases, dependencies, phaseResults);

    // Re-evaluate FS dependencies after FF/SF re-evaluation may have changed source dates
    this.reevaluateFSDependencies(calculatedPhases, dependencies, phaseResults);

    // Re-evaluate SF dependencies after all other re-evaluations may have changed source dates
    this.reevaluateSFDependencies(calculatedPhases, dependencies, phaseResults);

    // Log gaps between phases for debugging
    this.logPhaseGaps(calculatedPhases);

    return calculatedPhases;
  }

  /**
   * Calculate start date for a phase based on its dependencies
   */
  private static calculateStartDate(
    phase: EnhancedPhase,
    dependencies: PhaseDependency[],
    phaseResults: Map<string, { startDate: Date; endDate: Date }>,
    options: RecalculationOptions
  ): Date {
    // If phase has no dependencies, preserve its existing start date
    if (dependencies.length === 0) {
      if (phase.startDate) {
        return phase.startDate;
      }
      // Only use project start date if phase has no dependencies AND no existing start date
      return options.projectStartDate || new Date();
    }

    // Phase has dependencies - calculate based on dependencies
    let earliestStart = phase.startDate || options.projectStartDate || new Date();

    for (const dep of dependencies) {
      const sourceResult = phaseResults.get(dep.source_phase_id);
      if (!sourceResult) continue;

      let requiredDate: Date;

      switch (dep.dependency_type) {
        case 'finish_to_start':
          // Target starts immediately after source finishes (no lag)
          requiredDate = addDays(sourceResult.endDate, 1);
          break;
          
        case 'start_to_start':
          // Target starts when source starts (no lag)
          requiredDate = sourceResult.startDate;
          break;
          
        case 'finish_to_finish':
        case 'start_to_finish':
          // These will be handled in end date constraints
          continue;
          
        case 'span_between_phases':
          // Span dependencies are not supported in this calculation
          continue;
          
        default:
          continue;
      }

      if (requiredDate > earliestStart) {
        earliestStart = requiredDate;
      }
    }

    return earliestStart;
  }

  /**
   * Log gaps between phases for debugging
   */
  private static logPhaseGaps(phases: EnhancedPhase[]): void {
    
    const sortedPhases = [...phases].sort((a, b) => a.position - b.position);
    
    for (let i = 0; i < sortedPhases.length - 1; i++) {
      const currentPhase = sortedPhases[i];
      const nextPhase = sortedPhases[i + 1];
      
      if (currentPhase.endDate && nextPhase.startDate) {
        const gapDays = Math.ceil((nextPhase.startDate.getTime() - currentPhase.endDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (gapDays > 1) {
        //   console.log(`  Unexpected gap: ${currentPhase.name} → ${nextPhase.name}: ${gapDays} days (should be 0-1 days without lag)`);
        } else if (gapDays === 1) {
        //   console.log(`  Normal gap: ${currentPhase.name} → ${nextPhase.name}: ${gapDays} day (FS dependency)`);
        } else if (gapDays === 0) {
        //   console.log(`  No gap: ${currentPhase.name} → ${nextPhase.name}: same day (SS/FF dependency)`);
        } else {
        //   console.log(`   Overlap: ${currentPhase.name} → ${nextPhase.name}: ${Math.abs(gapDays)} days`);
        }
      }
    }
  }

  /**
   * Re-evaluate SS dependencies after FF constraints may have changed dates
   */
  private static reevaluateSSDependencies(
    phases: EnhancedPhase[],
    dependencies: PhaseDependency[],
    phaseResults: Map<string, { startDate: Date; endDate: Date }>
  ): void {
    
    // Find all SS dependencies
    const ssDependencies = dependencies.filter(dep => dep.dependency_type === 'start_to_start');
    
    if (ssDependencies.length === 0) {
      return;
    }
    
    
    // Process each SS dependency
    for (const dep of ssDependencies) {
      const sourceResult = phaseResults.get(dep.source_phase_id);
      const targetPhase = phases.find(p => p.id === dep.target_phase_id);
      
      if (!sourceResult || !targetPhase) {
        continue;
      }
      
      // Check if target phase needs to be updated to match source start date
      if (targetPhase.startDate && sourceResult.startDate.getTime() !== targetPhase.startDate.getTime()) {
        
        // Update target phase to start on same date as source
        const newEndDate = addDays(sourceResult.startDate, targetPhase.duration_days || 30);
        
        // CRITICAL FIX: Update the actual phase object in the phases array
        targetPhase.startDate = sourceResult.startDate;
        targetPhase.endDate = newEndDate;
        
        // Update phase results
        phaseResults.set(targetPhase.id, { startDate: sourceResult.startDate, endDate: newEndDate });
        
        // Verify the phase was actually updated in the calculatedPhases array
        const phaseInArray = phases.find(p => p.id === targetPhase.id);
        if (phaseInArray) {
        //   console.log(`[ss-dependencies-issues] Phase in array after update: ${phaseInArray.name} - startDate: ${phaseInArray.startDate?.toISOString().split('T')[0]}, endDate: ${phaseInArray.endDate?.toISOString().split('T')[0]}`);
        }
      } else {
        // console.log(`[ss-dependencies-issues] SS dependency: ${targetPhase.name} already starts on same date as source (${sourceResult.startDate.toISOString().split('T')[0]})`);
      }
    }
  }

  /**
   * Re-evaluate FF dependencies after SS re-evaluation might have changed source dates
   */
  private static reevaluateFFDependencies(
    phases: EnhancedPhase[],
    dependencies: PhaseDependency[],
    phaseResults: Map<string, { startDate: Date; endDate: Date }>
  ): void {
    
    // Find all FF dependencies
    const ffDependencies = dependencies.filter(dep => dep.dependency_type === 'finish_to_finish');
    
    if (ffDependencies.length === 0) {
      return;
    }
    
    // Process each FF dependency
    for (const dep of ffDependencies) {
      const sourceResult = phaseResults.get(dep.source_phase_id);
      const targetPhase = phases.find(p => p.id === dep.target_phase_id);
      
      if (!sourceResult || !targetPhase) {
        continue;
      }
      
      // Check if target phase needs to be updated to match source end date
      if (targetPhase.endDate && sourceResult.endDate.getTime() !== targetPhase.endDate.getTime()) {
        // console.log(`[ss-dependencies-issues] FF dependency: ${dep.source_phase_id} ends ${sourceResult.endDate.toISOString().split('T')[0]}, updating ${targetPhase.name} from ${targetPhase.endDate?.toISOString().split('T')[0]} to ${sourceResult.endDate.toISOString().split('T')[0]}`);
        
        // Update target phase to end on same date as source
        const duration = differenceInDays(targetPhase.endDate, targetPhase.startDate!);
        const newStartDate = subDays(sourceResult.endDate, duration);
        
        // CRITICAL FIX: Update the actual phase object in the phases array
        targetPhase.startDate = newStartDate;
        targetPhase.endDate = sourceResult.endDate;
        
        // Update phase results
        phaseResults.set(targetPhase.id, { startDate: newStartDate, endDate: sourceResult.endDate });
          
        // Verify the phase was actually updated in the calculatedPhases array
        const phaseInArray = phases.find(p => p.id === targetPhase.id);
        if (phaseInArray) {
        //   console.log(`[ss-dependencies-issues] Phase in array after update: ${phaseInArray.name} - startDate: ${phaseInArray.startDate?.toISOString().split('T')[0]}, endDate: ${phaseInArray.endDate?.toISOString().split('T')[0]}`);
        }
      } else {
        // console.log(`[ss-dependencies-issues] FF dependency: ${targetPhase.name} already ends on same date as source (${sourceResult.endDate.toISOString().split('T')[0]})`);
      }
    }
  }

  /**
   * Re-evaluate FS dependencies after FF/SF re-evaluation might have changed source dates
   */
  private static reevaluateFSDependencies(
    phases: EnhancedPhase[],
    dependencies: PhaseDependency[],
    phaseResults: Map<string, { startDate: Date; endDate: Date }>
  ): void {
    
    // Find all FS dependencies
    const fsDependencies = dependencies.filter(dep => dep.dependency_type === 'finish_to_start');
    
    if (fsDependencies.length === 0) {
      return;
    }
    
    // Process each FS dependency
    for (const dep of fsDependencies) {
      const sourceResult = phaseResults.get(dep.source_phase_id);
      const targetPhase = phases.find(p => p.id === dep.target_phase_id);
      
      if (!sourceResult || !targetPhase) {
        continue;
      }
      
      // Check if target phase needs to be updated to start after source ends
      const requiredStartDate = addDays(sourceResult.endDate, 1); // 1-day gap for FS
      
      if (targetPhase.startDate && requiredStartDate.getTime() !== targetPhase.startDate.getTime()) {
        
        // Update target phase to start after source ends
        const duration = differenceInDays(targetPhase.endDate!, targetPhase.startDate!);
        const newEndDate = addDays(requiredStartDate, duration);
        
        // CRITICAL FIX: Update the actual phase object in the phases array
        targetPhase.startDate = requiredStartDate;
        targetPhase.endDate = newEndDate;
        
        // Update phase results
        phaseResults.set(targetPhase.id, { startDate: requiredStartDate, endDate: newEndDate });
        
        // Verify the phase was actually updated in the calculatedPhases array
        const phaseInArray = phases.find(p => p.id === targetPhase.id);
        if (phaseInArray) {
        //   console.log(`[ss-dependencies-issues] Phase in array after update: ${phaseInArray.name} - startDate: ${phaseInArray.startDate?.toISOString().split('T')[0]}, endDate: ${phaseInArray.endDate?.toISOString().split('T')[0]}`);
        }
      } else {
        // console.log(`[ss-dependencies-issues] FS dependency: ${targetPhase.name} already starts correctly after source (${sourceResult.endDate.toISOString().split('T')[0]})`);
      }
    }
  }

  /**
   * Re-evaluate SF dependencies after all other re-evaluations might have changed source dates
   */
  private static reevaluateSFDependencies(
    phases: EnhancedPhase[],
    dependencies: PhaseDependency[],
    phaseResults: Map<string, { startDate: Date; endDate: Date }>
  ): void {
    
    // Find all SF dependencies
    const sfDependencies = dependencies.filter(dep => dep.dependency_type === 'start_to_finish');
    
    if (sfDependencies.length === 0) {
      return;
    }
    
    // Process each SF dependency
    for (const dep of sfDependencies) {
      const sourceResult = phaseResults.get(dep.source_phase_id);
      const targetPhase = phases.find(p => p.id === dep.target_phase_id);
      
      if (!sourceResult || !targetPhase) {
        continue;
      }
      
      // Check if target phase needs to be updated to finish 1 day before source starts
      const requiredEndDate = subDays(sourceResult.startDate, 1); // Target finishes 1 day before source starts (1-day gap)
      
      if (targetPhase.endDate && requiredEndDate.getTime() !== targetPhase.endDate.getTime()) {
        
        // Update target phase to finish 1 day before source starts
        const duration = differenceInDays(targetPhase.endDate, targetPhase.startDate!);
        const newStartDate = subDays(requiredEndDate, duration);
        
        // CRITICAL FIX: Update the actual phase object in the phases array
        targetPhase.startDate = newStartDate;
        targetPhase.endDate = requiredEndDate;
        
        // Update phase results
        phaseResults.set(targetPhase.id, { startDate: newStartDate, endDate: requiredEndDate });
            
        // Verify the phase was actually updated in the calculatedPhases array
        const phaseInArray = phases.find(p => p.id === targetPhase.id);
        if (phaseInArray) {
        //   console.log(`[ss-dependencies-issues] Phase in array after update: ${phaseInArray.name} - startDate: ${phaseInArray.startDate?.toISOString().split('T')[0]}, endDate: ${phaseInArray.endDate?.toISOString().split('T')[0]}`);
        }
      } else {
        // console.log(`[ss-dependencies-issues] SF dependency: ${targetPhase.name} already finishes correctly 1 day before source starts (${sourceResult.startDate.toISOString().split('T')[0]})`);
      }
    }
  }

  /**
   * Apply FF and SF constraints (end date dependencies)
   */
  private static applyEndDateConstraints(
    phases: EnhancedPhase[],
    dependencies: PhaseDependency[],
    phaseResults: Map<string, { startDate: Date; endDate: Date }>
  ): void {

    for (const dep of dependencies) {
      if (dep.dependency_type !== 'finish_to_finish' && dep.dependency_type !== 'start_to_finish') {
        continue;
      }

      const sourceResult = phaseResults.get(dep.source_phase_id);
      const targetPhase = phases.find(p => p.id === dep.target_phase_id);
      
      if (!sourceResult || !targetPhase) {
        continue;
      }

      let requiredEndDate: Date;
      
      if (dep.dependency_type === 'finish_to_finish') {
        // FF: Both phases finish on the same date (no lag)
        requiredEndDate = sourceResult.endDate;
      } else {
        // SF: Target finishes 1 day before source starts (1-day gap)
        requiredEndDate = subDays(sourceResult.startDate, 1);
      }

      // Check if we need to adjust the target phase
      const currentEndDate = targetPhase.endDate!;
      if (requiredEndDate > currentEndDate) {
        // Adjust start date to maintain duration
        const duration = differenceInDays(currentEndDate, targetPhase.startDate!);
        const newStartDate = subDays(requiredEndDate, duration);
          
        // Update the phase
        targetPhase.startDate = newStartDate;
        targetPhase.endDate = requiredEndDate;
        
        // Update phase results
        phaseResults.set(targetPhase.id, { startDate: newStartDate, endDate: requiredEndDate });
        
        // console.log(`[ss-dependencies-issues] Applied ${dep.dependency_type} constraint to ${targetPhase.name}: ${newStartDate.toISOString().split('T')[0]} to ${requiredEndDate.toISOString().split('T')[0]} (${dep.dependency_type === 'finish_to_finish' ? 'no lag' : '1-day gap'})`);
      } else {
        // console.log(`[ss-dependencies-issues] No adjustment needed for ${targetPhase.name}: required end date ${requiredEndDate.toISOString().split('T')[0]} <= current end date ${currentEndDate.toISOString().split('T')[0]}`);
      }
    }
  }

  /**
   * Validate project constraints and auto-adjust if needed
   */
  private static validateConstraints(
    phases: EnhancedPhase[],
    options: RecalculationOptions
  ): { valid: boolean; errors: string[]; warnings: string[]; adjustedPhases?: EnhancedPhase[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!options.enforceConstraints) {
      return { valid: true, errors, warnings };
    }

    const projectStart = options.projectStartDate;
    const projectEnd = options.projectedLaunchDate;

    // Calculate actual project timeline
    const actualProjectStart = this.getProjectStartDate(phases);
    const actualProjectEnd = this.getProjectEndDate(phases);

    if (!actualProjectStart || !actualProjectEnd) {
      return { valid: true, errors, warnings };
    }

    const actualDuration = Math.ceil((actualProjectEnd.getTime() - actualProjectStart.getTime()) / (1000 * 60 * 60 * 24));
    const projectedDuration = projectEnd && projectStart ? Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    // Check if timeline exceeds projected launch date
    if (projectEnd && actualProjectEnd > projectEnd) {
      const excessDays = Math.ceil((actualProjectEnd.getTime() - projectEnd.getTime()) / (1000 * 60 * 60 * 24));
      
      if (excessDays > 7) { // Only warn if more than 7 days over
        warnings.push(`Calculated timeline extends ${excessDays} days beyond projected launch date. Consider adjusting project timeline or launch date.`);
        
        // Auto-adjust: Shift timeline to fit within projected launch date
        if (projectStart && projectEnd) {
          const adjustedPhases = this.compressTimelineToFit(phases, projectStart, projectEnd);
          
          if (adjustedPhases) {
            warnings.push(`Timeline automatically compressed to fit within projected launch date.`);
            return { valid: true, errors, warnings, adjustedPhases };
          }
        }
      } else {
        warnings.push(`Timeline extends ${excessDays} days beyond projected launch date (within acceptable range)`);
      }
    }

    // Check for overlapping phases (warning)
    for (const phase of phases) {
      if (!phase.startDate || !phase.endDate) continue;

      const overlappingPhases = phases.filter(p => 
        p.id !== phase.id && 
        p.startDate && 
        p.endDate &&
        p.startDate < phase.endDate && 
        p.endDate > phase.startDate
      );

      if (overlappingPhases.length > 0) {
        warnings.push(`Phase "${phase.name}" overlaps with other phases`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Compress timeline to fit within projected launch date
   */
  private static compressTimelineToFit(
    phases: EnhancedPhase[],
    projectStart: Date,
    projectEnd: Date
  ): EnhancedPhase[] | null {
    const totalDuration = Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate total required duration
    const totalRequiredDuration = phases.reduce((sum, phase) => sum + (phase.duration_days || 30), 0);
    
    if (totalRequiredDuration > totalDuration) {
    //   console.log(`[EnhancedRecalculationService] Cannot compress timeline: required ${totalRequiredDuration} days, available ${totalDuration} days`);
      return null;
    }

    // Compress timeline by reducing gaps between phases
    const compressedPhases: EnhancedPhase[] = [];
    let currentDate = new Date(projectStart);

    for (const phase of phases) {
      const phaseDuration = phase.duration_days || 30;
      const endDate = addDays(currentDate, phaseDuration - 1);
      
      compressedPhases.push({
        ...phase,
        startDate: new Date(currentDate),
        endDate: new Date(endDate)
      });

      // Move to next phase with minimal gap (1 day)
      currentDate = addDays(endDate, 1);
    }

    return compressedPhases;
  }

  /**
   * Apply calculated dates to database
   */
  private static async applyCalculatedDates(
    productId: string,
    phases: EnhancedPhase[]
  ): Promise<{ success: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      for (const phase of phases) {
        if (!phase.startDate || !phase.endDate) {
          continue;
        }

        const startDateStr = phase.startDate.toISOString().split('T')[0];
        const endDateStr = phase.endDate.toISOString().split('T')[0];
        
        const { error } = await supabase
          .from('lifecycle_phases')
          .update({
            start_date: startDateStr,
            end_date: endDateStr
          })
          .eq('id', phase.id);

        if (error) {
        //   console.error(`[EnhancedRecalculationService] Failed to update phase "${phase.name}":`, error);
          errors.push(`Failed to update phase "${phase.name}": ${error.message}`);
        } else {
        //   console.log(`[ss-dependencies-issues] Successfully updated phase "${phase.name}" (ID: ${phase.id}) in database`);
        }
      }

      return {
        success: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Database update failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings
      };
    }
  }

  /**
   * Get project start date from calculated phases
   */
  private static getProjectStartDate(phases: EnhancedPhase[]): Date | undefined {
    const phasesWithStartDates = phases.filter(p => p.startDate);
    if (phasesWithStartDates.length === 0) return undefined;
    
    return phasesWithStartDates
      .map(p => p.startDate!)
      .sort((a, b) => a.getTime() - b.getTime())[0];
  }

  /**
   * Get project end date from calculated phases
   */
  private static getProjectEndDate(phases: EnhancedPhase[]): Date | undefined {
    const phasesWithEndDates = phases.filter(p => p.endDate);
    if (phasesWithEndDates.length === 0) return undefined;
    
    return phasesWithEndDates
      .map(p => p.endDate!)
      .sort((a, b) => b.getTime() - a.getTime())[0];
  }
}
