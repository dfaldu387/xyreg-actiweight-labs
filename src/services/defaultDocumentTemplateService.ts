import { supabase } from '@/integrations/supabase/client';
import { DefaultCompanyDocumentTemplate, DefaultDocumentTemplateFilters } from '@/types/defaultDocumentTemplateTypes';
import { authService } from '@/services/authService';

export class DefaultDocumentTemplateService {
  /**
   * Fetch all default company document templates
   */
  static async getAllTemplates(): Promise<DefaultCompanyDocumentTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('default_company_document_template')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching default document templates:', error);
        throw new Error(`Failed to fetch default document templates: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllTemplates:', error);
      throw error;
    }
  }

  /**
   * Fetch filtered default company document templates
   */
  static async getFilteredTemplates(filters: DefaultDocumentTemplateFilters): Promise<DefaultCompanyDocumentTemplate[]> {
    try {
      let query = supabase
        .from('default_company_document_template')
        .select('*');

      // Apply search filter
      if (filters.searchTerm) {
        query = query.or(`name.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`);
      }

      // Apply document type filter
      if (filters.documentType && filters.documentType !== 'all') {
        query = query.eq('document_type', filters.documentType);
      }

      // Apply phase filter
      if (filters.phaseId && filters.phaseId !== 'all') {
        query = query.contains('phase_id', [filters.phaseId]);
      }

      const { data, error } = await query.order('name');

      if (error) {
        console.error('Error fetching filtered templates:', error);
        throw new Error(`Failed to fetch filtered templates: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getFilteredTemplates:', error);
      throw error;
    }
  }

  /**
   * Get unique document types
   */
  static async getUniqueDocumentTypes(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('default_company_document_template')
        .select('document_type')
        .not('document_type', 'is', null);

      if (error) {
        console.error('Error fetching document types:', error);
        throw new Error(`Failed to fetch document types: ${error.message}`);
      }

      const uniqueTypes = [...new Set(data?.map(item => item.document_type).filter(Boolean))];
      return uniqueTypes.sort();
    } catch (error) {
      console.error('Error in getUniqueDocumentTypes:', error);
      return [];
    }
  }

  /**
   * Get unique phases associated with templates
   */
  static async getUniquePhases(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('default_company_document_template')
        .select('phase_id')
        .not('phase_id', 'is', null);

      if (error) {
        console.error('Error fetching phases:', error);
        throw new Error(`Failed to fetch phases: ${error.message}`);
      }

      const allPhaseIds = new Set<string>();
      data?.forEach(item => {
        if (Array.isArray(item.phase_id)) {
          item.phase_id.forEach(phaseId => allPhaseIds.add(phaseId));
        }
      });

      return Array.from(allPhaseIds).sort();
    } catch (error) {
      console.error('Error in getUniquePhases:', error);
      return [];
    }
  }

  /**
   * Get template by ID
   */
  static async getTemplateById(id: string): Promise<DefaultCompanyDocumentTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('default_company_document_template')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching template by ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getTemplateById:', error);
      return null;
    }
  }

  /**
   * Create a new default document template
   */
  static async createTemplate(templateData: {
    name: string;
    description?: string | null;
    document_type?: string | null;
    phase_id?: string[] | null;
    file_path?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    file_type?: string | null;
    public_url?: string | null;
  }): Promise<DefaultCompanyDocumentTemplate | null> {
    try {
      // Get current user for updated_by field
      const { user } = await authService.getCurrentSession();
      const currentUserId = user?.id || null;

      const insertData: any = {
        name: templateData.name,
        description: templateData.description || null,
        document_type: templateData.document_type || 'Standard',
        phase_id: templateData.phase_id || null,
        file_path: templateData.file_path || null,
        file_name: templateData.file_name || null,
        file_size: templateData.file_size || null,
        file_type: templateData.file_type || null,
        public_url: templateData.public_url || null,
        updated_by: currentUserId
      };

      // Set uploaded_at if file is provided
      if (templateData.file_path || templateData.file_name) {
        insertData.uploaded_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('default_company_document_template')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error creating default document template:', error);
        throw new Error(`Failed to create template: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in createTemplate:', error);
      throw error;
    }
  }

  /**
   * Update an existing default document template
   */
  static async updateTemplate(id: string, templateData: {
    name: string;
    description?: string | null;
    document_type?: string | null;
    phase_id?: string[] | null;
    file_path?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    file_type?: string | null;
    public_url?: string | null;
  }): Promise<DefaultCompanyDocumentTemplate | null> {
    try {
      // Get current user for updated_by field
      const { user } = await authService.getCurrentSession();
      const currentUserId = user?.id || null;

      const updateData: any = {
        name: templateData.name,
        description: templateData.description || null,
        document_type: templateData.document_type || 'Standard',
        phase_id: templateData.phase_id || null,
        file_path: templateData.file_path || null,
        file_name: templateData.file_name || null,
        file_size: templateData.file_size || null,
        file_type: templateData.file_type || null,
        public_url: templateData.public_url || null,
        updated_by: currentUserId,
        updated_at: new Date().toISOString()
      };

      // Set uploaded_at if file is provided
      if (templateData.file_path || templateData.file_name) {
        updateData.uploaded_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('default_company_document_template')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating default document template:', error);
        throw new Error(`Failed to update template: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in updateTemplate:', error);
      throw error;
    }
  }

  /**
   * Delete a default document template
   */
  static async deleteTemplate(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('default_company_document_template')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting default document template:', error);
        throw new Error(`Failed to delete template: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error in deleteTemplate:', error);
      throw error;
    }
  }
}
