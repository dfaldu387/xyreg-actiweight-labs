import { supabase } from '@/integrations/supabase/client';
import { CompanyDocumentTemplate, TemplateFilters, TemplateUploadData } from '@/types/templateManagement';

export class TemplateManagementService {
  /**
   * Fetch company templates with filters
   */
  static async getCompanyTemplates(companyId: string, filters: TemplateFilters = {}): Promise<CompanyDocumentTemplate[]> {
    let query = supabase
      .from('company_document_templates')
      .select('*')
      .eq('company_id', companyId);

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching company templates:', error);
      throw new Error('Failed to fetch company templates');
    }

    return data || [];
  }

  /**
   * Fetch SaaS (default) templates with filters
   */
  static async getSaasTemplates(filters: TemplateFilters = {}): Promise<any[]> {
    let query = supabase
      .from('default_document_templates')
      .select('*');

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching SaaS templates:', error);
      throw new Error('Failed to fetch SaaS templates');
    }

    return data || [];
  }

  /**
   * Create a new company template
   */
  static async createTemplate(companyId: string, templateData: TemplateUploadData): Promise<CompanyDocumentTemplate> {
    const { data, error } = await supabase
      .from('company_document_templates')
      .insert({
        name: templateData.name,
        description: templateData.description,
        document_type: templateData.document_type,
        company_id: companyId,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating template:', error);
      throw new Error('Failed to create template');
    }

    return data;
  }

  /**
   * Update a company template
   */
  static async updateTemplate(templateId: string, updates: Partial<TemplateUploadData & { scope?: 'company' | 'product' | 'both' }>): Promise<CompanyDocumentTemplate> {
    const updateData = {
      name: updates.name,
      description: updates.description,
      document_type: updates.document_type,
      scope: updates.scope,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('company_document_templates')
      .update(updateData)
      .eq('id', templateId)
      .select()
      .single();

    if (error) {
      console.error('Error updating template:', error);
      throw new Error('Failed to update template');
    }

    return data;
  }

  /**
   * Create a company copy of a SaaS template with updates
   */
  static async createCompanyCopyFromSaas(
    companyId: string, 
    saasTemplate: any, 
    updates: Partial<TemplateUploadData & { scope?: 'company' | 'product' | 'both' }>
  ): Promise<CompanyDocumentTemplate> {
    const insertData = {
      company_id: companyId,
      name: updates.name || saasTemplate.name,
      description: updates.description || saasTemplate.description,
      document_type: updates.document_type || saasTemplate.document_type,
      scope: updates.scope || 'company',
      uploaded_by: (await supabase.auth.getUser()).data.user?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      file_name: saasTemplate.file_name,
      file_path: saasTemplate.file_path,
      file_size: saasTemplate.file_size,
      file_type: saasTemplate.file_type,
      public_url: saasTemplate.public_url
    };

    const { data, error } = await supabase
      .from('company_document_templates')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating company template copy:', error);
      throw new Error('Failed to create template copy');
    }

    return data;
  }

  /**
   * Update or create company copy for any template
   */
  static async updateOrCreateTemplate(
    companyId: string,
    template: any,
    updates: Partial<TemplateUploadData & { scope?: 'company' | 'product' | 'both' }>,
    isSaasTemplate: boolean = false
  ): Promise<CompanyDocumentTemplate> {
    if (isSaasTemplate) {
      // Check if a company copy with the same name already exists
      const existingCopy = await this.findExistingCompanyCopy(companyId, template.name);
      
      if (existingCopy) {
        // Update the existing company copy
        return this.updateTemplate(existingCopy.id, updates);
      } else {
        // Create a new company copy
        return this.createCompanyCopyFromSaas(companyId, template, updates);
      }
    } else {
      // Update the existing company template
      return this.updateTemplate(template.id, updates);
    }
  }

  /**
   * Find existing company copy by name
   */
  static async findExistingCompanyCopy(companyId: string, templateName: string): Promise<CompanyDocumentTemplate | null> {
    const { data, error } = await supabase
      .from('company_document_templates')
      .select('*')
      .eq('company_id', companyId)
      .eq('name', templateName)
      .maybeSingle();

    if (error) {
      console.error('Error finding existing company copy:', error);
      return null;
    }

    return data;
  }

  /**
   * Clean up duplicate company templates (keep the most recent one)
   */
  static async cleanupDuplicateTemplates(companyId: string): Promise<{ cleaned: number }> {
    // Get all company templates grouped by name
    const { data: templates, error } = await supabase
      .from('company_document_templates')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching templates for cleanup:', error);
      throw new Error('Failed to fetch templates for cleanup');
    }

    if (!templates) return { cleaned: 0 };

    // Group by name
    const templateGroups = templates.reduce((groups, template) => {
      if (!groups[template.name]) {
        groups[template.name] = [];
      }
      groups[template.name].push(template);
      return groups;
    }, {} as Record<string, any[]>);

    let cleanedCount = 0;

    // For each group with duplicates, keep the most recent and delete others
    for (const [name, templatesInGroup] of Object.entries(templateGroups)) {
      const typedTemplates = templatesInGroup as Array<{ id: string; name: string }>;
      if (typedTemplates.length > 1) {
        // Keep the first (most recent) and delete the rest
        const toDelete = typedTemplates.slice(1);
        
        for (const template of toDelete) {
          const { error: deleteError } = await supabase
            .from('company_document_templates')
            .delete()
            .eq('id', template.id);

          if (!deleteError) {
            cleanedCount++;
          }
        }
      }
    }

    return { cleaned: cleanedCount };
  }

  /**
   * Delete a company template
   */
  static async deleteTemplate(templateId: string): Promise<boolean> {
    const { error } = await supabase
      .from('company_document_templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      console.error('Error deleting template:', error);
      throw new Error('Failed to delete template');
    }

    return true;
  }

  /**
   * Upload file for a template
   */
  static async uploadTemplateFile(templateId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${templateId}.${fileExt}`;
    const filePath = `company-templates/${templateId}/${fileName}`;

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
      .from('company_document_templates')
      .update({
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
      })
      .eq('id', templateId);

    if (updateError) {
      console.error('Error updating template with file info:', updateError);
      throw new Error('Failed to update template with file info');
    }

    return urlData.publicUrl;
  }

  /**
   * Fetch all templates (both company and SaaS)
   */
  static async getAllTemplates(companyId: string, filters: TemplateFilters = {}): Promise<{ companyTemplates: CompanyDocumentTemplate[], saasTemplates: any[] }> {
    const [companyTemplates, saasTemplates] = await Promise.all([
      this.getCompanyTemplates(companyId, filters),
      this.getSaasTemplates(filters),
    ]);

    return {
      companyTemplates: companyTemplates as CompanyDocumentTemplate[],
      saasTemplates: saasTemplates as any[]
    };
  }
}