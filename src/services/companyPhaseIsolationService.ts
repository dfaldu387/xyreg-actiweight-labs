import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CompanyPhaseValidation {
  isValid: boolean;
  companyId: string;
  errors: string[];
}

/**
 * Service to ensure strict company-specific isolation for phases and categories
 */
export class CompanyPhaseIsolationService {

  /**
   * Validate that a phase belongs to the specified company
   */
  static async validatePhaseOwnership(phaseId: string, companyId: string): Promise<CompanyPhaseValidation> {
    try {
      const { data: phase, error } = await supabase
        .from('company_phases')
        .select('company_id')
        .eq('id', phaseId)
        .single();

      if (error) {
        return {
          isValid: false,
          companyId,
          errors: ['Phase not found or access denied']
        };
      }

      if (phase.company_id !== companyId) {
        return {
          isValid: false,
          companyId,
          errors: ['Phase does not belong to this company']
        };
      }

      return {
        isValid: true,
        companyId,
        errors: []
      };
    } catch (error) {
      console.error('[CompanyPhaseIsolationService] Error validating phase ownership:', error);
      return {
        isValid: false,
        companyId,
        errors: ['Failed to validate phase ownership']
      };
    }
  }

  /**
   * Validate that a category belongs to the specified company
   */
  static async validateCategoryOwnership(categoryId: string, companyId: string): Promise<CompanyPhaseValidation> {
    try {
      const { data: category, error } = await supabase
        .from('phase_categories')
        .select('company_id')
        .eq('id', categoryId)
        .single();

      if (error) {
        return {
          isValid: false,
          companyId,
          errors: ['Category not found or access denied']
        };
      }

      if (category.company_id !== companyId) {
        return {
          isValid: false,
          companyId,
          errors: ['Category does not belong to this company']
        };
      }

      return {
        isValid: true,
        companyId,
        errors: []
      };
    } catch (error) {
      console.error('[CompanyPhaseIsolationService] Error validating category ownership:', error);
      return {
        isValid: false,
        companyId,
        errors: ['Failed to validate category ownership']
      };
    }
  }

  /**
   * Create a custom phase with strict company isolation
   */
  static async createCustomPhase(
    companyId: string,
    name: string,
    description?: string,
    categoryId?: string,
    is_continuous_process?: boolean,
    subSectionId?: string
  ): Promise<{ success: boolean; phaseId?: string; error?: string }> {
    try {
      console.log('[CompanyPhaseIsolationService] Creating custom phase for company:', companyId);

      // Validate category ownership if provided
      if (categoryId) {
        const categoryValidation = await this.validateCategoryOwnership(categoryId, companyId);
        if (!categoryValidation.isValid) {
          return {
            success: false,
            error: 'Invalid category: ' + categoryValidation.errors.join(', ')
          };
        }
      }
      const { data: existingPhase, error: existingPhaseError } = await supabase
        .from('company_phases')
        .select('id')
        .eq('name', name)
        .eq('company_id', companyId)
        .maybeSingle();
      if (existingPhase) {
        return {
          success: false,
          error: 'Phase name already exists'
        };
      }
      // Get the next position
      const { data: maxPosition } = await supabase
        .from('company_phases')
        .select('position')
        .eq('company_id', companyId)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = (maxPosition?.[0]?.position || 0) + 1;

      // Create the custom phase
      const { data: newPhase, error } = await supabase
        .from('company_phases')
        .insert({
          company_id: companyId,
          name,
          description: description || null,
          category_id: categoryId || null,
          sub_section_id: subSectionId || null,
          duration_days: 30, // Default duration
          position: nextPosition,
          is_active: true,
          is_continuous_process: is_continuous_process || false
        })
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      // console.log('[CompanyPhaseIsolationService] Successfully created custom phase:', newPhase.id);
      return {
        success: true,
        phaseId: newPhase.id
      };
    } catch (error) {
      console.error('[CompanyPhaseIsolationService] Error creating custom phase:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Failed to create custom phase: ' + errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }
  static async createCustomPhaseFromImport(
    companyId: string,
    name: string,
    description?: string,
    categoryId?: string
  ): Promise<{ success: boolean; phaseId?: string; error?: string }> {
    try {
      console.log('[CompanyPhaseIsolationService] Creating custom phase for company:', companyId);
      console.log('[CompanyPhaseIsolationService] Creating custom phase for company:', name);
      console.log('[CompanyPhaseIsolationService] Creating custom phase for company:', description);
      console.log('[CompanyPhaseIsolationService] Creating custom phase for company:', categoryId);
      let categoryIdToUse = null;
      if (categoryId) {
        const { data: category, error } = await supabase
          .from('phase_categories')
          .select('id')
          .eq('name', categoryId)
          .eq('company_id', companyId)
          .maybeSingle();
        if (error) {
          console.log('[CompanyPhaseIsolationService] Error creating custom phase:', error);
        }
        if (category) {
          console.log('[CompanyPhaseIsolationService] Category test 123456:', category.id);
          categoryIdToUse = category.id;
        }
        if (categoryIdToUse === null) {
          const { data: newCategory, error } = await supabase
            .from('phase_categories')
            .insert({
              company_id: companyId,
              name: categoryId,
              is_system_category: true
            })
            .select('id')
            .single();
          if (error) {
            console.log('[CompanyPhaseIsolationService] Error creating custom phase:', error);
          }
          categoryIdToUse = newCategory.id;
        }
      }
      // Get the next position
      const { data: maxPosition } = await supabase
        .from('company_phases')
        .select('position')
        .eq('company_id', companyId)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = (maxPosition?.[0]?.position || 0) + 1;
      // console.log('[CompanyPhaseIsolationService] Next position:', nextPosition);
      // Create the custom phase
      const { data: newPhase, error } = await supabase
        .from('company_phases')
        .insert({
          company_id: companyId,
          name,
          description: description || null,
          category_id: categoryIdToUse || null,
          position: nextPosition,
          duration_days: 30, // Default duration
          is_active: true
        })
        .select('*')
        .single();
      console.log('[CompanyPhaseIsolationService] New phase:', newPhase);
      if (error) {
        console.log('[CompanyPhaseIsolationService] Error creating custom phase:', error);
        throw error;
      }

      // console.log('[CompanyPhaseIsolationService] Successfully created custom phase:', newPhase.id);
      return {
        success: true,
        phaseId: newPhase.id
      };
    } catch (error) {
      console.error('[CompanyPhaseIsolationService] Error creating custom phase:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Failed to create custom phase: ' + errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }
  /**
   * Create a custom category with strict company isolation
   */
  static async createCustomCategory(
    companyId: string,
    name: string
  ): Promise<{ success: boolean; categoryId?: string; error?: string }> {
    try {
      console.log('[CompanyPhaseIsolationService] Creating custom category for company:', companyId);

      // Get the next position
      const { data: maxPosition } = await supabase
        .from('phase_categories')
        .select('position')
        .eq('company_id', companyId)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = (maxPosition?.[0]?.position || 0) + 1;

      // Create the custom category
      const { data: newCategory, error } = await supabase
        .from('phase_categories')
        .insert({
          company_id: companyId,
          name,
          position: nextPosition,
          is_system_category: false // Explicitly mark as custom
        })
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      console.log('[CompanyPhaseIsolationService] Successfully created custom category:', newCategory.id);
      toast.success(`Custom category "${name}" created for your company`);

      return {
        success: true,
        categoryId: newCategory.id
      };
    } catch (error) {
      console.error('[CompanyPhaseIsolationService] Error creating custom category:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Failed to create custom category: ' + errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get company-specific statistics
   */
  static async getCompanyPhaseStats(companyId: string): Promise<{
    totalPhases: number;
    customPhases: number;
    totalCategories: number;
    customCategories: number;
  }> {
    try {
      // Count phases
      const { data: phases } = await supabase
        .from('company_phases')
        .select('id')
        .eq('company_id', companyId);

      // Count categories (system and custom)
      const { data: allCategories } = await supabase
        .from('phase_categories')
        .select('id, is_system_category')
        .eq('company_id', companyId);

      const customCategories = allCategories?.filter(cat => !cat.is_system_category) || [];

      return {
        totalPhases: phases?.length || 0,
        customPhases: phases?.length || 0, // All company_phases are custom to the company
        totalCategories: allCategories?.length || 0,
        customCategories: customCategories.length
      };
    } catch (error) {
      console.error('[CompanyPhaseIsolationService] Error getting company stats:', error);
      return {
        totalPhases: 0,
        customPhases: 0,
        totalCategories: 0,
        customCategories: 0
      };
    }
  }
}
