import { supabase } from '@/integrations/supabase/client';
import type {
  UserCompanyModuleAccess,
  CreateUserCompanyModuleAccessInput,
  UpdateUserCompanyModuleAccessInput,
} from '@/types/userCompanyModuleAccess';

export class UserCompanyModuleAccessService {
  /**
   * Get module access record for a specific user in a company
   */
  static async getUserModuleAccess(userId: string, companyId: string): Promise<UserCompanyModuleAccess | null> {
    const { data, error } = await supabase
      .from('user_company_module_access')
      .select('*')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch user module access:', error);
      throw new Error(`Failed to fetch user module access: ${error.message}`);
    }

    return data as UserCompanyModuleAccess | null;
  }

  /**
   * Create or update a user-company module access record
   * Checks for existing record first, then updates or inserts
   */
  static async upsertModuleAccess(
    input: CreateUserCompanyModuleAccessInput,
    assignedBy: string | null
  ): Promise<UserCompanyModuleAccess> {
    // Check if an active record exists
    const existing = await this.getUserModuleAccess(input.user_id, input.company_id);

    const dataToSave = {
      ...input,
      assigned_by: assignedBy || input.assigned_by || null,
      assigned_at: existing?.assigned_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      // Update existing record
      const { data, error } = await supabase
        .from('user_company_module_access')
        .update(dataToSave)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Failed to update user module access:', error);
        throw new Error(`Failed to update user module access: ${error.message}`);
      }

      return data as UserCompanyModuleAccess;
    } else {
      // Check if there's an inactive record we should reactivate
      const { data: inactiveRecord } = await supabase
        .from('user_company_module_access')
        .select('*')
        .eq('user_id', input.user_id)
        .eq('company_id', input.company_id)
        .eq('is_active', false)
        .maybeSingle();

      if (inactiveRecord) {
        // Reactivate and update the existing record
        const { data, error } = await supabase
          .from('user_company_module_access')
          .update({
            ...dataToSave,
            is_active: true,
          })
          .eq('id', inactiveRecord.id)
          .select()
          .single();

        if (error) {
          console.error('Failed to reactivate user module access:', error);
          throw new Error(`Failed to reactivate user module access: ${error.message}`);
        }

        return data as UserCompanyModuleAccess;
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('user_company_module_access')
          .insert(dataToSave)
          .select()
          .single();

        if (error) {
          console.error('Failed to create user module access:', error);
          throw new Error(`Failed to create user module access: ${error.message}`);
        }

        return data as UserCompanyModuleAccess;
      }
    }
  }

  /**
   * Update an existing module access record
   */
  static async updateModuleAccess(
    userId: string,
    companyId: string,
    updates: UpdateUserCompanyModuleAccessInput
  ): Promise<UserCompanyModuleAccess | null> {
    const { data, error } = await supabase
      .from('user_company_module_access')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .eq('is_active', true)
      .select()
      .single();

    if (error) {
      console.error('Failed to update module access:', error);
      throw new Error(`Failed to update module access: ${error.message}`);
    }

    return data as UserCompanyModuleAccess | null;
  }

  /**
   * Deactivate module access record (soft delete)
   * This removes restrictions and allows user to access all modules
   */
  static async deactivateModuleAccess(userId: string, companyId: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_company_module_access')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .eq('is_active', true);

    if (error) {
      console.error('Error deactivating module access:', error);
      return false;
    }

    return true;
  }

  /**
   * Check if a user has access to a specific module
   */
  static async hasModuleAccess(userId: string, companyId: string, moduleId: string): Promise<boolean> {
    const access = await this.getUserModuleAccess(userId, companyId);
    
    // If no access record exists or is inactive, user has access to all modules
    if (!access || !access.is_active) {
      return true;
    }

    // If module_ids is empty, user has no access to any modules
    if (!access.module_ids || access.module_ids.length === 0) {
      return false;
    }

    // Check if the specific module is in the allowed list
    return access.module_ids.includes(moduleId);
  }

  /**
   * Get all module IDs that a user has access to
   * Returns null if user has access to all modules (no restrictions)
   */
  static async getUserModuleIds(userId: string, companyId: string): Promise<string[] | null> {
    const access = await this.getUserModuleAccess(userId, companyId);
    
    // If no access record exists or is inactive, user has access to all modules
    if (!access || !access.is_active) {
      return null;
    }

    return access.module_ids || [];
  }

  /**
   * Get all users that have access to a specific module
   */
  static async getModuleUsers(moduleId: string, companyId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('user_company_module_access')
      .select('user_id')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .contains('module_ids', [moduleId]);

    if (error) {
      console.error('Error fetching module users:', error);
      return [];
    }

    return data?.map(m => m.user_id) || [];
  }

  /**
   * Delete module access record permanently
   */
  static async deleteModuleAccess(userId: string, companyId: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_company_module_access')
      .delete()
      .eq('user_id', userId)
      .eq('company_id', companyId);

    if (error) {
      console.error('Error deleting module access:', error);
      return false;
    }

    return true;
  }
}

