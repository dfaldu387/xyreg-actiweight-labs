
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PhaseSubSection {
  id: string;
  category_ids: string[];
  company_id: string;
  name: string;
  description?: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export class PhaseSubSectionService {
  /**
   * Get all sub-sections for a category (checks if category is in category_ids array)
   */
  static async getCategorySubSections(categoryId: string, companyId: string): Promise<PhaseSubSection[]> {
    try {
      const { data, error } = await supabase
        .from('phase_sub_sections')
        .select('*')
        .contains('category_ids', [categoryId])
        .eq('company_id', companyId)
        .order('position');

      if (error) {
        console.error('[PhaseSubSectionService] Error loading sub-sections:', error);
        throw error;
      }

      return (data || []).map(item => ({
        id: item.id,
        category_ids: item.category_ids || [],
        company_id: item.company_id,
        name: item.name,
        description: item.description || undefined,
        position: item.position,
        created_at: item.created_at,
        updated_at: item.updated_at || item.created_at
      }));
    } catch (error) {
      console.error('[PhaseSubSectionService] Error in getCategorySubSections:', error);
      return [];
    }
  }

  /**
   * Get all sub-sections for a company (across all categories)
   */
  static async getCompanySubSections(companyId: string): Promise<PhaseSubSection[]> {
    try {
      const { data, error } = await supabase
        .from('phase_sub_sections')
        .select('*')
        .eq('company_id', companyId)
        .order('position');

      if (error) {
        console.error('[PhaseSubSectionService] Error loading company sub-sections:', error);
        throw error;
      }

      return (data || []).map(item => ({
        id: item.id,
        category_ids: item.category_ids || [],
        company_id: item.company_id,
        name: item.name,
        description: item.description || undefined,
        position: item.position,
        created_at: item.created_at,
        updated_at: item.updated_at || item.created_at
      }));
    } catch (error) {
      console.error('[PhaseSubSectionService] Error in getCompanySubSections:', error);
      return [];
    }
  }

  /**
   * Create a new sub-section with category IDs array
   */
  static async createSubSection(
    categoryId: string,
    companyId: string,
    name: string,
    description?: string
  ): Promise<PhaseSubSection | null> {
    try {
      // Get the next position for this company
      const { data: maxPosition } = await supabase
        .from('phase_sub_sections')
        .select('position')
        .eq('company_id', companyId)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = (maxPosition?.[0]?.position || 0) + 1;

      const { data: newSubSection, error } = await supabase
        .from('phase_sub_sections')
        .insert({
          category_ids: [categoryId], // Store as array
          company_id: companyId,
          name,
          description: description || null,
          position: nextPosition
        })
        .select()
        .single();

      if (error || !newSubSection) {
        console.error('[PhaseSubSectionService] Error creating sub-section:', error);
        throw error || new Error('Failed to create sub-section');
      }

      return {
        id: newSubSection.id,
        category_ids: newSubSection.category_ids || [],
        company_id: newSubSection.company_id,
        name: newSubSection.name,
        description: newSubSection.description || undefined,
        position: newSubSection.position,
        created_at: newSubSection.created_at,
        updated_at: newSubSection.updated_at || newSubSection.created_at
      };
    } catch (error) {
      console.error('[PhaseSubSectionService] Error in createSubSection:', error);
      toast.error('Failed to create sub-section');
      return null;
    }
  }

  /**
   * Add a category to a sub-section's category_ids array
   */
  static async addCategoryToSubSection(
    subSectionId: string,
    categoryId: string,
    companyId: string
  ): Promise<boolean> {
    try {
      // Get current category_ids
      const { data: current, error: fetchError } = await supabase
        .from('phase_sub_sections')
        .select('category_ids')
        .eq('id', subSectionId)
        .eq('company_id', companyId)
        .single();

      if (fetchError || !current) {
        throw fetchError || new Error('Sub-section not found');
      }

      const currentIds = current.category_ids || [];
      if (currentIds.includes(categoryId)) {
        return true; // Already has this category
      }

      const { error } = await supabase
        .from('phase_sub_sections')
        .update({ category_ids: [...currentIds, categoryId] })
        .eq('id', subSectionId)
        .eq('company_id', companyId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('[PhaseSubSectionService] Error adding category to sub-section:', error);
      return false;
    }
  }

  /**
   * Remove a category from a sub-section's category_ids array
   */
  static async removeCategoryFromSubSection(
    subSectionId: string,
    categoryId: string,
    companyId: string
  ): Promise<boolean> {
    try {
      // Get current category_ids
      const { data: current, error: fetchError } = await supabase
        .from('phase_sub_sections')
        .select('category_ids')
        .eq('id', subSectionId)
        .eq('company_id', companyId)
        .single();

      if (fetchError || !current) {
        throw fetchError || new Error('Sub-section not found');
      }

      const currentIds = current.category_ids || [];
      const newIds = currentIds.filter((id: string) => id !== categoryId);

      const { error } = await supabase
        .from('phase_sub_sections')
        .update({ category_ids: newIds })
        .eq('id', subSectionId)
        .eq('company_id', companyId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('[PhaseSubSectionService] Error removing category from sub-section:', error);
      return false;
    }
  }

  /**
   * Update a sub-section
   */
  static async updateSubSection(
    subSectionId: string,
    updates: { name?: string; description?: string; position?: number; category_ids?: string[] },
    companyId?: string
  ): Promise<boolean> {
    try {
      let query = supabase
        .from('phase_sub_sections')
        .update(updates)
        .eq('id', subSectionId);

      // Add company isolation if companyId provided
      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { error } = await query;

      if (error) {
        console.error('[PhaseSubSectionService] Error updating sub-section:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('[PhaseSubSectionService] Error in updateSubSection:', error);
      return false;
    }
  }

  /**
   * Delete a sub-section
   */
  static async deleteSubSection(subSectionId: string, companyId?: string): Promise<boolean> {
    try {
      // First, update all phases in this sub-section to have no sub-section
      const { error: updateError } = await supabase
        .from('company_phases')
        .update({ sub_section_id: null })
        .eq('sub_section_id', subSectionId);

      if (updateError) {
        console.error('[PhaseSubSectionService] Error removing phase sub-section references:', updateError);
        // Continue with deletion anyway
      }

      let query = supabase
        .from('phase_sub_sections')
        .delete()
        .eq('id', subSectionId);

      // Add company isolation if companyId provided
      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { error } = await query;

      if (error) {
        console.error('[PhaseSubSectionService] Error deleting sub-section:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('[PhaseSubSectionService] Error in deleteSubSection:', error);
      return false;
    }
  }

  /**
   * Reorder sub-sections within a company
   */
  static async reorderSubSections(
    categoryId: string,
    companyId: string,
    subSectionIds: string[]
  ): Promise<boolean> {
    try {
      // Update positions in batch
      for (let i = 0; i < subSectionIds.length; i++) {
        const { error } = await supabase
          .from('phase_sub_sections')
          .update({ position: i })
          .eq('id', subSectionIds[i])
          .eq('company_id', companyId);

        if (error) {
          console.error('[PhaseSubSectionService] Error updating sub-section position:', error);
          throw error;
        }
      }

      return true;
    } catch (error) {
      console.error('[PhaseSubSectionService] Error in reorderSubSections:', error);
      toast.error('Failed to reorder sub-sections');
      return false;
    }
  }
}
