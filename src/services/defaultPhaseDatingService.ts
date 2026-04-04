import { supabase } from '@/integrations/supabase/client';
import { TimelineDriftService } from '@/services/timelineDriftService';

export interface PhaseWithDates {
  id: string;
  name: string;
  position: number;
  start_date?: string;
  end_date?: string;
  duration_days?: number;
  is_continuous_process?: boolean;
  is_pre_launch?: boolean;
  start_percentage?: number;
  end_percentage?: number;
  start_phase_id?: string;
  end_phase_id?: string;
  start_position?: 'start' | 'end';
  end_position?: 'start' | 'end';
}

export class DefaultPhaseDatingService {
  /**
   * Calculate sequential phases - linear phases use start day + duration, continuous phases use different logic
   */
  static calculateSequentialPhases(
    phases: PhaseWithDates[], 
    startDate: Date = new Date(),
    projectEndDate?: Date,
    launchDate?: Date
  ): { id: string; start_date: string; end_date: string }[] {
    const sortedPhases = [...phases].sort((a, b) => a.position - b.position);
    const results = [];
    
    const linearPhases = sortedPhases.filter(p => !p.is_continuous_process);
    const continuousPhases = sortedPhases.filter(p => p.is_continuous_process);

    // Calculate linear phases first using start day + duration
    let currentDate = new Date(startDate);
    const linearPhaseResults = [];
    
    for (const phase of linearPhases) {
      const start_date = new Date(currentDate);
      const end_date = new Date(currentDate);
      
      // Use actual duration from company settings, default to 14 days if not specified
      const durationDays = phase.duration_days || 14;
      end_date.setDate(end_date.getDate() + durationDays);

      const phaseResult = {
        id: phase.id,
        start_date: start_date.toISOString().split('T')[0],
        end_date: end_date.toISOString().split('T')[0]
      };
      
      linearPhaseResults.push(phaseResult);
      results.push(phaseResult);

      // console.log(`[DefaultPhaseDatingService] Linear phase ${phase.name}: ${durationDays} days (${start_date.toISOString().split('T')[0]} to ${end_date.toISOString().split('T')[0]})`);

      // Next phase starts the day after this one ends
      currentDate = new Date(end_date);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate continuous phases using the actual linear phase dates
    for (const phase of continuousPhases) {
      let start_date: Date;
      let end_date: Date;
      
      // Check if this is a post-launch phase
      if (phase.is_pre_launch === false && launchDate) {
        // POST-LAUNCH PHASE: Use percentage-based calculation for days after launch
        // Default 1 year (365 days) post-launch timeline
        const postLaunchTimelineDays = 365;
        const startDaysAfterLaunch = Math.round((phase.start_percentage / 100) * postLaunchTimelineDays);
        const endDaysAfterLaunch = Math.round((phase.end_percentage / 100) * postLaunchTimelineDays);
        
        start_date = new Date(launchDate);
        start_date.setDate(start_date.getDate() + startDaysAfterLaunch);
        
        end_date = new Date(launchDate);
        end_date.setDate(end_date.getDate() + endDaysAfterLaunch);
        
        // console.log(`[DefaultPhaseDatingService] Post-launch phase ${phase.name}: Launch + ${startDaysAfterLaunch} to ${endDaysAfterLaunch} days (${phase.start_percentage}% to ${phase.end_percentage}% of ${postLaunchTimelineDays}-day timeline)`);
      } else {
        // PRE-LAUNCH PHASE: Use phase references if available
        if (phase.start_phase_id && phase.end_phase_id) {
          // console.log(`[DefaultPhaseDatingService] Looking for phase references: start=${phase.start_phase_id}, end=${phase.end_phase_id}`);
          // console.log(`[DefaultPhaseDatingService] Available linear phases:`, linearPhaseResults.map(r => ({ id: r.id, name: phases.find(p => p.id === r.id)?.name })));
          
          // Find the referenced phases in the linear phase results
          const startPhaseResult = linearPhaseResults.find(r => r.id === phase.start_phase_id);
          const endPhaseResult = linearPhaseResults.find(r => r.id === phase.end_phase_id);
          
          if (startPhaseResult && endPhaseResult) {
            // Use the specified position (start or end) of the referenced phases
            const startPhaseStartDate = new Date(startPhaseResult.start_date);
            const startPhaseEndDate = new Date(startPhaseResult.end_date);
            const endPhaseStartDate = new Date(endPhaseResult.start_date);
            const endPhaseEndDate = new Date(endPhaseResult.end_date);
            
            start_date = phase.start_position === 'end' ? startPhaseEndDate : startPhaseStartDate;
            end_date = phase.end_position === 'end' ? endPhaseEndDate : endPhaseStartDate;
            
            // console.log(`[DefaultPhaseDatingService] Pre-launch phase ${phase.name}: From ${phase.start_position} of ${startPhaseResult.start_date}-${startPhaseResult.end_date} to ${phase.end_position} of ${endPhaseResult.start_date}-${endPhaseResult.end_date}`);
            // console.log(`[DefaultPhaseDatingService] Result: ${start_date.toISOString().split('T')[0]} to ${end_date.toISOString().split('T')[0]}`);
          } else {
            // Fallback to project timeline if referenced phases not found
            start_date = new Date(startDate);
            end_date = launchDate ? new Date(launchDate) : new Date(currentDate);
            // console.log(`[DefaultPhaseDatingService] Pre-launch phase ${phase.name}: Referenced phases not found, using project timeline`);
          }
        } else {
          // Fallback to project timeline for phases without references
          start_date = new Date(startDate);
          end_date = launchDate ? new Date(launchDate) : new Date(currentDate);
          // console.log(`[DefaultPhaseDatingService] Pre-launch phase ${phase.name}: No phase references, using project timeline`);
        }
      }

      results.push({
        id: phase.id,
        start_date: start_date.toISOString().split('T')[0],
        end_date: end_date.toISOString().split('T')[0]
      });
    }

    return results;
  }

  /**
   * Initialize default timeline for a product's phases using the modern dependency-based system
   */
  static async initializeDefaultTimeline(productId: string): Promise<{ success: boolean; error?: string; updatedCount: number }> {
    try {
      // console.log(`[DefaultPhaseDatingService] Initializing dependency-based timeline for product ${productId}`);

      // Get product and company info
      const { data: product } = await supabase
        .from('products')
        .select('company_id, project_start_date')
        .eq('id', productId)
        .single();

      if (!product) {
        throw new Error('Product not found');
      }

      // Get lifecycle phases for this product (these use placeholder phase IDs)
      const { data: lifecyclePhases } = await supabase
        .from('lifecycle_phases')
        .select(`
          id, 
          phase_id, 
          company_phases!inner(name, duration_days)
        `)
        .eq('product_id', productId)
        .order('phase_id');

      if (!lifecyclePhases || lifecyclePhases.length === 0) {
        return { success: false, error: 'No lifecycle phases found for product', updatedCount: 0 };
      }

      // console.log(`[DefaultPhaseDatingService] Found ${lifecyclePhases.length} lifecycle phases to schedule`);

      // Get dependencies for placeholder phase IDs (fetch where either source or target is in the lifecycle phases)
      const phaseIds = lifecyclePhases.map(lp => lp.phase_id);
      const { data: dependencies } = await supabase
        .from('phase_dependencies')
        .select('*')
        .eq('company_id', product.company_id)
        .or('source_phase_id.in.(' + phaseIds.join(',') + '),target_phase_id.in.(' + phaseIds.join(',') + ')');

      // console.log(`[DefaultPhaseDatingService] Found ${dependencies?.length || 0} dependencies for lifecycle phases`);

      // Create phase maps
      const phaseMap = new Map();
      lifecyclePhases.forEach(lp => {
        phaseMap.set(lp.phase_id, {
          ...lp,
          name: lp.company_phases.name,
          duration_days: lp.company_phases.duration_days || 30
        });
      });

      // Build dependency graph
      const incomingDeps = new Map();
      const outgoingDeps = new Map();
      
      lifecyclePhases.forEach(lp => {
        incomingDeps.set(lp.phase_id, []);
        outgoingDeps.set(lp.phase_id, []);
      });

      (dependencies || []).forEach(dep => {
        if (phaseMap.has(dep.source_phase_id) && phaseMap.has(dep.target_phase_id)) {
          incomingDeps.get(dep.target_phase_id).push(dep);
          outgoingDeps.get(dep.source_phase_id).push(dep);
        }
      });

      // Calculate dates using dependency scheduling
      const phaseSchedule = new Map();
      const projectStartDate = new Date(product.project_start_date || new Date());
      
      // Find root phases (no incoming dependencies)
      const rootPhases = Array.from(phaseMap.keys()).filter(phaseId =>
        (incomingDeps.get(phaseId) || []).length === 0
      );

      // console.log(`[DefaultPhaseDatingService] Root phases (no dependencies):`, rootPhases.map(id => phaseMap.get(id)?.name));

      // Schedule root phases sequentially by position (not all at the same start date)
      let currentRootDate = new Date(projectStartDate);
      rootPhases.forEach(phaseId => {
        const phase = phaseMap.get(phaseId);
        const startDate = new Date(currentRootDate);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + (phase.duration_days || 30));

        phaseSchedule.set(phaseId, {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        });

        // Next root phase starts the day after this one ends
        currentRootDate = new Date(endDate);
        currentRootDate.setDate(currentRootDate.getDate() + 1);

        // console.log(`[DefaultPhaseDatingService] Scheduled root phase ${phase.name}: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
      });

      // Topological sort and schedule remaining phases
      const visited = new Set();
      const tempMark = new Set();
      const sorted = [];

      const visit = (phaseId) => {
        if (tempMark.has(phaseId)) {
          console.warn(`[DefaultPhaseDatingService] Circular dependency detected involving phase ${phaseId}`);
          return;
        }
        if (visited.has(phaseId)) return;

        tempMark.add(phaseId);
        
        // Visit all dependencies first
        (incomingDeps.get(phaseId) || []).forEach(dep => {
          visit(dep.source_phase_id);
        });
        
        tempMark.delete(phaseId);
        visited.add(phaseId);
        sorted.push(phaseId);
      };

      // Visit all phases
      Array.from(phaseMap.keys()).forEach(phaseId => {
        if (!visited.has(phaseId)) {
          visit(phaseId);
        }
      });

      // Schedule non-root phases based on dependencies
      sorted.forEach(phaseId => {
        if (phaseSchedule.has(phaseId)) return; // Already scheduled (root phase)

        const phase = phaseMap.get(phaseId);
        const deps = incomingDeps.get(phaseId) || [];
        
        if (deps.length === 0) return; // No dependencies

        // Calculate start date based on latest dependency
        let latestFinish = new Date(projectStartDate);
        
        deps.forEach(dep => {
          const sourceSchedule = phaseSchedule.get(dep.source_phase_id);
          if (sourceSchedule) {
            const dependencyDate = new Date(dep.dependency_type === 'finish_to_start' || dep.dependency_type === 'finish_to_finish' 
              ? sourceSchedule.end_date 
              : sourceSchedule.start_date
            );
            dependencyDate.setDate(dependencyDate.getDate() + (dep.lag_days || 0));
            
            if (dependencyDate > latestFinish) {
              latestFinish = dependencyDate;
            }
          }
        });

        // Set start date to day after latest dependency (for finish_to_start)
        const startDate = new Date(latestFinish);
        if (deps.some(d => d.dependency_type === 'finish_to_start')) {
          startDate.setDate(startDate.getDate() + 1);
        }

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + (phase.duration_days || 30));

        phaseSchedule.set(phaseId, {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        });

        // console.log(`[DefaultPhaseDatingService] Scheduled dependent phase ${phase.name}: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
      });

      // Apply calculated dates to lifecycle phases
      let updatedCount = 0;
      for (const lp of lifecyclePhases) {
        const schedule = phaseSchedule.get(lp.phase_id);
        if (schedule) {
          const { error: updateError } = await supabase
            .from('lifecycle_phases')
            .update({
              start_date: schedule.start_date,
              end_date: schedule.end_date
            })
            .eq('id', lp.id);

          if (updateError) {
            console.error(`Failed to update lifecycle phase ${lp.id}:`, updateError);
          } else {
            updatedCount++;
          }
        }
      }

      // Snapshot baseline dates for newly set phases
      await TimelineDriftService.snapshotBaseline(productId).catch(() => {});

      return { success: true, updatedCount };

    } catch (error) {
      console.error('[DefaultPhaseDatingService] Error initializing dependency-based timeline:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        updatedCount: 0
      };
    }
  }

  /**
   * Initialize default timeline for a product's phases, but only for phases that are active in company settings
   * This method respects the company's active phase configuration from company_chosen_phases table
   */
  static async initializeDefaultTimelineForActivePhases(productId: string, companyId: string): Promise<{ success: boolean; error?: string; updatedCount: number }> {
    try {
      // console.log(`[DefaultPhaseDatingService] Initializing timeline for active phases only - product ${productId}, company ${companyId}`);

      // Get product info
      const { data: product } = await supabase
        .from('products')
        .select('company_id, project_start_date')
        .eq('id', productId)
        .single();

      if (!product) {
        throw new Error('Product not found');
      }

      // Get active company phases from company_chosen_phases
      const { data: activeCompanyPhases } = await supabase
        .from('company_chosen_phases')
        .select(`
          phase_id,
          position,
          company_phases!inner(
            id,
            name,
            duration_days,
            is_continuous_process,
            typical_start_day
          )
        `)
        .eq('company_id', companyId)
        .order('position');

      if (!activeCompanyPhases || activeCompanyPhases.length === 0) {
        // console.log('[DefaultPhaseDatingService] No active company phases found');
        return { success: false, error: 'No active phases configured for company', updatedCount: 0 };
      }

      // console.log(`[DefaultPhaseDatingService] Found ${activeCompanyPhases.length} active company phases`);

      // Get lifecycle phases for this product that match active company phases
      const activePhaseIds = activeCompanyPhases.map(acp => acp.phase_id);
      const { data: lifecyclePhases } = await supabase
        .from('lifecycle_phases')
        .select(`
          id,
          phase_id,
          name,
          company_phases!inner(name, duration_days, is_continuous_process, typical_start_day)
        `)
        .eq('product_id', productId)
        .in('phase_id', activePhaseIds)
        .order('phase_id');

      if (!lifecyclePhases || lifecyclePhases.length === 0) {
        // console.log('[DefaultPhaseDatingService] No lifecycle phases found for active company phases');
        return { success: false, error: 'No lifecycle phases found for active company phases', updatedCount: 0 };
      }

      // console.log(`[DefaultPhaseDatingService] Found ${lifecyclePhases.length} lifecycle phases matching active company phases`);

      // Get dependencies for active phases only (fetch where either source or target is in the active phases)
      const { data: dependencies } = await supabase
        .from('phase_dependencies')
        .select('*')
        .eq('company_id', companyId)
        .or('source_phase_id.in.(' + activePhaseIds.join(',') + '),target_phase_id.in.(' + activePhaseIds.join(',') + ')');

      // console.log(`[DefaultPhaseDatingService] Found ${dependencies?.length || 0} dependencies for active phases`);

      // Create phase maps for active phases only
      const phaseMap = new Map();
      lifecyclePhases.forEach(lp => {
        const companyPhase = lp.company_phases as any; // Type cast to handle typical_start_day not in generated types
        phaseMap.set(lp.phase_id, {
          ...lp,
          name: companyPhase.name,
          duration_days: companyPhase.duration_days || 30,
          is_continuous_process: companyPhase.is_continuous_process,
          typical_start_day: companyPhase.typical_start_day
        });
      });

      // Build dependency graph for active phases only
      const incomingDeps = new Map();
      const outgoingDeps = new Map();
      
      lifecyclePhases.forEach(lp => {
        incomingDeps.set(lp.phase_id, []);
        outgoingDeps.set(lp.phase_id, []);
      });

      (dependencies || []).forEach(dep => {
        if (phaseMap.has(dep.source_phase_id) && phaseMap.has(dep.target_phase_id)) {
          incomingDeps.get(dep.target_phase_id).push(dep);
          outgoingDeps.get(dep.source_phase_id).push(dep);
        }
      });

      // Calculate dates using dependency scheduling for active phases only
      const phaseSchedule = new Map();
      const projectStartDate = new Date(product.project_start_date || new Date());
      
      // Separate linear and concurrent phases
      const linearPhases = Array.from(phaseMap.entries())
        .filter(([_, phase]) => !phase.is_continuous_process)
        .sort((a, b) => {
          const posA = activeCompanyPhases.find(acp => acp.phase_id === a[0])?.position || 0;
          const posB = activeCompanyPhases.find(acp => acp.phase_id === b[0])?.position || 0;
          return posA - posB;
        });

      const concurrentPhases = Array.from(phaseMap.entries())
        .filter(([_, phase]) => phase.is_continuous_process);

      // console.log(`[DefaultPhaseDatingService] Linear phases (${linearPhases.length}):`, linearPhases.map(([_, p]) => p.name));
      // console.log(`[DefaultPhaseDatingService] Concurrent phases (${concurrentPhases.length}):`, concurrentPhases.map(([_, p]) => p.name));

      // Calculate total project duration from linear phases for concurrent phase end dates
      let totalLinearDuration = 0;
      linearPhases.forEach(([_, phase]) => {
        totalLinearDuration += (phase.duration_days || 30);
      });

      // Schedule LINEAR phases sequentially (each starts after previous ends)
      let currentDate = new Date(projectStartDate);
      for (const [phaseId, phase] of linearPhases) {
        const startDate = new Date(currentDate);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + (phase.duration_days || 30));

        phaseSchedule.set(phaseId, {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        });

        // console.log(`[DefaultPhaseDatingService] Scheduled LINEAR phase ${phase.name}: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]} (${phase.duration_days || 30} days)`);

        // Next linear phase starts the day after this one ends
        currentDate = new Date(endDate);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Schedule CONCURRENT phases - use staggered start days (0, 60, 120, 360)
      // Each phase uses its typical_start_day from company settings
      for (const [phaseId, phase] of concurrentPhases) {
        const typicalStartDay = phase.typical_start_day || 0;
        const startDate = new Date(projectStartDate);
        startDate.setDate(startDate.getDate() + typicalStartDay); // Add typical_start_day offset
        const endDate = new Date(startDate);
        const duration = phase.duration_days || 30; // Use phase's own duration, default 30 days
        endDate.setDate(endDate.getDate() + duration);

        phaseSchedule.set(phaseId, {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        });

        // console.log(`[DefaultPhaseDatingService] Scheduled CONCURRENT phase ${phase.name}: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]} (${duration} days, starts from Day ${typicalStartDay})`);
      }

      // Find root phases (no incoming dependencies) among active phases - for dependency processing
      const rootPhases = Array.from(phaseMap.keys()).filter(phaseId =>
        (incomingDeps.get(phaseId) || []).length === 0
      );

      // console.log(`[DefaultPhaseDatingService] Root phases among active phases:`, rootPhases.map(id => phaseMap.get(id)?.name));

      // Topological sort and schedule remaining active phases
      const visited = new Set();
      const tempMark = new Set();
      const sorted = [];

      const visit = (phaseId) => {
        if (tempMark.has(phaseId)) {
          console.warn(`[DefaultPhaseDatingService] Circular dependency detected involving active phase ${phaseId}`);
          return;
        }
        if (visited.has(phaseId)) return;

        tempMark.add(phaseId);
        
        // Visit all dependencies first
        (incomingDeps.get(phaseId) || []).forEach(dep => {
          visit(dep.source_phase_id);
        });
        
        tempMark.delete(phaseId);
        visited.add(phaseId);
        sorted.push(phaseId);
      };

      // Visit all active phases
      Array.from(phaseMap.keys()).forEach(phaseId => {
        if (!visited.has(phaseId)) {
          visit(phaseId);
        }
      });

      // Schedule non-root active phases based on dependencies
      sorted.forEach(phaseId => {
        if (phaseSchedule.has(phaseId)) return; // Already scheduled (root phase)

        const phase = phaseMap.get(phaseId);
        const deps = incomingDeps.get(phaseId) || [];
        
        if (deps.length === 0) return; // No dependencies

        // Calculate start date based on latest dependency
        let latestFinish = new Date(projectStartDate);
        
        deps.forEach(dep => {
          const sourceSchedule = phaseSchedule.get(dep.source_phase_id);
          if (sourceSchedule) {
            const dependencyDate = new Date(dep.dependency_type === 'finish_to_start' || dep.dependency_type === 'finish_to_finish' 
              ? sourceSchedule.end_date 
              : sourceSchedule.start_date
            );
            dependencyDate.setDate(dependencyDate.getDate() + (dep.lag_days || 0));
            
            if (dependencyDate > latestFinish) {
              latestFinish = dependencyDate;
            }
          }
        });

        // Set start date to day after latest dependency (for finish_to_start)
        const startDate = new Date(latestFinish);
        if (deps.some(d => d.dependency_type === 'finish_to_start')) {
          startDate.setDate(startDate.getDate() + 1);
        }

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + (phase.duration_days || 30));

        phaseSchedule.set(phaseId, {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        });

        // console.log(`[DefaultPhaseDatingService] Scheduled active dependent phase ${phase.name}: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
      });

      // Apply calculated dates to lifecycle phases (only active ones)
      let updatedCount = 0;
      for (const lp of lifecyclePhases) {
        const schedule = phaseSchedule.get(lp.phase_id);
        if (schedule) {
          const { error: updateError } = await supabase
            .from('lifecycle_phases')
            .update({
              start_date: schedule.start_date,
              end_date: schedule.end_date
            })
            .eq('id', lp.id);

          if (updateError) {
            console.error(`Failed to update active lifecycle phase ${lp.id}:`, updateError);
          } else {
            updatedCount++;
          }
        }
      }

      // Copy company phase dependencies to product_phase_dependencies
      // Map company phase IDs to lifecycle phase IDs
      const phaseIdMap = new Map<string, string>(); // company_phase_id -> lifecycle_phase_id
      lifecyclePhases.forEach(lp => {
        phaseIdMap.set(lp.phase_id, lp.id);
      });

      // Get company dependencies and copy them to product
      if (dependencies && dependencies.length > 0) {
        const productDependencyInserts = [];

        for (const dep of dependencies) {
          const sourceLifecyclePhaseId = phaseIdMap.get(dep.source_phase_id);
          const targetLifecyclePhaseId = phaseIdMap.get(dep.target_phase_id);

          if (sourceLifecyclePhaseId && targetLifecyclePhaseId) {
            productDependencyInserts.push({
              product_id: productId,
              source_phase_id: sourceLifecyclePhaseId,
              target_phase_id: targetLifecyclePhaseId,
              dependency_type: dep.dependency_type,
              lag_days: dep.lag_days || 0
            });
          }
        }

        if (productDependencyInserts.length > 0) {
          // Check if dependencies already exist for this product
          const { data: existingDeps } = await supabase
            .from('product_phase_dependencies')
            .select('id')
            .eq('product_id', productId)
            .limit(1);

          if (!existingDeps || existingDeps.length === 0) {
            const { error: productDepError } = await supabase
              .from('product_phase_dependencies')
              .insert(productDependencyInserts);

            if (productDepError) {
              console.error('[DefaultPhaseDatingService] Error copying dependencies to product:', productDepError);
            } else {
              // console.log(`[DefaultPhaseDatingService] Copied ${productDependencyInserts.length} dependencies to product_phase_dependencies`);
            }
          } else {
            // console.log('[DefaultPhaseDatingService] Product already has dependencies, skipping copy');
          }
        }
      }

      // console.log(`[DefaultPhaseDatingService] Successfully updated ${updatedCount} active phases using dependency-based system`);
      return { success: true, updatedCount };

    } catch (error) {
      console.error('[DefaultPhaseDatingService] Error initializing timeline for active phases:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        updatedCount: 0
      };
    }
  }

  /**
   * Check if a product has phases without dates
   */
  static async hasUnscheduledPhases(productId: string): Promise<boolean> {
    try {
      const { data: unscheduledPhases } = await supabase
        .from('lifecycle_phases')
        .select('id')
        .eq('product_id', productId)
        .or('start_date.is.null,end_date.is.null')
        .limit(1);

      return (unscheduledPhases?.length || 0) > 0;
    } catch (error) {
      console.error('[DefaultPhaseDatingService] Error checking unscheduled phases:', error);
      return false;
    }
  }

  /**
   * DEPRECATED: This method is replaced by the modern dependency-based system
   * Calculate dates based on company phase settings (start_day and duration)
   * @deprecated Use PhaseDependencyService.calculateSchedule() instead
   */
  static calculateSequentialDatesFromPositions(
    phases: any[], 
    projectStartDate: Date
  ): { id: string; start_date: string; end_date: string }[] {
    console.warn('[DefaultPhaseDatingService] DEPRECATED: calculateSequentialDatesFromPositions is obsolete. Use PhaseDependencyService instead.');
    
    // This method is kept for backward compatibility but should not be used
    // All new timeline calculations should use the dependency-based system
    return [];
  }
}