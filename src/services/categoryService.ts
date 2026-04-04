
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CompanyPhaseIsolationService } from "./companyPhaseIsolationService";

export interface PhaseCategory {
  id: string;
  company_id: string;
  name: string;
  position: number;
  created_at: string;
  updated_at: string;
  is_system_category?: boolean;
}

export class CategoryService {
  /**
   * Get all categories for a company with optional filtering and strict isolation
   */
  static async getCompanyCategories(companyId: string, customOnly: boolean = false): Promise<PhaseCategory[]> {
    try {
      

      let query = supabase
        .from('phase_categories')
        .select('*')
        .eq('company_id', companyId); // Strict company isolation

      // Filter for custom categories only if requested
      if (customOnly) {
        query = query.or('is_system_category.is.null,is_system_category.eq.false');
      }

      const { data, error } = await query.order('position');

      if (error) {
        console.error('[CategoryService] Error loading categories:', error);
        throw error;
      }

      // Transform data and ensure company isolation
      const transformedData = (data || [])
        .filter(item => item.company_id === companyId) // Double-check isolation
        .map(item => ({
          id: item.id,
          company_id: item.company_id,
          name: item.name,
          position: item.position,
          created_at: item.created_at,
          updated_at: (item as any).updated_at || item.created_at,
          is_system_category: item.is_system_category || false
        }));

      
      return transformedData;
    } catch (error) {
      console.error('[CategoryService] Error in getCompanyCategories:', error);
      toast.error('Failed to load categories');
      return [];
    }
  }

  /**
   * Create a new custom category with company isolation
   */
  static async createCategory(
    companyId: string,
    name: string
  ): Promise<PhaseCategory | null> {
    try {
      

      const result = await CompanyPhaseIsolationService.createCustomCategory(companyId, name);
      
      if (result.success && result.categoryId) {
        // Return the created category data
        const { data: newCategory, error } = await supabase
          .from('phase_categories')
          .select('*')
          .eq('id', result.categoryId)
          .eq('company_id', companyId) // Ensure isolation
          .single();

        if (error || !newCategory) {
          throw new Error('Failed to retrieve created category');
        }

        return {
          id: newCategory.id,
          company_id: newCategory.company_id,
          name: newCategory.name,
          position: newCategory.position,
          created_at: newCategory.created_at,
          updated_at: (newCategory as any).updated_at || newCategory.created_at,
          is_system_category: newCategory.is_system_category || false
        };
      }

      return null;
    } catch (error) {
      console.error('[CategoryService] Error in createCategory:', error);
      toast.error('Failed to create category');
      return null;
    }
  }

  /**
   * Update a category with ownership validation
   */
  static async updateCategory(
    categoryId: string,
    updates: { name?: string; position?: number },
    companyId?: string
  ): Promise<boolean> {
    try {
      

      // Validate ownership if companyId provided
      if (companyId) {
        const validation = await CompanyPhaseIsolationService.validateCategoryOwnership(categoryId, companyId);
        if (!validation.isValid) {
          toast.error('Cannot update category: ' + validation.errors.join(', '));
          return false;
        }
      }

      const { error } = await supabase
        .from('phase_categories')
        .update(updates)
        .eq('id', categoryId);

      if (error) {
        console.error('[CategoryService] Error updating category:', error);
        throw error;
      }

      // Toast is shown by the calling component
      return true;
    } catch (error) {
      console.error('[CategoryService] Error in updateCategory:', error);
      // Don't show error toast here - let the component handle it
      return false;
    }
  }

  static async deleteCategory(categoryId: string, companyId?: string): Promise<boolean> {
    try {
      

      // Validate ownership if companyId provided
      if (companyId) {
        const validation = await CompanyPhaseIsolationService.validateCategoryOwnership(categoryId, companyId);
        if (!validation.isValid) {
          toast.error('Cannot delete category: ' + validation.errors.join(', '));
          return false;
        }
      }

      // First, update all phases in this category to have no category
      const { error: updateError } = await supabase
        .from('company_phases')
        .update({ category_id: null })
        .eq('category_id', categoryId);

      if (updateError) {
        throw updateError;
      }

      // Then delete the category
      const { error } = await supabase
        .from('phase_categories')
        .delete()
        .eq('id', categoryId);

      if (error) {
        console.error('[CategoryService] Error deleting category:', error);
        throw error;
      }

      // Toast is shown by the calling component
      return true;
    } catch (error) {
      console.error('[CategoryService] Error in deleteCategory:', error);
      // Don't show error toast here - let the component handle it
      return false;
    }
  }

  static async reorderCategories(companyId: string, categoryIds: string[]): Promise<boolean> {
    try {
      

      // Validate all categories belong to the company
      for (const categoryId of categoryIds) {
        const validation = await CompanyPhaseIsolationService.validateCategoryOwnership(categoryId, companyId);
        if (!validation.isValid) {
          toast.error('Cannot reorder categories: Invalid category ownership');
          return false;
        }
      }

      // Update positions in batch
      for (let i = 0; i < categoryIds.length; i++) {
        const { error } = await supabase
          .from('phase_categories')
          .update({ position: i })
          .eq('id', categoryIds[i])
          .eq('company_id', companyId); // Ensure isolation

        if (error) {
          console.error('[CategoryService] Error updating category position:', error);
          throw error;
        }
      }

      
      toast.success('Category order updated successfully');
      return true;
    } catch (error) {
      console.error('[CategoryService] Error in reorderCategories:', error);
      toast.error('Failed to reorder categories');
      return false;
    }
  }
}
