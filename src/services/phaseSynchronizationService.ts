
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PRODUCT_REALISATION_PHASES } from './companyInitializationService';

export interface PhaseSyncResult {
  success: boolean;
  syncedCount: number;
  errors: string[];
}

export interface KeepExistingSyncResult {
  success: boolean;
  addedCount: number;
  keptCount: number;
  errors: string[];
}

export class PhaseSynchronizationService {
  /**
   * Synchronize product lifecycle phases with company chosen phases
   */
  static async syncProductWithCompanyPhases(productId: string, companyId: string): Promise<PhaseSyncResult> {
    try {
      // Skip the problematic stored procedure and use manual sync instead
      let syncedCount = 0;
      let syncError = null;

      try {
        // Get the product's project_start_date
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('project_start_date')
          .eq('id', productId)
          .single();

        if (productError) {
          console.error('[PhaseSynchronizationService] Error fetching product:', productError);
        }

        // Manual sync: Get company chosen phases with duration information
        const { data: chosenPhases, error: chosenError } = await supabase
          .from('company_chosen_phases')
          .select(`
            phase_id,
            position,
            company_phases!inner(id, name, description, duration_days, category_id, sub_section_id, is_continuous_process, typical_start_day)
          `)
          .eq('company_id', companyId)
          .order('position');

        if (chosenError) {
          console.error('[PhaseSynchronizationService] Error fetching chosen phases:', chosenError);
          syncError = chosenError;
        } else if (chosenPhases) {
          // Auto-correct is_continuous_process for existing company_phases where it was incorrectly set to false
          // This fixes data created before the companyInitializationService bug was fixed
          for (const cp of chosenPhases) {
            const phaseData = cp.company_phases as any;
            if (!phaseData) continue;
            if (phaseData.is_continuous_process !== true) {
              const originalPhase = PRODUCT_REALISATION_PHASES.find((p) => p.name === phaseData.name);
              if (originalPhase?.is_continuous_process === true) {
                await supabase
                  .from('company_phases')
                  .update({ is_continuous_process: true })
                  .eq('id', phaseData.id);
                phaseData.is_continuous_process = true;
              }
            }
          }

          // Calculate dates based on position and duration
          // Use product's project_start_date if available, otherwise use today
          let currentDate = productData?.project_start_date
            ? new Date(productData.project_start_date)
            : new Date();
          const dateCalculations = [];

          // Separate phases: "No Phase" is stored but excluded from date calculations
          const noPhaseEntries = chosenPhases.filter(p => {
            const phaseData = p.company_phases as any;
            return phaseData?.name === 'No Phase';
          });
          const actualPhases = chosenPhases.filter(p => {
            const phaseData = p.company_phases as any;
            return phaseData?.name !== 'No Phase';
          });

          // Separate sequential and continuous/parallel phases
          const sequentialPhases = actualPhases.filter(p => {
            const phaseData = p.company_phases as any;
            return !phaseData?.is_continuous_process;
          });
          const continuousPhases = actualPhases.filter(p => {
            const phaseData = p.company_phases as any;
            return phaseData?.is_continuous_process === true;
          });
          
          // Calculate dates for sequential phases
          for (let i = 0; i < sequentialPhases.length; i++) {
            const chosenPhase = sequentialPhases[i];
            const phaseData = chosenPhase.company_phases;
            if (Array.isArray(phaseData)) continue; // Skip invalid data
            
            const typedPhaseData = phaseData as { name: string; description?: string; category_id?: string; sub_section_id?: string | null; duration_days?: number };
            const startDate = new Date(currentDate);
            const durationDays = typedPhaseData.duration_days || 30; // Default 30 days
            const endDate = new Date(currentDate);
            endDate.setDate(endDate.getDate() + durationDays);
            
            dateCalculations.push({
              phase_id: chosenPhase.phase_id,
              phaseData,
              position: chosenPhase.position,
              start_date: startDate.toISOString().split('T')[0],
              end_date: endDate.toISOString().split('T')[0],
              is_continuous: false
            });
            
            // Move to next phase start date
            currentDate = new Date(endDate);
            currentDate.setDate(currentDate.getDate() + 1);
          }
          
          // Calculate dates for continuous phases (run parallel to all sequential phases)
          // Use product's project_start_date if available, otherwise use today
          const projectStartDate = productData?.project_start_date
            ? new Date(productData.project_start_date)
            : new Date();
          const projectEndDate = dateCalculations.length > 0 
            ? new Date(dateCalculations[dateCalculations.length - 1].end_date)
            : new Date(projectStartDate.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year default
          
          for (const chosenPhase of continuousPhases) {
            const phaseData = chosenPhase.company_phases;
            if (Array.isArray(phaseData)) continue; // Skip invalid data

            const typedPhaseData = phaseData as any;
            const typicalStartDay = typedPhaseData.typical_start_day || 0;
            const durationDays = typedPhaseData.duration_days || 360;

            const phaseStart = new Date(projectStartDate);
            phaseStart.setDate(phaseStart.getDate() + typicalStartDay);

            const phaseEnd = new Date(phaseStart);
            phaseEnd.setDate(phaseEnd.getDate() + durationDays);

            dateCalculations.push({
              phase_id: chosenPhase.phase_id,
              phaseData,
              position: chosenPhase.position,
              start_date: phaseStart.toISOString().split('T')[0],
              end_date: phaseEnd.toISOString().split('T')[0],
              is_continuous: true
            });
          }
          
          // Add "No Phase" entries - stored in lifecycle_phases but not part of date calculations
          for (const chosenPhase of noPhaseEntries) {
            const phaseData = chosenPhase.company_phases;
            if (Array.isArray(phaseData)) continue;

            dateCalculations.push({
              phase_id: chosenPhase.phase_id,
              phaseData,
              position: chosenPhase.position,
              start_date: projectStartDate.toISOString().split('T')[0],
              end_date: projectStartDate.toISOString().split('T')[0],
              is_continuous: false
            });
          }

          // Clear existing phases first to ensure complete replacement
          const { error: clearError } = await supabase
            .from('lifecycle_phases')
            .delete()
            .eq('product_id', productId);

          if (clearError) {
            console.error('[PhaseSynchronizationService] Error clearing existing phases:', clearError);
            syncError = clearError;
          }

          // Create new lifecycle phases with calculated dates
          for (const calc of dateCalculations) {
            const { data: newPhase, error: insertError } = await supabase
              .from('lifecycle_phases')
              .insert({
                product_id: productId,
                phase_id: calc.phase_id,
                name: calc.phaseData.name,
                description: calc.phaseData.description,
                position: calc.position,
                start_date: calc.start_date,
                end_date: calc.end_date,
                status: calc.position === 0 ? 'in_progress' : 'not_started',
                is_current_phase: calc.position === 0,
                category_id: calc.phaseData.category_id,
                sub_section_id: calc.phaseData.sub_section_id || null
              })
              .select('id, name, phase_id');

            if (!insertError && newPhase) {
              syncedCount++;
            } else if (insertError) {
              console.error(`[PhaseSynchronizationService] Error creating phase ${calc.phaseData.name}:`, insertError);
            }
          }
        }
      } catch (err) {
        console.error('[PhaseSynchronizationService] Manual sync exception:', err);
        syncError = { message: `Manual sync failed: ${err}` };
      }

      if (syncError) {
        console.error('[PhaseSynchronizationService] Sync failed with error:', syncError);
        return { success: false, syncedCount: 0, errors: [syncError.message] };
      }

      return {
        success: true,
        syncedCount: syncedCount || 0,
        errors: []
      };
    } catch (error) {
      console.error('[PhaseSynchronizationService] Sync failed:', error);
      return {
        success: false,
        syncedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Synchronize product lifecycle phases with company chosen phases - KEEP EXISTING
   * Only adds new phases from company that don't already exist in the product
   */
  static async syncProductWithCompanyPhasesKeepExisting(productId: string, companyId: string): Promise<KeepExistingSyncResult> {
    try {
      // Get existing product phases
      const { data: existingPhases, error: existingError } = await supabase
        .from('lifecycle_phases')
        .select('id, phase_id, name, position')
        .eq('product_id', productId);

      if (existingError) {
        console.error('[PhaseSynchronizationService] Error fetching existing phases:', existingError);
        return { success: false, addedCount: 0, keptCount: 0, errors: [existingError.message] };
      }

      const existingPhaseIds = new Set((existingPhases || []).map(p => p.phase_id));
      const keptCount = existingPhases?.length || 0;

      // Get company chosen phases
      const { data: chosenPhases, error: chosenError } = await supabase
        .from('company_chosen_phases')
        .select(`
          phase_id,
          position,
          company_phases!inner(id, name, description, duration_days, category_id, sub_section_id)
        `)
        .eq('company_id', companyId)
        .order('position');

      if (chosenError) {
        console.error('[PhaseSynchronizationService] Error fetching company phases:', chosenError);
        return { success: false, addedCount: 0, keptCount, errors: [chosenError.message] };
      }

      // Filter out phases that already exist
      const newPhases = (chosenPhases || []).filter(p => !existingPhaseIds.has(p.phase_id));

      if (newPhases.length === 0) {
        return { success: true, addedCount: 0, keptCount, errors: [] };
      }

      // Get the product's project_start_date
      const { data: productData } = await supabase
        .from('products')
        .select('project_start_date')
        .eq('id', productId)
        .single();

      // Get the latest end date from existing phases to start new phases after
      // Fall back to project_start_date or today
      let startDate = productData?.project_start_date
        ? new Date(productData.project_start_date)
        : new Date();

      if (existingPhases && existingPhases.length > 0) {
        const { data: existingWithDates } = await supabase
          .from('lifecycle_phases')
          .select('end_date')
          .eq('product_id', productId)
          .not('end_date', 'is', null)
          .order('end_date', { ascending: false })
          .limit(1);

        if (existingWithDates && existingWithDates.length > 0 && existingWithDates[0].end_date) {
          startDate = new Date(existingWithDates[0].end_date);
          startDate.setDate(startDate.getDate() + 1); // Start day after last phase ends
        }
      }

      // Get the max position from existing phases
      const maxExistingPosition = Math.max(...(existingPhases || []).map(p => p.position || 0), -1);

      let addedCount = 0;
      let currentDate = new Date(startDate);

      // Add only the new phases
      for (let i = 0; i < newPhases.length; i++) {
        const chosenPhase = newPhases[i];
        const phaseData = chosenPhase.company_phases;
        if (Array.isArray(phaseData)) continue;

        const typedPhaseData = phaseData as { name: string; description?: string; category_id?: string; sub_section_id?: string | null; duration_days?: number };
        const phaseStartDate = new Date(currentDate);
        const durationDays = typedPhaseData.duration_days || 30;
        const phaseEndDate = new Date(currentDate);
        phaseEndDate.setDate(phaseEndDate.getDate() + durationDays);

        // Calculate new position - add after existing phases
        const newPosition = maxExistingPosition + 1 + i;

        const { data: newPhase, error: insertError } = await supabase
          .from('lifecycle_phases')
          .insert({
            product_id: productId,
            phase_id: chosenPhase.phase_id,
            name: typedPhaseData.name,
            description: typedPhaseData.description,
            position: newPosition,
            start_date: phaseStartDate.toISOString().split('T')[0],
            end_date: phaseEndDate.toISOString().split('T')[0],
            status: 'not_started',
            is_current_phase: false,
            category_id: typedPhaseData.category_id,
            sub_section_id: typedPhaseData.sub_section_id || null
          })
          .select('id, name');

        if (!insertError && newPhase) {
          addedCount++;
        } else if (insertError) {
          console.error(`[PhaseSynchronizationService] Error adding phase ${phaseData.name}:`, insertError);
        }

        // Move to next phase start date
        currentDate = new Date(phaseEndDate);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return {
        success: true,
        addedCount,
        keptCount,
        errors: []
      };
    } catch (error) {
      console.error('[PhaseSynchronizationService] Keep-existing sync failed:', error);
      return {
        success: false,
        addedCount: 0,
        keptCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Ensure all products for a company have synchronized phases
   */
  static async syncAllCompanyProducts(companyId: string): Promise<PhaseSyncResult> {
    try {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('company_id', companyId)
        .eq('is_archived', false);

      if (productsError) {
        return { success: false, syncedCount: 0, errors: [productsError.message] };
      }

      let totalSynced = 0;
      const allErrors: string[] = [];

      for (const product of products || []) {
        const result = await this.syncProductWithCompanyPhases(product.id, companyId);
        totalSynced += result.syncedCount;
        allErrors.push(...result.errors);
      }

      return {
        success: allErrors.length === 0,
        syncedCount: totalSynced,
        errors: allErrors
      };
    } catch (error) {
      return {
        success: false,
        syncedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
}
