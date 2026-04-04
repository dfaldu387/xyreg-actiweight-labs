
import { supabase } from "@/integrations/supabase/client";
// NOTE: ensureCompanyPhaseIntegrity has been removed to prevent auto-sync to products.
// Product lifecycle_phases should only sync when user explicitly requests it
// via "Full Replace" or "Keep Existing" options on the product milestones page.
// CompanyInitializationService is dynamically imported in ensureCompanyHasPhases

export interface Phase {
  id: string;
  name: string;
  description?: string;
  category_id?: string;
  sub_section_id?: string;
  compliance_section_ids?: string[];
  company_id: string;
  position: number;
  is_active: boolean;
  is_predefined_core_phase: boolean;
  is_custom: boolean; // Make this required instead of optional
  is_deletable: boolean;
  start_date?: string;
  duration_days?: number;
  typical_start_day?: number | null;
  typical_duration_days?: number | null;
  is_continuous_process?: boolean;
  start_percentage?: number;
  end_percentage?: number;
  // Phase reference fields for concurrent phases
  start_phase_id?: string;
  end_phase_id?: string;
  start_position?: string;
  end_position?: string;
  is_calculated?: boolean;
  calculated_start_day?: number;
  calculated_end_day?: number;
}

export interface PhaseCategory {
  id: string;
  name: string;
  company_id: string;
  is_system_category?: boolean;
}

/**
 * Consolidated Phase Data Service
 * Uses company_phases table for proper foreign key relationships
 */
export class ConsolidatedPhaseDataService {

  static async loadPhases(companyId: string): Promise<{
    activePhases: Phase[];
    availablePhases: Phase[];
  }> {
    try {


      // First ensure the company has standard phases
      await this.ensureCompanyHasPhases(companyId);

      // Get active phases from company_chosen_phases joining with company_phases and categories
      const { data: activePhasesRaw, error: activePhasesError } = await supabase
        .from('company_chosen_phases')
        .select(`
          position,
          company_phases!inner(
            id,
            name,
            description,
            category_id,
            sub_section_id,
            compliance_section_ids,
            company_id,
            position,
            is_active,
            start_date,
            duration_days,
            typical_start_day,
            typical_duration_days,
            is_continuous_process,
            start_percentage,
            end_percentage,
            start_phase_id,
            end_phase_id,
            start_position,
            end_position,
            phase_categories:category_id(
              id,
              name,
              is_system_category
            )
          )
        `)
        .eq('company_id', companyId)
        .order('position');

      if (activePhasesError) {
        throw activePhasesError;
      }

      // Map active phases with proper system/custom classification and sort by position
      const activePhases: Phase[] = (activePhasesRaw || [])
        .map(cp => {
          const category = cp.company_phases.phase_categories;
          const isSystemPhase = category?.is_system_category === true;

          return {
            id: cp.company_phases.id,
            name: cp.company_phases.name,
            description: cp.company_phases.description,
            category_id: cp.company_phases.category_id,
            sub_section_id: (cp.company_phases as any).sub_section_id,
            compliance_section_ids: (cp.company_phases as any).compliance_section_ids || [],  // Legacy, sections now use phase_id
            company_id: cp.company_phases.company_id,
            position: cp.position,
            is_active: cp.company_phases.is_active,
            is_predefined_core_phase: isSystemPhase,
            is_custom: !isSystemPhase,
            is_deletable: !isSystemPhase, // System phases are not deletable
            start_date: cp.company_phases.start_date,
            duration_days: cp.company_phases.duration_days,
            typical_start_day: (cp.company_phases as any).typical_start_day,
            typical_duration_days: (cp.company_phases as any).typical_duration_days,
            is_continuous_process: cp.company_phases.is_continuous_process,
            start_percentage: (cp.company_phases as any).start_percentage,
            end_percentage: (cp.company_phases as any).end_percentage,
            start_phase_id: (cp.company_phases as any).start_phase_id,
            end_phase_id: (cp.company_phases as any).end_phase_id,
            start_position: (cp.company_phases as any).start_position,
            end_position: (cp.company_phases as any).end_position
          };
        })
        .sort((a, b) => a.position - b.position); // Sort by position in ascending order

      // Load all company phases to get available phases with category information
      const { data: allPhases, error: allPhasesError } = await supabase
        .from('company_phases')
        .select(`
          id,
          name,
          description,
          category_id,
          sub_section_id,
          compliance_section_ids,
          company_id,
          position,
          is_active,
          start_date,
          duration_days,
          typical_start_day,
          typical_duration_days,
          is_continuous_process,
          start_percentage,
          end_percentage,
          start_phase_id,
          end_phase_id,
          start_position,
          end_position,
          phase_categories:category_id(
            id,
            name,
            is_system_category
          )
        `)
        .eq('company_id', companyId)
        .order('position');

      if (allPhasesError) {
        throw allPhasesError;
      }

      // Get IDs of active phases
      const activePhaseIds = new Set(activePhases.map(p => p.id));

      // Available phases are those not currently active, sorted by position
      const availablePhases = (allPhases || [])
        .filter(phase => !activePhaseIds.has(phase.id))
        .map(phase => {
          const category = phase.phase_categories;
          const isSystemPhase = category?.is_system_category === true;

          return {
            id: phase.id,
            name: phase.name,
            description: phase.description,
            category_id: phase.category_id,
            sub_section_id: (phase as any).sub_section_id,
            compliance_section_ids: (phase as any).compliance_section_ids || [],  // Legacy, sections now use phase_id
            company_id: phase.company_id,
            position: phase.position,
            is_active: phase.is_active,
            is_predefined_core_phase: isSystemPhase,
            is_custom: !isSystemPhase,
            is_deletable: !isSystemPhase, // System phases are not deletable
            start_date: phase.start_date,
            duration_days: phase.duration_days,
            typical_start_day: (phase as any).typical_start_day,
            typical_duration_days: (phase as any).typical_duration_days,
            is_continuous_process: phase.is_continuous_process,
            start_percentage: (phase as any).start_percentage,
            end_percentage: (phase as any).end_percentage,
            start_phase_id: (phase as any).start_phase_id,
            end_phase_id: (phase as any).end_phase_id,
            start_position: (phase as any).start_position,
            end_position: (phase as any).end_position
          };
        })
        .sort((a, b) => a.position - b.position); // Sort by position in ascending order
      return { activePhases, availablePhases };
    } catch (error) {
      console.error('[ConsolidatedPhaseDataService] Error in loadPhases:', error);
      throw new Error(`Failed to load phases: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async ensureCompanyHasPhases(companyId: string): Promise<void> {
    try {
      // Check if company has any phases in company_phases
      const { data: existingPhases, error: checkError } = await supabase
        .from('company_phases')
        .select('id')
        .eq('company_id', companyId)
        .limit(1);

      if (checkError) {
        throw checkError;
      }

      // If no phases exist, initialize using CompanyInitializationService
      if (!existingPhases || existingPhases.length === 0) {
        const { CompanyInitializationService } = await import('@/services/companyInitializationService');
        const result = await CompanyInitializationService.initializeCompany(companyId, 'Company');
        if (!result.success) {
          throw new Error(`Failed to initialize phases: ${result.message}`);
        }
      }
    } catch (error) {
      console.error('[ConsolidatedPhaseDataService] Error ensuring company phases:', error);
      throw error;
    }
  }

  static async loadCategories(companyId: string): Promise<PhaseCategory[]> {
    try {


      const { data, error } = await supabase
        .from('phase_categories')
        .select('id, name, company_id, is_system_category')
        .eq('company_id', companyId)
        .order('name');

      if (error) {
        throw error;
      }


      return data || [];
    } catch (error) {
      console.error('[ConsolidatedPhaseDataService] Error in loadCategories:', error);
      throw new Error(`Failed to load categories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async addPhaseToActive(companyId: string, phaseId: string): Promise<void> {
    try {


      // Verify the phase exists in company_phases
      const { data: phase, error: phaseError } = await supabase
        .from('company_phases')
        .select('id, position')
        .eq('id', phaseId)
        .eq('company_id', companyId)
        .single();

      if (phaseError || !phase) {
        throw new Error(`Phase ${phaseId} not found in company_phases for company ${companyId}`);
      }

      // Get the next position
      const { data: maxPosition, error: posError } = await supabase
        .from('company_chosen_phases')
        .select('position')
        .eq('company_id', companyId)
        .order('position', { ascending: false })
        .limit(1);

      if (posError) {
        throw posError;
      }

      const nextPosition = (maxPosition?.[0]?.position || 0) + 1;

      // Add the phase
      const { error: insertError } = await supabase
        .from('company_chosen_phases')
        .insert({
          company_id: companyId,
          phase_id: phaseId,
          position: nextPosition
        });

      if (insertError) {
        throw insertError;
      }

      // NOTE: Auto-sync to products has been removed.
      // Product lifecycle_phases should only sync when user explicitly requests it
      // via "Full Replace" or "Keep Existing" options on the product milestones page.


    } catch (error) {
      console.error('[ConsolidatedPhaseDataService] Error in addPhaseToActive:', error);
      throw error;
    }
  }
  static async addMultiplePhasesToActive(companyId: string, phaseIds: string[]): Promise<void> {
    try {


      if (!phaseIds || phaseIds.length === 0) {
        throw new Error('No phase IDs provided');
      }

      // Verify all phases exist in company_phases
      const { data: phases, error: phaseError } = await supabase
        .from('company_phases')
        .select('id, position')
        .eq('company_id', companyId)
        .in('id', phaseIds);

      if (phaseError) {
        throw phaseError;
      }

      if (!phases || phases.length !== phaseIds.length) {
        const foundPhaseIds = phases?.map(p => p.id) || [];
        const missingPhaseIds = phaseIds.filter(id => !foundPhaseIds.includes(id));
        throw new Error(`Phases not found in company_phases for company ${companyId}: ${missingPhaseIds.join(', ')}`);
      }

      // Get the current maximum position
      const { data: maxPosition, error: posError } = await supabase
        .from('company_chosen_phases')
        .select('position')
        .eq('company_id', companyId)
        .order('position', { ascending: false })
        .limit(1);

      if (posError) {
        throw posError;
      }

      const startPosition = (maxPosition?.[0]?.position || 0) + 1;

      // Prepare batch insert data
      const insertData = phaseIds.map((phaseId, index) => ({
        company_id: companyId,
        phase_id: phaseId,
        position: startPosition + index
      }));

      // Perform batch insert
      const { error: insertError } = await supabase
        .from('company_chosen_phases')
        .insert(insertData);

      if (insertError) {
        throw insertError;
      }

      // NOTE: Auto-sync to products has been removed.
      // Product lifecycle_phases should only sync when user explicitly requests it
      // via "Full Replace" or "Keep Existing" options on the product milestones page.


    } catch (error) {
      console.error('[ConsolidatedPhaseDataService] Error in addMultiplePhasesToActive:', error);
      throw error;
    }
  }
  static async removePhaseFromActive(companyId: string, phaseId: string): Promise<void> {
    try {


      const { error } = await supabase
        .from('company_chosen_phases')
        .delete()
        .eq('company_id', companyId)
        .eq('phase_id', phaseId);

      if (error) {
        throw error;
      }

      // NOTE: Auto-sync to products has been removed.
      // Product lifecycle_phases should only sync when user explicitly requests it
      // via "Full Replace" or "Keep Existing" options on the product milestones page.


    } catch (error) {
      console.error('[ConsolidatedPhaseDataService] Error in removePhaseFromActive:', error);
      throw error;
    }
  }

  static async reorderPhases(companyId: string, reorderedPhases: Phase[]): Promise<void> {
    try {


      // Use the safe reordering function that handles constraints properly
      const phaseIds = reorderedPhases.map(phase => phase.id);
      const { data: success, error } = await supabase.rpc('safe_reorder_company_phases', {
        target_company_id: companyId,
        phase_ids: phaseIds
      });

      if (error) {
        console.error('[ConsolidatedPhaseDataService] Database error:', error);
        throw error;
      }

      if (!success) {
        throw new Error('Reordering function returned false');
      }


    } catch (error) {
      console.error('[ConsolidatedPhaseDataService] Error in reorderPhases:', error);
      throw error;
    }
  }

  static async deletePhase(phaseId: string): Promise<void> {
    try {


      // First remove from any company_chosen_phases
      await supabase
        .from('company_chosen_phases')
        .delete()
        .eq('phase_id', phaseId);

      // Then delete the phase itself
      const { error } = await supabase
        .from('company_phases')
        .delete()
        .eq('id', phaseId);

      if (error) {
        throw error;
      }

    } catch (error) {
      console.error('[ConsolidatedPhaseDataService] Error in deletePhase:', error);
      throw error;
    }
  }
}
