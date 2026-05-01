import { supabase } from '@/integrations/supabase/client';
import { TemplateUploadData } from '@/types/templateManagement';
import { authService } from '@/services/authService';

export interface SuperAdminTemplate {
  id: string;
  name: string;
  document_type: string;
  description?: string | null;
  tech_applicability?: string | null;
  markets?: any[] | null;
  classes_by_market?: any | null;
  created_at: string;
  updated_at: string;
  file_path?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  file_type?: string | null;
  public_url?: string | null;
  uploaded_at?: string | null;
  uploaded_by?: string | null;
  scope?: string | null;
  template_category?: string | null;
  /** Optional link to FPD catalog entry (Foundation/Pathway/Device-specific). */
  fpd_sop_key?: string | null;
  fpd_tier?: 'foundation' | 'pathway' | 'device_specific' | null;
}

export class SuperAdminTemplateManagementService {
  /**
   * Fetch all SuperAdmin templates (from default_document_templates table)
   */
  static async getAllTemplates(): Promise<SuperAdminTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('default_document_templates' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching SuperAdmin templates:', error);
        throw new Error(`Failed to fetch templates: ${error.message}`);
      }

      return (data as unknown as SuperAdminTemplate[]) || [];
    } catch (error) {
      console.error('Error in getAllTemplates:', error);
      throw error;
    }
  }

  /**
   * Create a new SuperAdmin template
   */
  static async createTemplate(templateData: TemplateUploadData): Promise<SuperAdminTemplate> {
    try {
      // Get current user for uploaded_by field
      const { user } = await authService.getCurrentSession();
      const currentUserId = user?.id || null;

      const insertData: any = {
        name: templateData.name,
        description: templateData.description || '',
        document_type: templateData.document_type || '',
        template_category: templateData.template_category || null,
        scope: templateData.template_scope === 'company-wide' ? 'company' :
          templateData.template_scope === 'product-specific' ? 'product' :
            templateData.template_scope ? 'company' : null,
        tech_applicability: '',
        markets: [],
        classes_by_market: {},
        uploaded_by: currentUserId,
        uploaded_at: new Date().toISOString()
      };

      // Bridge to FPD catalog (optional).
      if (templateData.fpd_sop_key) {
        insertData.fpd_sop_key = templateData.fpd_sop_key;
        insertData.fpd_tier = templateData.fpd_tier ?? null;
      }

      const { data, error } = await supabase
        .from('default_document_templates' as any)
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error creating SuperAdmin template:', error);
        throw new Error(`Failed to create template: ${error.message}`);
      }

      return data as unknown as SuperAdminTemplate;
    } catch (error) {
      console.error('Error in createTemplate:', error);
      throw error;
    }
  }

  /**
   * Update a SuperAdmin template
   */
  static async updateTemplate(templateId: string, updates: Partial<TemplateUploadData>): Promise<SuperAdminTemplate> {
    const updateData: any = {
      name: updates.name,
      description: updates.description,
      document_type: updates.document_type,
      template_category: updates.template_category,
      updated_at: new Date().toISOString()
    };

    // Map template_scope to scope field
    if (updates.template_scope) {
      updateData.scope = updates.template_scope === 'company-wide' ? 'company' :
        updates.template_scope === 'product-specific' ? 'product' :
          updates.template_scope ? 'company' : null;
    }

    // Bridge to FPD catalog (optional). `null` clears the link.
    if (updates.fpd_sop_key !== undefined) {
      updateData.fpd_sop_key = updates.fpd_sop_key;
      updateData.fpd_tier = updates.fpd_tier ?? null;
    }

    const { data, error } = await supabase
      .from('default_document_templates' as any)
      .update(updateData)
      .eq('id', templateId)
      .select()
      .single();

    if (error) {
      console.error('Error updating SuperAdmin template:', error);
      throw new Error('Failed to update template');
    }

    return data as unknown as SuperAdminTemplate;
  }

  /**
   * Delete a SuperAdmin template
   */
  static async deleteTemplate(templateId: string): Promise<boolean> {
    const { error } = await supabase
      .from('default_document_templates' as any)
      .delete()
      .eq('id', templateId);

    if (error) {
      console.error('Error deleting SuperAdmin template:', error);
      throw new Error('Failed to delete template');
    }

    return true;
  }

  /**
   * Upload file for a SuperAdmin template
   */
  static async uploadTemplateFile(templateId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${templateId}.${fileExt}`;
    const filePath = `super-admin-templates/${templateId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw new Error('Failed to upload file');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    // Update template with file information
    const { error: updateError } = await supabase
      .from('default_document_templates' as any)
      .update({
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        public_url: urlData.publicUrl
      })
      .eq('id', templateId);

    if (updateError) {
      console.error('Error updating template with file info:', updateError);
      throw new Error('Failed to update template with file info');
    }

    return urlData.publicUrl;
  }

  /**
   * Download a template file
   */
  static async downloadTemplateFile(filePath: string, fileName: string): Promise<void> {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) {
        console.error('Error downloading file:', error);
        throw new Error('Failed to download file');
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading template file:', error);
      throw new Error('Failed to download template file');
    }
  }

  /**
   * Bulk create multiple templates
   */
  static async bulkCreateTemplates(templatesData: TemplateUploadData[]): Promise<SuperAdminTemplate[]> {
    try {
      const results: SuperAdminTemplate[] = [];
      
      for (const templateData of templatesData) {
        try {
          const template = await this.createTemplate(templateData);
          results.push(template);
        } catch (error) {
          console.error(`Error creating template ${templateData.name}:`, error);
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error in bulk template creation:', error);
      throw error;
    }
  }

  /**
   * Get template statistics
   */
  static async getTemplateStats(): Promise<{
    totalTemplates: number;
    uniqueScopes: number;
    templatesWithFiles: number;
    documentTypes: string[];
    templateCategories: string[];
  }> {
    const templates = await this.getAllTemplates();

    const uniqueScopes = new Set<string>();
    const documentTypes = new Set<string>();
    const templateCategories = new Set<string>();
    let templatesWithFiles = 0;

    templates.forEach(template => {
      if (template.scope) {
        uniqueScopes.add(template.scope);
      }
      if (template.document_type) {
        documentTypes.add(template.document_type);
      }
      if (template.template_category) {
        templateCategories.add(template.template_category);
      }
      if (template.file_path || template.public_url) {
        templatesWithFiles++;
      }
    });

    return {
      totalTemplates: templates.length,
      uniqueScopes: uniqueScopes.size,
      templatesWithFiles,
      documentTypes: Array.from(documentTypes).sort(),
      templateCategories: Array.from(templateCategories).sort()
    };
  }
}

