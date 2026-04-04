import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PhaseCategoryAssignment {
  id: string;
  company_phase_id: string;
  category_id: string;
  created_at: string;
  updated_at: string;
}

export interface PhaseWithCategories {
  id: string;
  name: string;
  description?: string;
  position: number;
  is_active: boolean;
  company_id: string;
  categories: Array<{
    id: string;
    name: string;
    position: number;
  }>;
}

export class PhaseCategoryAssignmentService {
  /**
   * Get all phases with their assigned categories for a company
   */
  static async getPhasesWithCategories(companyId: string): Promise<PhaseWithCategories[]> {
    try {
      console.log('[PhaseCategoryAssignmentService] Loading phases with categories for company:', companyId);

      const { data, error } = await supabase
        .from('company_phases')
        .select(`
          id,
          name,
          description,
          position,
          is_active,
          company_id,
          phase_category_assignments(
            category_id,
            phase_categories(
              id,
              name,
              position
            )
          )
        `)
        .eq('company_id', companyId)
        .order('position');

      if (error) {
        throw error;
      }

      // Transform the data to include categories array
      const phasesWithCategories: PhaseWithCategories[] = (data || []).map(phase => ({
        id: phase.id,
        name: phase.name,
        description: phase.description,
        position: phase.position,
        is_active: phase.is_active,
        company_id: phase.company_id,
        categories: phase.phase_category_assignments?.map((assignment: any) => ({
          id: assignment.phase_categories.id,
          name: assignment.phase_categories.name,
          position: assignment.phase_categories.position
        })) || []
      }));

      console.log(`[PhaseCategoryAssignmentService] Loaded ${phasesWithCategories.length} phases with categories`);
      return phasesWithCategories;
    } catch (error) {
      console.error('[PhaseCategoryAssignmentService] Error loading phases with categories:', error);
      toast.error('Failed to load phases with categories');
      return [];
    }
  }

  /**
   * Assign multiple categories to a phase
   */
  static async assignCategoriesToPhase(companyPhaseId: string, categoryIds: string[]): Promise<boolean> {
    try {
      console.log('[PhaseCategoryAssignmentService] Assigning categories to phase:', { companyPhaseId, categoryIds });

      // First, remove existing assignments
      await this.removeAllCategoriesFromPhase(companyPhaseId);

      // Then add new assignments
      if (categoryIds.length > 0) {
        const assignments = categoryIds.map(categoryId => ({
          company_phase_id: companyPhaseId,
          category_id: categoryId
        }));

        const { error } = await supabase
          .from('phase_category_assignments')
          .insert(assignments);

        if (error) {
          throw error;
        }
      }

      console.log('[PhaseCategoryAssignmentService] Successfully assigned categories to phase');
      return true;
    } catch (error) {
      console.error('[PhaseCategoryAssignmentService] Error assigning categories to phase:', error);
      toast.error('Failed to assign categories to phase');
      return false;
    }
  }

  /**
   * Remove all categories from a phase
   */
  static async removeAllCategoriesFromPhase(companyPhaseId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('phase_category_assignments')
        .delete()
        .eq('company_phase_id', companyPhaseId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('[PhaseCategoryAssignmentService] Error removing categories from phase:', error);
      return false;
    }
  }

  /**
   * Get phases by category
   */
  static async getPhasesByCategory(companyId: string, categoryId: string): Promise<PhaseWithCategories[]> {
    try {
      const { data, error } = await supabase
        .from('company_phases')
        .select(`
          id,
          name,
          description,
          position,
          is_active,
          company_id,
          phase_category_assignments!inner(
            category_id
          )
        `)
        .eq('company_id', companyId)
        .eq('phase_category_assignments.category_id', categoryId)
        .order('position');

      if (error) {
        throw error;
      }

      return (data || []).map(phase => ({
        id: phase.id,
        name: phase.name,
        description: phase.description,
        position: phase.position,
        is_active: phase.is_active,
        company_id: phase.company_id,
        categories: [] // Will be populated by other calls if needed
      }));
    } catch (error) {
      console.error('[PhaseCategoryAssignmentService] Error getting phases by category:', error);
      return [];
    }
  }

  /**
   * Get categories for a specific phase
   */
  static async getCategoriesForPhase(companyPhaseId: string): Promise<Array<{ id: string; name: string; position: number }>> {
    try {
      const { data, error } = await supabase
        .from('phase_category_assignments')
        .select(`
          category_id,
          phase_categories(
            id,
            name,
            position
          )
        `)
        .eq('company_phase_id', companyPhaseId);

      if (error) {
        throw error;
      }

      return (data || []).map(assignment => ({
        id: assignment.phase_categories.id,
        name: assignment.phase_categories.name,
        position: assignment.phase_categories.position
      }));
    } catch (error) {
      console.error('[PhaseCategoryAssignmentService] Error getting categories for phase:', error);
      return [];
    }
  }

  /**
   * Bulk assign phases to a category
   */
  static async assignPhasesToCategory(categoryId: string, companyPhaseIds: string[]): Promise<boolean> {
    try {
      console.log('[PhaseCategoryAssignmentService] Bulk assigning phases to category:', { categoryId, companyPhaseIds });

      const assignments = companyPhaseIds.map(companyPhaseId => ({
        company_phase_id: companyPhaseId,
        category_id: categoryId
      }));

      const { error } = await supabase
        .from('phase_category_assignments')
        .upsert(assignments, { onConflict: 'company_phase_id,category_id' });

      if (error) {
        throw error;
      }

      console.log('[PhaseCategoryAssignmentService] Successfully bulk assigned phases to category');
      toast.success(`Assigned ${companyPhaseIds.length} phases to category`);
      return true;
    } catch (error) {
      console.error('[PhaseCategoryAssignmentService] Error bulk assigning phases to category:', error);
      toast.error('Failed to assign phases to category');
      return false;
    }
  }
}
