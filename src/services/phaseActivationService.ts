import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ActivePhase {
  id: string;
  phase_id: string;
  company_id: string;
  position: number;
  phase: {
    id: string;
    name: string;
    description?: string;
    category_id?: string;
    is_system_phase?: boolean;
  };
}

export class PhaseActivationService {
  /**
   * Get all active phases for a company (from company_chosen_phases)
   */
  static async getActivePhases(companyId: string): Promise<ActivePhase[]> {
    try {
      // console.log('[PhaseActivationService] Loading active phases for company:', companyId);

      // Get the active phase relationships with proper join to company_phases
      // Only include phases where is_active = true
      // Include phase category to determine if it's a system/inherited phase
      const { data: chosenPhases, error: chosenError } = await supabase
        .from('company_chosen_phases')
        .select(`
          id,
          phase_id,
          company_id,
          position,
          company_phases!inner(
            id,
            name,
            description,
            category_id,
            is_active,
            phase_categories(
              id,
              name,
              is_system_category
            )
          )
        `)
        .eq('company_id', companyId)
        .eq('company_phases.is_active', true)
        .order('position');

      if (chosenError) {
        console.error('[PhaseActivationService] Error loading chosen phases:', chosenError);
        throw chosenError;
      }

      if (!chosenPhases || chosenPhases.length === 0) {
        // console.log('[PhaseActivationService] No active phases found');
        return [];
      }

      // Transform the data to match the expected interface
      const activePhases: ActivePhase[] = chosenPhases.map(chosenPhase => {
        // Determine if this is a system phase based on category
        const phaseCategories = chosenPhase.company_phases.phase_categories;
        const isSystemCategory = Array.isArray(phaseCategories)
          ? phaseCategories[0]?.is_system_category || false
          : phaseCategories?.is_system_category || false;

        // Also check if it's a design control phase by name pattern
        const phaseName = chosenPhase.company_phases.name || '';
        const isDesignControlPhase = phaseName.includes('Design') ||
          phaseName.includes('Concept') ||
          phaseName.includes('Verification') ||
          phaseName.includes('Validation') ||
          phaseName.includes('Risk') ||
          phaseName.includes('Clinical') ||
          phaseName.includes('Surveillance') ||
          phaseName.includes('Technical Documentation') ||
          phaseName.includes('Configuration');

        const isSystemPhase = isSystemCategory || isDesignControlPhase;

        return {
          id: chosenPhase.id,
          phase_id: chosenPhase.phase_id,
          company_id: chosenPhase.company_id,
          position: chosenPhase.position,
          phase: {
            id: chosenPhase.company_phases.id,
            name: chosenPhase.company_phases.name,
            description: chosenPhase.company_phases.description,
            category_id: chosenPhase.company_phases.category_id,
            sub_section_id: (chosenPhase.company_phases as any).sub_section_id || null,
            is_system_phase: isSystemPhase
          }
        };
      });


      return activePhases;
    } catch (error) {
      console.error('[PhaseActivationService] Error in getActivePhases:', error);
      toast.error('Failed to load active phases');
      return [];
    }
  }

  /**
   * Get available phases that are not currently active (from company_phases table)
   */
  static async getAvailablePhases(companyId: string): Promise<Array<{ id: string; name: string; description?: string; category_id?: string; sub_section_id?: string | null }>> {
    try {
      // console.log('[PhaseActivationService] Loading available phases for company:', companyId);

      // Get all company phases for this company
      const { data: allPhases, error: phasesError } = await supabase
        .from('company_phases')
        .select('id, name, description, category_id, sub_section_id, is_active')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('position');

      if (phasesError) {
        console.error('[PhaseActivationService] Error loading all phases:', phasesError);
        throw phasesError;
      }

        // console.log(`[PhaseActivationService] Found ${allPhases?.length || 0} total phases for company`);

      if (!allPhases || allPhases.length === 0) {
        // console.log('[PhaseActivationService] No phases found for company');
        return [];
      }

      // Get currently active phase IDs
      const { data: activePhases, error: activeError } = await supabase
        .from('company_chosen_phases')
        .select('phase_id')
        .eq('company_id', companyId);

      if (activeError) {
        console.error('[PhaseActivationService] Error loading active phase IDs:', activeError);
        throw activeError;
      }

      const activePhaseIds = new Set(activePhases?.map(ap => ap.phase_id) || []);

      // Filter out active phases to get available ones
      const availablePhases = allPhases.filter(phase => {
        const isActive = activePhaseIds.has(phase.id);
        return !isActive;
      });


      return availablePhases;
    } catch (error) {
      console.error('[PhaseActivationService] Error in getAvailablePhases:', error);
      toast.error('Failed to load available phases');
      return [];
    }
  }

  /**
   * Get the next available position for a new active phase
   */
  static async getNextAvailablePosition(companyId: string): Promise<number> {
    try {
      const { data: existingPhases, error } = await supabase
        .from('company_chosen_phases')
        .select('position')
        .eq('company_id', companyId)
        .order('position');

      if (error) {
        throw error;
      }

      // If no phases exist, start at position 0
      if (!existingPhases || existingPhases.length === 0) {
        return 0;
      }

      // Find the highest position and add 1
      const maxPosition = Math.max(...existingPhases.map(p => p.position));
      return maxPosition + 1;
    } catch (error) {
      console.error('[PhaseActivationService] Error getting next position:', error);
      return 0;
    }
  }

  /**
   * Activate a phase - FIXED VERSION that updates both tables
   */
  static async activatePhase(companyId: string, phaseId: string): Promise<boolean> {
    try {
      // console.log('[PhaseActivationService] Activating phase:', { companyId, phaseId });

      // Start transaction by verifying the phase exists and belongs to this company
      const { data: phaseData, error: phaseError } = await supabase
        .from('company_phases')
        .select('id, name, is_active')
        .eq('id', phaseId)
        .eq('company_id', companyId)
        .single();

      if (phaseError) {
        console.error('[PhaseActivationService] Phase verification failed:', phaseError);
        if (phaseError.code === 'PGRST116') {
          toast.error('Phase not found or does not belong to this company');
        } else {
          toast.error('Error verifying phase');
        }
        return false;
      }

      if (!phaseData.is_active) {
        console.error('[PhaseActivationService] Phase is not active:', phaseData);
        toast.error('Cannot activate an inactive phase');
        return false;
      }

      // console.log('[PhaseActivationService] Phase verified:', phaseData);

      // Check if phase is already active to prevent duplicates
      const { data: existingPhase, error: checkError } = await supabase
        .from('company_chosen_phases')
        .select('id')
        .eq('company_id', companyId)
        .eq('phase_id', phaseId)
        .maybeSingle();

      if (checkError) {
        console.error('[PhaseActivationService] Error checking existing phase:', checkError);
        throw checkError;
      }

      if (existingPhase) {
        // console.log('[PhaseActivationService] Phase already active');
        toast.info('Phase is already active');
        return true;
      }

      // Get the next available position
      const nextPosition = await this.getNextAvailablePosition(companyId);
      // console.log('[PhaseActivationService] Next position will be:', nextPosition);

      // THE FIX: Add to company_chosen_phases table with proper position
      const { error: activationError } = await supabase
        .from('company_chosen_phases')
        .insert({
          company_id: companyId,
          phase_id: phaseId,
          position: nextPosition
        });

      if (activationError) {
        console.error('[PhaseActivationService] Error activating phase:', activationError);

        // Provide specific error message for position conflicts
        if (activationError.code === '23505' && activationError.message.includes('unique_company_chosen_phase_position')) {
          toast.error('Position conflict detected. Please try again.');
          return false;
        }

        toast.error(`Failed to activate phase: ${activationError.message}`);
        return false;
      }

      // console.log('[PhaseActivationService] Successfully activated phase at position:', nextPosition);
      toast.success(`Phase "${phaseData.name}" activated successfully`);
      return true;
    } catch (error) {
      console.error('[PhaseActivationService] Error in activatePhase:', error);
      toast.error('Failed to activate phase');
      return false;
    }
  }

  /**
   * Deactivate a phase - FIXED VERSION that removes from both tables
   */
  static async deactivatePhase(companyId: string, phaseId: string): Promise<boolean> {
    try {
      // console.log('[PhaseActivationService] Deactivating phase:', { companyId, phaseId });

      // Remove from company_chosen_phases (this makes it inactive)
      const { error: removeError } = await supabase
        .from('company_chosen_phases')
        .delete()
        .eq('company_id', companyId)
        .eq('phase_id', phaseId);

      if (removeError) {
        console.error('[PhaseActivationService] Error removing from chosen phases:', removeError);
        throw removeError;
      }

      // Note: We keep the phase in company_phases but remove it from chosen phases
      // This means the phase still exists but is not active

      // console.log('[PhaseActivationService] Successfully deactivated phase');
      toast.success('Phase deactivated successfully');
      return true;
    } catch (error) {
      console.error('[PhaseActivationService] Error in deactivatePhase:', error);
      toast.error('Failed to deactivate phase');
      return false;
    }
  }

  /**
   * Reorder active phases
   */
  static async reorderActivePhases(companyId: string, phaseIds: string[]): Promise<boolean> {
    try {
      // console.log('[PhaseActivationService] Reordering active phases for company:', companyId);

      // Use a transaction-like approach: first, set all positions to negative values to avoid conflicts
      // then update to final positions
      for (let i = 0; i < phaseIds.length; i++) {
        // First pass: set to negative positions to avoid conflicts
        const { error: tempError } = await supabase
          .from('company_chosen_phases')
          .update({ position: -(i + 1) })
          .eq('company_id', companyId)
          .eq('phase_id', phaseIds[i]);

        if (tempError) {
          console.error('[PhaseActivationService] Error in temp position update:', tempError);
          throw tempError;
        }
      }

      // Second pass: set to final positions
      for (let i = 0; i < phaseIds.length; i++) {
        const { error } = await supabase
          .from('company_chosen_phases')
          .update({ position: i })
          .eq('company_id', companyId)
          .eq('phase_id', phaseIds[i]);

        if (error) {
          console.error('[PhaseActivationService] Error updating final position:', error);
          throw error;
        }
      }

      // console.log('[PhaseActivationService] Successfully reordered active phases');
      toast.success('Phase order updated successfully');
      return true;
    } catch (error) {
      console.error('[PhaseActivationService] Error in reorderActivePhases:', error);
      toast.error('Failed to reorder phases');
      return false;
    }
  }

  /**
   * Standardize phases for a company
   */
  static async standardizePhases(companyId: string): Promise<boolean> {
    try {
      // console.log('[PhaseActivationService] Standardizing phases for company:', companyId);

      const standardPhases = [
        { name: "(01) Concept & Feasibility", description: "Initial concept development and feasibility assessment" },
        { name: "(02) Design Planning", description: "Planning and preparation for design activities" },
        { name: "(03) Design Input", description: "Definition of design requirements and inputs" },
        { name: "(04) Design Output", description: "Creation of design outputs and specifications" },
        { name: "(05) Verification", description: "Verification that design outputs meet design inputs" },
        { name: "(06) Validation (Design, Clinical, Usability)", description: "Validation of the design under actual use conditions" },
        { name: "(07) Design Transfer", description: "Transfer of design to manufacturing" },
        { name: "(08) Design Change Control", description: "Management of design changes throughout lifecycle" },
        { name: "(09) Risk Management", description: "Ongoing risk assessment and management" },
        { name: "(10) Configuration Management", description: "Management of design configuration and versions" },
        { name: "(11) Technical Documentation", description: "Creation and maintenance of technical documentation" },
        { name: "(12) Clinical Evaluation", description: "Clinical assessment and evaluation activities" },
        { name: "(13) Post-Market Surveillance", description: "Ongoing monitoring and surveillance activities" },
        { name: "(14) Design Review", description: "Systematic review of design at key milestones" },
        { name: "(15) Design History File", description: "Compilation and maintenance of design history records" }
      ];

      // Clear existing chosen phases
      await supabase
        .from('company_chosen_phases')
        .delete()
        .eq('company_id', companyId);

      // Create or update phases in the company_phases table and activate ALL of them
      for (let i = 0; i < standardPhases.length; i++) {
        const phaseData = standardPhases[i];

        // Upsert the phase in company_phases table
        const { data: phase, error: phaseError } = await supabase
          .from('company_phases')
          .upsert({
            company_id: companyId,
            name: phaseData.name,
            description: phaseData.description,
            position: i,
            duration_days: 30, // Default duration
            is_active: true
          })
          .select()
          .single();

        if (phaseError) {
          console.error('[PhaseActivationService] Error creating standard phase:', phaseError);
          throw phaseError;
        }

        // THE FIX: Activate ALL phases with proper sequential positioning
        const { error: activationError } = await supabase
          .from('company_chosen_phases')
          .insert({
            company_id: companyId,
            phase_id: phase.id,
            position: i
          });

        if (activationError) {
          console.error('[PhaseActivationService] Error activating standard phase:', activationError);
          throw activationError;
        }
      }

      // console.log('[PhaseActivationService] Successfully standardized phases');
      toast.success(`Standardized and activated all ${standardPhases.length} phases successfully`);
      return true;
    } catch (error) {
      console.error('[PhaseActivationService] Error in standardizePhases:', error);
      toast.error('Failed to standardize phases');
      return false;
    }
  }

  /**
   * Data cleanup for existing orphaned phases
   */
  static async cleanupOrphanedPhases(companyId: string): Promise<{ fixed: number; errors: string[] }> {
    try {
      // console.log('[PhaseActivationService] Cleaning up orphaned phases for company:', companyId);

      // Find phases in company_phases but missing from company_chosen_phases
      const { data: companyPhases, error: phasesError } = await supabase
        .from('company_phases')
        .select('id, name')
        .eq('company_id', companyId)
        .eq('is_active', true);

      if (phasesError) throw phasesError;

      const { data: chosenPhases, error: chosenError } = await supabase
        .from('company_chosen_phases')
        .select('phase_id')
        .eq('company_id', companyId);

      if (chosenError) throw chosenError;

      const chosenPhaseIds = new Set(chosenPhases?.map(cp => cp.phase_id) || []);
      const orphanedPhases = companyPhases?.filter(cp => !chosenPhaseIds.has(cp.id)) || [];

      // console.log(`[PhaseActivationService] Found ${orphanedPhases.length} orphaned phases`);

      let fixed = 0;
      const errors: string[] = [];

      for (const orphanedPhase of orphanedPhases) {
        try {
          const nextPosition = await this.getNextAvailablePosition(companyId);

          const { error: insertError } = await supabase
            .from('company_chosen_phases')
            .insert({
              company_id: companyId,
              phase_id: orphanedPhase.id,
              position: nextPosition
            });

          if (insertError) {
            errors.push(`Failed to fix phase "${orphanedPhase.name}": ${insertError.message}`);
          } else {
            fixed++;
            // console.log(`[PhaseActivationService] Fixed orphaned phase: ${orphanedPhase.name}`);
          }
        } catch (error) {
          errors.push(`Error fixing phase "${orphanedPhase.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      if (fixed > 0) {
        toast.success(`Fixed ${fixed} orphaned phases`);
      }

      if (errors.length > 0) {
        console.error('[PhaseActivationService] Cleanup errors:', errors);
        toast.error(`Failed to fix ${errors.length} phases`);
      }

      return { fixed, errors };
    } catch (error) {
      console.error('[PhaseActivationService] Error in cleanupOrphanedPhases:', error);
      return { fixed: 0, errors: [error instanceof Error ? error.message : 'Unknown cleanup error'] };
    }
  }
}
