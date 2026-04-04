import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EnhancedPhase {
  id: string;
  name: string;
  description?: string;
  position: number;
  category_id?: string;
  company_id: string;
  is_predefined_core_phase: boolean;
  is_custom: boolean;
  is_deletable: boolean;
  category_name?: string;
}

export interface PhaseCategory {
  id: string;
  name: string;
  company_id: string;
}

export class EnhancedPhaseDataService {
  /**
   * Check if a position is available in company_chosen_phases (actual display order)
   */
  static async isPositionAvailable(
    companyId: string, 
    position: number, 
    excludePhaseId?: string
  ): Promise<boolean> {
    try {
      // console.log(`[EnhancedPhaseDataService] Checking position availability: ${position} for company: ${companyId}`);
      
      // Check in company_chosen_phases table (actual display positions)
      const { data, error } = await supabase
        .from('company_chosen_phases')
        .select('phase_id, phases!inner(id, name)')
        .eq('company_id', companyId)
        .eq('position', position);

      if (error) {
        console.error('[EnhancedPhaseDataService] Error checking position availability:', error);
        throw new Error(`Database error checking position: ${error.message}`);
      }

      // If excluding a specific phase, filter it out
      const relevantData = excludePhaseId 
        ? (data || []).filter(item => item.phase_id !== excludePhaseId)
        : (data || []);

      const isAvailable = relevantData.length === 0;
      // console.log(`[EnhancedPhaseDataService] Position ${position} available: ${isAvailable}`);
      
      return isAvailable;
    } catch (error) {
      console.error('[EnhancedPhaseDataService] Exception in isPositionAvailable:', error);
      throw error;
    }
  }

  /**
   * Get maximum position from company_chosen_phases (actual display order)
   */
  static async getMaxPosition(companyId: string): Promise<number> {
    try {
      // console.log(`[EnhancedPhaseDataService] Getting max position for company: ${companyId}`);
      
      const { data, error } = await supabase
        .from('company_chosen_phases')
        .select('position')
        .eq('company_id', companyId)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[EnhancedPhaseDataService] Error getting max position:', error);
        throw new Error(`Database error getting max position: ${error.message}`);
      }

      const maxPosition = data?.position || 0;
      // console.log(`[EnhancedPhaseDataService] Max position: ${maxPosition}`);
      return maxPosition;
    } catch (error) {
      console.error('[EnhancedPhaseDataService] Exception in getMaxPosition:', error);
      throw error;
    }
  }

  /**
   * Find existing phase by clean name to avoid duplicates
   */
  static async findPhaseByCleanName(
    companyId: string, 
    cleanName: string
  ): Promise<string | null> {
    try {
      // console.log(`[EnhancedPhaseDataService] Looking for existing phase: "${cleanName}"`);
      
      const { data, error } = await supabase
        .from('company_phases')
        .select('id, name')
        .eq('company_id', companyId)
        .eq('name', cleanName)
        .maybeSingle();

      if (error) {
        console.error('[EnhancedPhaseDataService] Error finding phase by name:', error);
        throw new Error(`Database error finding phase: ${error.message}`);
      }

      if (data) {
        // console.log(`[EnhancedPhaseDataService] Found existing phase: ${data.id}`);
        return data.id;
      }

      // console.log(`[EnhancedPhaseDataService] No existing phase found for: "${cleanName}"`);
      return null;
    } catch (error) {
      console.error('[EnhancedPhaseDataService] Exception in findPhaseByCleanName:', error);
      throw error;
    }
  }

  /**
   * Create custom phase with synchronized position handling
   */
  static async createCustomPhaseWithPosition(
    companyId: string,
    name: string,
    desiredPosition: number,
    description?: string,
    categoryId?: string
  ): Promise<string> {
    try {
      // console.log(`[EnhancedPhaseDataService] Creating custom phase: "${name}" at position ${desiredPosition}`);

      // First check if phase already exists with this name
      const existingPhaseId = await this.findPhaseByCleanName(companyId, name);
      if (existingPhaseId) {
        // console.log(`[EnhancedPhaseDataService] Phase already exists, ensuring it's in chosen phases`);
        await this.addPhaseToActive(companyId, existingPhaseId, desiredPosition);
        return existingPhaseId;
      }

      // Find available position if desired position is taken
      let finalPosition = desiredPosition;
      const isPositionAvailable = await this.isPositionAvailable(companyId, desiredPosition);
      
      if (!isPositionAvailable) {
        const maxPosition = await this.getMaxPosition(companyId);
        finalPosition = maxPosition + 1;
        // console.log(`[EnhancedPhaseDataService] Position ${desiredPosition} taken, using ${finalPosition}`);
      }

      // Create the phase in company_phases table
      const { data: phaseData, error: phaseError } = await supabase
        .from('company_phases')
        .insert({
          company_id: companyId,
          name: name,
          description: description || `Custom phase: ${name}`,
          position: finalPosition, // Set synchronized position
          category_id: categoryId,
          is_custom: true,
          is_predefined_core_phase: false,
          is_deletable: true,
          duration_days: 30 // Default duration
        })
        .select('id')
        .single();

      if (phaseError) {
        console.error('[EnhancedPhaseDataService] Error creating phase:', phaseError);
        throw new Error(`Failed to create phase: ${phaseError.message}`);
      }

      // console.log(`[EnhancedPhaseDataService] Created phase: ${phaseData.id}`);

      // Don't automatically add to company_chosen_phases - leave as available phase
      // console.log(`[EnhancedPhaseDataService] Successfully created phase: ${phaseData.id} (available for activation)`);
      return phaseData.id;

    } catch (error) {
      console.error('[EnhancedPhaseDataService] Exception in createCustomPhaseWithPosition:', error);
      throw error;
    }
  }

  /**
   * Add phase to active phases with specific position
   */
  static async addPhaseToActive(
    companyId: string, 
    phaseId: string, 
    desiredPosition: number
  ): Promise<void> {
    try {
      // console.log(`[EnhancedPhaseDataService] Adding phase ${phaseId} to active at position ${desiredPosition}`);

      // Check if already in chosen phases
      const { data: existing, error: checkError } = await supabase
        .from('company_chosen_phases')
        .select('id, position')
        .eq('company_id', companyId)
        .eq('phase_id', phaseId)
        .maybeSingle();

      if (checkError) {
        console.error('[EnhancedPhaseDataService] Error checking existing chosen phase:', checkError);
        throw new Error(`Database error checking chosen phase: ${checkError.message}`);
      }

      if (existing) {
        // console.log(`[EnhancedPhaseDataService] Phase already in chosen phases at position ${existing.position}`);
        
        // If position is different, update it
        if (existing.position !== desiredPosition) {
          const isAvailable = await this.isPositionAvailable(companyId, desiredPosition, phaseId);
          if (isAvailable) {
            const { error: updateError } = await supabase
              .from('company_chosen_phases')
              .update({ position: desiredPosition })
              .eq('id', existing.id);

            if (updateError) {
              console.error('[EnhancedPhaseDataService] Error updating position:', updateError);
              throw new Error(`Failed to update position: ${updateError.message}`);
            }
            // console.log(`[EnhancedPhaseDataService] Updated position to ${desiredPosition}`);
          }
        }
        return;
      }

      // Find available position if desired is taken
      let finalPosition = desiredPosition;
      const isAvailable = await this.isPositionAvailable(companyId, desiredPosition);
      
      if (!isAvailable) {
        const maxPosition = await this.getMaxPosition(companyId);
        finalPosition = maxPosition + 1;
        // console.log(`[EnhancedPhaseDataService] Position ${desiredPosition} taken, using ${finalPosition}`);
      }

      // Insert into company_chosen_phases
      const { error: insertError } = await supabase
        .from('company_chosen_phases')
        .insert({
          company_id: companyId,
          phase_id: phaseId,
          position: finalPosition
        });

      if (insertError) {
        console.error('[EnhancedPhaseDataService] Error adding to chosen phases:', insertError);
        throw new Error(`Failed to add to chosen phases: ${insertError.message}`);
      }

      // console.log(`[EnhancedPhaseDataService] Added to chosen phases at position ${finalPosition}`);
    } catch (error) {
      console.error('[EnhancedPhaseDataService] Exception in addPhaseToActive:', error);
      throw error;
    }
  }

  /**
   * Update phase with position management
   */
  static async updatePhaseWithPosition(
    phaseId: string,
    name: string,
    position: number,
    description?: string,
    categoryId?: string
  ): Promise<void> {
    try {
      // console.log(`[EnhancedPhaseDataService] Updating phase ${phaseId} with position ${position}`);

      // Update the phase record
      const { error: phaseError } = await supabase
        .from('company_phases')
        .update({
          name,
          description,
          category_id: categoryId,
          position // Keep positions synchronized
        })
        .eq('id', phaseId);

      if (phaseError) {
        console.error('[EnhancedPhaseDataService] Error updating phase:', phaseError);
        throw new Error(`Failed to update phase: ${phaseError.message}`);
      }

      // Update position in company_chosen_phases if it exists
      const { error: chosenError } = await supabase
        .from('company_chosen_phases')
        .update({ position })
        .eq('phase_id', phaseId);

      if (chosenError) {
        console.error('[EnhancedPhaseDataService] Error updating chosen phase position:', chosenError);
        // Don't throw here as the phase update succeeded
      }

      // console.log(`[EnhancedPhaseDataService] Successfully updated phase ${phaseId}`);
    } catch (error) {
      console.error('[EnhancedPhaseDataService] Exception in updatePhaseWithPosition:', error);
      throw error;
    }
  }

  /**
   * Create category
   */
  static async createCategory(companyId: string, name: string): Promise<string> {
    try {
      // console.log(`[EnhancedPhaseDataService] Creating category: "${name}"`);

      const { data, error } = await supabase
        .from('phase_categories')
        .insert({
          company_id: companyId,
          name: name
        })
        .select('id')
        .single();

      if (error) {
        console.error('[EnhancedPhaseDataService] Error creating category:', error);
        throw new Error(`Failed to create category: ${error.message}`);
      }

      // console.log(`[EnhancedPhaseDataService] Created category: ${data.id}`);
      return data.id;
    } catch (error) {
      console.error('[EnhancedPhaseDataService] Exception in createCategory:', error);
      throw error;
    }
  }

  /**
   * Get phases
   */
  static async getPhases(companyId: string): Promise<EnhancedPhase[]> {
    try {
      // console.log(`[EnhancedPhaseDataService] Getting phases for company: ${companyId}`);

      const { data, error } = await supabase
        .from('company_phases')
        .select(`
          id,
          name,
          description,
          position,
          category_id,
          company_id,
          is_predefined_core_phase,
          is_custom,
          is_deletable,
          phase_categories (name)
        `)
        .eq('company_id', companyId)
        .order('position');

      if (error) {
        console.error('[EnhancedPhaseDataService] Error getting phases:', error);
        throw new Error(`Failed to get phases: ${error.message}`);
      }

      const enhancedPhases: EnhancedPhase[] = (data || []).map(phase => ({
        id: phase.id,
        name: phase.name,
        description: phase.description,
        position: phase.position,
        category_id: phase.category_id,
        company_id: phase.company_id,
        is_predefined_core_phase: phase.is_predefined_core_phase,
        is_custom: phase.is_custom,
        is_deletable: phase.is_deletable,
        category_name: phase.phase_categories?.name
      }));

      // console.log(`[EnhancedPhaseDataService] Got ${enhancedPhases.length} phases`);
      return enhancedPhases;
    } catch (error) {
      console.error('[EnhancedPhaseDataService] Exception in getPhases:', error);
      throw error;
    }
  }

  /**
   * Delete phase
   */
  static async deletePhase(phaseId: string): Promise<void> {
    try {
      // console.log(`[EnhancedPhaseDataService] Deleting phase: ${phaseId}`);

      // First, remove from company_chosen_phases
      const { error: chosenError } = await supabase
        .from('company_chosen_phases')
        .delete()
        .eq('phase_id', phaseId);

      if (chosenError) {
        console.error('[EnhancedPhaseDataService] Error removing from chosen phases:', chosenError);
        throw new Error(`Failed to remove from chosen phases: ${chosenError.message}`);
      }

      // Then, delete the phase itself
      const { error: phaseError } = await supabase
        .from('company_phases')
        .delete()
        .eq('id', phaseId);

      if (phaseError) {
        console.error('[EnhancedPhaseDataService] Error deleting phase:', phaseError);
        throw new Error(`Failed to delete phase: ${phaseError.message}`);
      }

      // console.log(`[EnhancedPhaseDataService] Successfully deleted phase: ${phaseId}`);
    } catch (error) {
      console.error('[EnhancedPhaseDataService] Exception in deletePhase:', error);
      throw error;
    }
  }

  /**
   * Get categories
   */
  static async getCategories(companyId: string): Promise<PhaseCategory[]> {
    try {
      // console.log(`[EnhancedPhaseDataService] Getting categories for company: ${companyId}`);

      const { data, error } = await supabase
        .from('phase_categories')
        .select('id, name, company_id')
        .eq('company_id', companyId);

      if (error) {
        console.error('[EnhancedPhaseDataService] Error getting categories:', error);
        throw new Error(`Failed to get categories: ${error.message}`);
      }

      // console.log(`[EnhancedPhaseDataService] Got ${data?.length || 0} categories`);
      return data || [];
    } catch (error) {
      console.error('[EnhancedPhaseDataService] Exception in getCategories:', error);
      throw error;
    }
  }
}
