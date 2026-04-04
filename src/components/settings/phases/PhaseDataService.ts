
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Phase {
  id: string;
  name: string;
  description?: string;
  position: number;
  category_id?: string;
  is_custom?: boolean;
  is_deletable?: boolean;
}

export interface Category {
  id: string;
  name: string;
  company_id: string;
}

export class PhaseDataService {
  /**
   * Load all categories for a company
   */
  static async loadCategories(companyId: string): Promise<Category[]> {
    try {
      console.log("PhaseDataService: Loading categories for company:", companyId);
      
      // Ensure detailed design category exists
      const { error: categoryError } = await supabase.rpc('ensure_detailed_design_category', {
        company_id_param: companyId
      });
      
      if (categoryError) {
        console.warn("Error ensuring detailed design category:", categoryError);
      }
      
      const { data: categories, error } = await supabase
        .from('phase_categories')
        .select('*')
        .eq('company_id', companyId)
        .order('name');
      
      if (error) {
        console.error("Error loading categories:", error);
        throw error;
      }
      
      console.log("PhaseDataService: Categories loaded:", categories?.length || 0);
      return categories || [];
    } catch (error) {
      console.error("Error in loadCategories:", error);
      throw error;
    }
  }

  /**
   * Load phases and separate them into active and available
   */
  static async loadPhases(companyId: string): Promise<{
    activePhases: Phase[];
    availablePhases: Phase[];
  }> {
    try {
      console.log("PhaseDataService: Loading phases for company:", companyId);

      // Load all phases for this company
      const { data: allPhases, error: phasesError } = await supabase
        .from('phases')
        .select('*')
        .eq('company_id', companyId)
        .order('position');

      if (phasesError) {
        console.error("Error loading phases:", phasesError);
        throw phasesError;
      }

      // Load active phases (chosen phases) with proper ordering
      const { data: chosenPhases, error: chosenError } = await supabase
        .from('company_chosen_phases')
        .select('phase_id, position')
        .eq('company_id', companyId)
        .order('position');

      if (chosenError) {
        console.error("Error loading chosen phases:", chosenError);
        throw chosenError;
      }

      const activePhaseIds = new Set(chosenPhases?.map(cp => cp.phase_id) || []);
      
      // Create a position map for active phases
      const positionMap = new Map();
      chosenPhases?.forEach(cp => {
        positionMap.set(cp.phase_id, cp.position);
      });

      // Separate active and available phases
      const activePhases: Phase[] = [];
      const availablePhases: Phase[] = [];

      (allPhases || []).forEach(phase => {
        if (activePhaseIds.has(phase.id)) {
          activePhases.push({
            ...phase,
            position: positionMap.get(phase.id) || 0
          });
        } else {
          availablePhases.push(phase);
        }
      });

      // Sort active phases by their position in company_chosen_phases
      activePhases.sort((a, b) => a.position - b.position);

      console.log("PhaseDataService: Active phases:", activePhases.length);
      console.log("PhaseDataService: Available phases:", availablePhases.length);

      return {
        activePhases,
        availablePhases
      };
    } catch (error) {
      console.error("Error in loadPhases:", error);
      throw error;
    }
  }

  /**
   * Reorder active phases with proper numbering
   */
  static async reorderPhases(companyId: string, reorderedPhases: Phase[]): Promise<void> {
    try {
      console.log("PhaseDataService: Reordering phases for company:", companyId);
      
      // Extract phase IDs in the new order
      const phaseIds = reorderedPhases.map(phase => phase.id);
      
      // Use the database function to update both position and numbering
      const { error } = await supabase.rpc('update_phase_numbering_on_reorder', {
        target_company_id: companyId,
        phase_ids: phaseIds
      });

      if (error) {
        console.error("Error reordering phases:", error);
        throw error;
      }

      console.log("PhaseDataService: Phases reordered successfully");
    } catch (error) {
      console.error("Error in reorderPhases:", error);
      throw error;
    }
  }

  /**
   * Get the next available position for a new phase
   */
  static async getNextAvailablePosition(companyId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('company_chosen_phases')
        .select('position')
        .eq('company_id', companyId)
        .order('position', { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error getting next position:", error);
        return 0;
      }

      return (data && data.length > 0) ? data[0].position + 1 : 0;
    } catch (error) {
      console.error("Error in getNextAvailablePosition:", error);
      return 0;
    }
  }

  /**
   * Add a phase to active phases
   */
  static async addPhaseToActive(companyId: string, phaseId: string): Promise<void> {
    try {
      const nextPosition = await this.getNextAvailablePosition(companyId);
      
      const { error } = await supabase
        .from('company_chosen_phases')
        .insert({
          company_id: companyId,
          phase_id: phaseId,
          position: nextPosition
        });

      if (error) {
        console.error("Error adding phase to active:", error);
        throw error;
      }

      // Renumber all phases to ensure consistency
      await this.renumberCompanyPhases(companyId);
    } catch (error) {
      console.error("Error in addPhaseToActive:", error);
      throw error;
    }
  }

  /**
   * Remove a phase from active phases
   */
  static async removePhaseFromActive(companyId: string, phaseId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('company_chosen_phases')
        .delete()
        .eq('company_id', companyId)
        .eq('phase_id', phaseId);

      if (error) {
        console.error("Error removing phase from active:", error);
        throw error;
      }

      // Renumber remaining phases to ensure consistency
      await this.renumberCompanyPhases(companyId);
    } catch (error) {
      console.error("Error in removePhaseFromActive:", error);
      throw error;
    }
  }

  /**
   * Renumber all company phases to ensure consistency
   */
  static async renumberCompanyPhases(companyId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('renumber_company_phases', {
        target_company_id: companyId
      });

      if (error) {
        console.error("Error renumbering company phases:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error in renumberCompanyPhases:", error);
      throw error;
    }
  }
}
