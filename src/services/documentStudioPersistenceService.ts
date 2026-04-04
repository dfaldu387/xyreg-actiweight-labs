import { supabase } from "@/integrations/supabase/client";
import { DocumentTemplate } from "@/types/documentComposer";
import { toast } from "sonner";

export interface DocumentStudioData {
  id?: string;
  company_id: string;
  product_id?: string;
  template_id: string;
  name: string;
  type: string;
  sections: any[];
  product_context?: any;
  document_control?: any;
  revision_history?: any[];
  associated_documents?: any[];
  metadata: any;
  smart_data?: any;
  role_mappings?: any[];
  notes?: any[];
  created_by?: string;
  last_edited_by?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Service for persisting Document Studio data to Supabase
 */
export class DocumentStudioPersistenceService {
  /**
   * Save or update document studio template data
   */
  static async saveTemplate(data: DocumentStudioData): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "User not authenticated" };
      }

      const templateData = {
        ...data,
        last_edited_by: user.id,
        created_by: data.created_by || user.id,
        updated_at: new Date().toISOString()
      };

      if (data.id) {
        // Update existing template
        const { data: updatedData, error } = await supabase
          .from('document_studio_templates')
          .update(templateData)
          .eq('id', data.id)
          .eq('company_id', data.company_id)
          .select()
          .single();

        if (error) {
          console.error('Error updating template:', error);
          return { success: false, error: error.message };
        }

        return { success: true, id: updatedData.id };
      } else {
        // Create new template
        const { data: newData, error } = await supabase
          .from('document_studio_templates')
          .insert(templateData)
          .select()
          .single();

        if (error) {
          console.error('Error creating template:', error);
          return { success: false, error: error.message };
        }

        return { success: true, id: newData.id };
      }
    } catch (error) {
      console.error('Error in saveTemplate:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Load document studio template data
   */
  static async loadTemplate(
    companyId: string, 
    templateId: string, 
    productId?: string
  ): Promise<{ success: boolean; data?: DocumentStudioData; error?: string }> {
    try {
      let query = supabase
        .from('document_studio_templates')
        .select('*')
        .eq('company_id', companyId)
        .eq('template_id', templateId);

      if (productId) {
        query = query.eq('product_id', productId);
      } else {
        query = query.is('product_id', null);
      }

      const { data, error } = await query
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error loading template:', error);
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: true, data: undefined };
      }

      return { 
        success: true, 
        data: data ? {
          ...data,
          sections: Array.isArray(data.sections) ? data.sections : [],
          product_context: data.product_context || undefined,
          document_control: data.document_control || undefined,
          revision_history: Array.isArray(data.revision_history) ? data.revision_history : [],
          associated_documents: Array.isArray(data.associated_documents) ? data.associated_documents : [],
          metadata: data.metadata || {},
          smart_data: data.smart_data || undefined,
          role_mappings: Array.isArray(data.role_mappings) ? data.role_mappings : [],
          notes: Array.isArray(data.notes) ? data.notes : []
        } as DocumentStudioData : undefined
      };
    } catch (error) {
      console.error('Error in loadTemplate:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Save content changes with debouncing
   */
  static async saveContentChange(
    templateId: string,
    contentId: string,
    newContent: string,
    companyId: string,
    fullTemplate: DocumentTemplate,
    productId?: string
  ): Promise<boolean> {
    try {
      // Convert DocumentTemplate to DocumentStudioData format
      const templateData: DocumentStudioData = {
        company_id: companyId,
        product_id: productId,
        template_id: templateId,
        name: fullTemplate.name,
        type: fullTemplate.type,
        sections: fullTemplate.sections,
        product_context: fullTemplate.productContext,
        document_control: fullTemplate.documentControl,
        revision_history: fullTemplate.revisionHistory || [],
        associated_documents: fullTemplate.associatedDocuments || [],
        metadata: fullTemplate.metadata
      };

      // Check if template exists (respect product scope)
      const existingResult = await this.loadTemplate(companyId, templateId, productId);
      
      if (existingResult.success && existingResult.data) {
        // Update existing
        templateData.id = existingResult.data.id;
        const result = await this.saveTemplate(templateData);
        return result.success;
      } else {
        // Create new
        const result = await this.saveTemplate(templateData);
        return result.success;
      }
    } catch (error) {
      console.error('Error saving content change:', error);
      return false;
    }
  }

  /**
   * Auto-save with debouncing
   */
  private static saveTimeouts = new Map<string, NodeJS.Timeout>();
  
  static debouncedSave(
    templateId: string,
    template: DocumentTemplate,
    companyId: string,
    delay: number = 2000
  ): void {
    // Clear existing timeout
    const existingTimeout = this.saveTimeouts.get(templateId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(async () => {
      const templateData: DocumentStudioData = {
        company_id: companyId,
        template_id: templateId,
        name: template.name,
        type: template.type,
        sections: template.sections,
        product_context: template.productContext,
        document_control: template.documentControl,
        revision_history: template.revisionHistory || [],
        associated_documents: template.associatedDocuments || [],
        metadata: template.metadata
      };

      const result = await this.saveTemplate(templateData);
      
      if (result.success) {
        console.log('Auto-saved template:', templateId);
      } else {
        console.error('Auto-save failed:', result.error);
      }
      
      this.saveTimeouts.delete(templateId);
    }, delay);

    this.saveTimeouts.set(templateId, timeout);
  }

  /**
   * Get all templates for a company
   */
  static async getCompanyTemplates(companyId: string): Promise<{ success: boolean; data?: DocumentStudioData[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('document_studio_templates')
        .select('*')
        .eq('company_id', companyId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading company templates:', error);
        return { success: false, error: error.message };
      }

      const mapped = (data || []).map(item => ({
        ...item,
        sections: Array.isArray(item.sections) ? item.sections : [],
        product_context: item.product_context || undefined,
        document_control: item.document_control || undefined,
        revision_history: Array.isArray(item.revision_history) ? item.revision_history : [],
        associated_documents: Array.isArray(item.associated_documents) ? item.associated_documents : [],
        metadata: item.metadata || {},
        smart_data: item.smart_data || undefined,
        role_mappings: Array.isArray(item.role_mappings) ? item.role_mappings : [],
        notes: Array.isArray(item.notes) ? item.notes : []
      } as DocumentStudioData));

      // Deduplicate: keep only the latest version per template_id + name
      const deduped = new Map<string, DocumentStudioData>();
      for (const doc of mapped) {
        const key = `${doc.template_id}::${doc.name}`;
        const existing = deduped.get(key);
        if (!existing || (doc.updated_at && existing.updated_at && doc.updated_at > existing.updated_at)) {
          deduped.set(key, doc);
        }
      }

      return { success: true, data: Array.from(deduped.values()) };
    } catch (error) {
      console.error('Error in getCompanyTemplates:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Sync a saved studio template to a Document CI record in phase_assigned_document_template.
   * Creates or updates a matching record so the document appears in the CI document list.
   */
  static async syncToDocumentCI(params: {
    companyId: string;
    productId?: string;
    phaseId?: string;
    name: string;
    documentReference: string;
    documentScope: 'company_document' | 'product_document';
    htmlContent?: string;
  }): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'User not authenticated' };

      // Resolve phaseId: if not provided, use the "No Phase" placeholder
      let resolvedPhaseId = params.phaseId;
      if (!resolvedPhaseId) {
        const { NoPhaseService } = await import('@/services/noPhaseService');
        resolvedPhaseId = await NoPhaseService.getNoPhaseId(params.companyId) || undefined;
        if (!resolvedPhaseId) {
          return { success: false, error: 'Could not resolve a phase for this document' };
        }
      }

      // Check for existing record by document_reference
      const { data: existing } = await supabase
        .from('phase_assigned_document_template')
        .select('id')
        .eq('company_id', params.companyId)
        .eq('document_reference', params.documentReference)
        .maybeSingle();

      const record: Record<string, any> = {
        company_id: params.companyId,
        name: params.name,
        document_reference: params.documentReference,
        document_scope: params.documentScope,
        document_type: 'Report',
        status: 'Draft',
        updated_at: new Date().toISOString(),
        phase_id: resolvedPhaseId,
      };

      if (params.productId) record.product_id = params.productId;

      if (existing?.id) {
        const { data, error } = await supabase
          .from('phase_assigned_document_template')
          .update(record)
          .eq('id', existing.id)
          .select('id')
          .single();
        if (error) return { success: false, error: error.message };
        return { success: true, id: data.id };
      } else {
        record.created_at = new Date().toISOString();
        const { data, error } = await supabase
          .from('phase_assigned_document_template')
          .insert(record as any)
          .select('id')
          .single();
        if (error) return { success: false, error: error.message };
        return { success: true, id: data.id };
      }
    } catch (error) {
      console.error('Error in syncToDocumentCI:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Delete a template
   */
  static async deleteTemplate(templateId: string, companyId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('document_studio_templates')
        .delete()
        .eq('id', templateId)
        .eq('company_id', companyId);

      if (error) {
        console.error('Error deleting template:', error);
        toast.error('Failed to delete template');
        return false;
      }

      toast.success('Template deleted successfully');
      return true;
    } catch (error) {
      console.error('Error in deleteTemplate:', error);
      toast.error('Failed to delete template');
      return false;
    }
  }
}