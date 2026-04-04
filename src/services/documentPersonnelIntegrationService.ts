import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PersonnelData {
  name: string;
  email: string;
  phone?: string;
  department?: string;
  role?: string;
  functional_area?: string;
}

export interface ExistingUserOption {
  id: string;
  name: string;
  email: string;
  functional_area?: string;
  current_role?: string;
}

/**
 * Service to integrate Document Studio personnel data with Company User Management
 */
export class DocumentPersonnelIntegrationService {
  
  /**
   * Check if users with similar roles already exist in the company
   */
  static async findExistingUsersForRole(
    companyId: string, 
    roleType: 'quality_assurance' | 'regulatory_affairs' | 'management'
  ): Promise<ExistingUserOption[]> {
    try {
      const functionalAreaMap: Record<string, string[]> = {
        quality_assurance: ['quality_assurance'],
        regulatory_affairs: ['regulatory_affairs'],
        management: ['management_executive']
      };

      const targetAreas = functionalAreaMap[roleType] || [];
      
      // Convert string arrays to the proper enum values
      const validFunctionalAreas = targetAreas.filter(area => 
        ['quality_assurance', 'regulatory_affairs', 'management_executive', 'research_development', 
         'clinical_affairs', 'manufacturing_operations', 'marketing_labeling', 'other_internal'].includes(area)
      ) as ("quality_assurance" | "regulatory_affairs" | "management_executive" | "research_development" | 
          "clinical_affairs" | "manufacturing_operations" | "marketing_labeling" | "other_internal")[];

      const { data, error } = await supabase
        .from('user_company_access')
        .select(`
          user_id,
          access_level,
          functional_area,
          user_profiles!inner(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('company_id', companyId)
        .eq('is_internal', true)
        .in('functional_area', validFunctionalAreas);

      if (error) {
        console.error('Error finding existing users:', error);
        return [];
      }

      return (data || []).map(item => ({
        id: item.user_profiles.id,
        name: `${item.user_profiles.first_name || ''} ${item.user_profiles.last_name || ''}`.trim() || 'Unknown User',
        email: item.user_profiles.email || '',
        functional_area: item.functional_area,
        current_role: item.access_level
      }));
    } catch (error) {
      console.error('Error in findExistingUsersForRole:', error);
      return [];
    }
  }

  /**
   * Save personnel data to company user management system
   */
  static async savePersonnelToCompany(
    companyId: string,
    personnelData: PersonnelData,
    personnelType: 'head_of_qa' | 'department_head' | 'other',
    existingUserId?: string
  ): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      // If selecting existing user, just update their role/department
      if (existingUserId) {
        return await this.updateExistingUserRole(companyId, existingUserId, personnelType, personnelData);
      }

      // Create new user profile and company access
      return await this.createNewUserFromPersonnel(companyId, personnelData, personnelType);
    } catch (error) {
      console.error('Error saving personnel to company:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save personnel data' 
      };
    }
  }

  /**
   * Update existing user's role and department information
   */
  private static async updateExistingUserRole(
    companyId: string,
    userId: string,
    personnelType: 'head_of_qa' | 'department_head' | 'other',
    personnelData: PersonnelData
  ): Promise<{ success: boolean; userId: string; error?: string }> {
    try {
      // Update user_company_access with new functional area if needed
      const functionalAreaMap: Record<string, "quality_assurance" | "regulatory_affairs" | "management_executive" | "research_development" | "clinical_affairs" | "manufacturing_operations" | "marketing_labeling" | "other_internal"> = {
        head_of_qa: 'quality_assurance',
        department_head: 'management_executive',
        other: 'other_internal'
      };

      const accessLevelMap: Record<string, "admin" | "editor" | "viewer" | "consultant" | "business"> = {
        head_of_qa: 'admin',
        department_head: 'editor',
        other: 'editor'
      };

      const { error: accessError } = await supabase
        .from('user_company_access')
        .update({
          functional_area: functionalAreaMap[personnelType],
          access_level: accessLevelMap[personnelType]
        })
        .eq('user_id', userId)
        .eq('company_id', companyId);

      if (accessError) {
        throw new Error(`Failed to update user access: ${accessError.message}`);
      }

      // Update user profile with any new contact information
      const updateData: any = {};
      if (personnelData.phone) {
        // We'd need to add phone field to user_profiles if not exists
        // For now, we'll skip phone updates
      }

      if (Object.keys(updateData).length > 0) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update(updateData)
          .eq('id', userId);

        if (profileError) {
          console.warn('Warning: Failed to update user profile:', profileError.message);
        }
      }

      toast.success(`Updated existing user role for ${personnelData.name}`);
      return { success: true, userId };
    } catch (error) {
      console.error('Error updating existing user role:', error);
      return { 
        success: false, 
        userId,
        error: error instanceof Error ? error.message : 'Failed to update user role' 
      };
    }
  }

  /**
   * Create new user from personnel data
   */
  private static async createNewUserFromPersonnel(
    companyId: string,
    personnelData: PersonnelData,
    personnelType: 'head_of_qa' | 'department_head' | 'other'
  ): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      // Split name into first and last
      const nameParts = personnelData.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Create user profile entry (pending until auth account is created)
      const { data: newProfile, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: personnelData.email,
          id: crypto.randomUUID()
        })
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        return { success: false, error: profileError.message };
      }

      // Create company access record
      const functionalAreaMap: Record<string, "quality_assurance" | "regulatory_affairs" | "management_executive" | "research_development" | "clinical_affairs" | "manufacturing_operations" | "marketing_labeling" | "other_internal"> = {
        head_of_qa: 'quality_assurance',
        department_head: 'management_executive',
        other: 'other_internal'
      };

      const accessLevelMap: Record<string, "admin" | "editor" | "viewer" | "consultant" | "business"> = {
        head_of_qa: 'admin',
        department_head: 'editor',
        other: 'editor'
      };

      const { error: accessError } = await supabase
        .from('user_company_access')
        .insert({
          user_id: newProfile.id,
          company_id: companyId,
          access_level: accessLevelMap[personnelType],
          functional_area: functionalAreaMap[personnelType],
          affiliation_type: 'internal' as const
        });

      if (accessError) {
        console.error('Access creation error:', accessError);
        return { success: false, error: accessError.message };
      }

      // Now save to company organizational data
      const { CompanyDataUpdateService } = await import('./companyDataUpdateService');
      
      const saveResult = await CompanyDataUpdateService.saveCompanyData(companyId, {
        type: 'head_of_qa' as const,
        data: {
          name: personnelData.name,
          email: personnelData.email,
          department: personnelData.department,
          userId: newProfile.id
        }
      });

      if (saveResult && !saveResult.success) {
        console.warn('Failed to save to company data:', saveResult.error);
      }

      toast.success(`Personnel information for ${personnelData.name} has been saved`);
      return { 
        success: true, 
        userId: newProfile.id
      };
    } catch (error) {
      console.error('Error creating new user from personnel:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create new user' 
      };
    }
  }

  /**
   * Get role type from missing data type
   */
  static getRoleTypeFromMissingDataType(missingDataType: string): 'quality_assurance' | 'regulatory_affairs' | 'management' | null {
    const roleMap: Record<string, 'quality_assurance' | 'regulatory_affairs' | 'management'> = {
      'head_of_qa': 'quality_assurance',
      'qa_manager': 'quality_assurance',
      'regulatory_manager': 'regulatory_affairs',
      'department_head': 'management'
    };

    return roleMap[missingDataType] || null;
  }
}