import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CompanyTemplate {
  id: string;
  name: string;
  document_type: string;
  tech_applicability: string | null;
  description: string | null;
  scope?: 'company' | 'product';
  structure?: any; // Template structure from AI analysis
  file_path?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  uploaded_at?: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Simplified service for company document template operations
 * This service specifically handles documents in the phase_assigned_documents table
 * with document_scope = 'company_template'
 */
export class CompanyDocumentTemplateService {
  /**
   * Get all company document templates
   */
  static async getTemplates(companyId: string) {
    console.log("[CompanyDocumentTemplateService] Fetching templates for company:", companyId);

    try {
      const { data, error } = await supabase
        .from("company_document_templates")
        .select("id, name, document_type, tech_applicability, description, scope, structure, file_path, file_name, file_size, file_type, uploaded_at, uploaded_by, created_at, updated_at")
        .eq("company_id", companyId)
        .eq("is_user_removed", false)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[CompanyDocumentTemplateService] Error fetching templates:", error);
        toast.error("Failed to load templates");
        return [];
      }

      console.log("[CompanyDocumentTemplateService] Fetched templates with structure:", data?.length || 0);
      
      // Cast scope values to proper type
      const typedData = (data || []).map(template => ({
        ...template,
        scope: template.scope as 'company' | 'product' | undefined
      }));
      
      return typedData;

    } catch (error) {
      console.error("[CompanyDocumentTemplateService] Unexpected error fetching templates:", error);
      toast.error("An unexpected error occurred while loading templates");
      return [];
    }
  }

  /**
   * Update a company document template with comprehensive error handling
   */
  static async updateTemplate(templateId: string, updates: {
    name?: string;
    document_type?: string;
    tech_applicability?: string;
    description?: string;
    scope?: 'company' | 'product';
    structure?: any;
    file_path?: string;
    file_name?: string;
    file_size?: number;
    file_type?: string;
    uploaded_at?: string;
    uploaded_by?: string;
  }): Promise<boolean> {
    console.log("[CompanyDocumentTemplateService] Starting template update:", {
      templateId,
      updates
    });

    try {
      // First, verify the document exists and is a company template
      console.log("[CompanyDocumentTemplateService] Checking if document exists:", templateId);
      const { data: existingDoc, error: fetchError } = await supabase
        .from("company_document_templates")
        .select("*")
        .eq("id", templateId)
        .eq("is_user_removed", false)
        .maybeSingle();

      if (fetchError) {
        console.error("[CompanyDocumentTemplateService] Database error fetching template:", fetchError);
        toast.error("Database error occurred while fetching template");
        return false;
      }

      if (!existingDoc) {
        console.error("[CompanyDocumentTemplateService] Template not found or not a company template:", templateId);
        // toast.error("Template not found or access denied");
        return false;
      }

      console.log("[CompanyDocumentTemplateService] Found existing template:", existingDoc);

      // Build update object with only changed fields
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.name !== undefined) {
        updateData.name = updates.name.trim();
      }
      if (updates.document_type !== undefined) {
        updateData.document_type = updates.document_type;
      }
      if (updates.tech_applicability !== undefined) {
        updateData.tech_applicability = updates.tech_applicability;
      }
      if (updates.description !== undefined) {
        updateData.description = updates.description?.trim() || null;
      }
      if (updates.scope !== undefined) {
        updateData.scope = updates.scope;
      }
      if (updates.structure !== undefined) {
        updateData.structure = updates.structure;
      }
      if (updates.file_path !== undefined) {
        updateData.file_path = updates.file_path;
      }
      if (updates.file_name !== undefined) {
        updateData.file_name = updates.file_name;
      }
      if (updates.file_size !== undefined) {
        updateData.file_size = updates.file_size;
      }
      if (updates.file_type !== undefined) {
        updateData.file_type = updates.file_type;
      }
      if (updates.uploaded_at !== undefined) {
        updateData.uploaded_at = updates.uploaded_at;
      }
      if (updates.uploaded_by !== undefined) {
        updateData.uploaded_by = updates.uploaded_by;
      }

      console.log("[CompanyDocumentTemplateService] Updating template with data:", updateData);

      // Perform the update
      const { data: updatedData, error: updateError } = await supabase
        .from("company_document_templates")
        .update(updateData)
        .eq("id", templateId)
        .eq("is_user_removed", false)
        .select()
        .single();

      if (updateError) {
        console.error("[CompanyDocumentTemplateService] Update failed:", updateError);
        toast.error(`Failed to update template: ${updateError.message}`);
        return false;
      }

      console.log("[CompanyDocumentTemplateService] Template updated successfully:", updatedData);
      console.log("[CompanyDocumentTemplateService] Updated document_type:", updatedData.document_type);
      toast.success(`Template "${updates.name || existingDoc.name}" updated successfully`);
      return true;

    } catch (error) {
      console.error("[CompanyDocumentTemplateService] Unexpected error:", error);
      toast.error("An unexpected error occurred while updating the template");
      return false;
    }
  }

  /**
   * Delete a company document template
   */
  static async deleteTemplate(templateId: string): Promise<boolean> {
    console.log("[CompanyDocumentTemplateService] Starting template deletion:", templateId);

    try {
      const { error } = await supabase
        .from("company_document_templates")
        .update({ is_user_removed: true })
        .eq("id", templateId)
        .eq("is_user_removed", false);

      if (error) {
        console.error("[CompanyDocumentTemplateService] Delete failed:", error);
        toast.error(`Failed to delete template: ${error.message}`);
        return false;
      }

      console.log("[CompanyDocumentTemplateService] Template deleted successfully");
      toast.success("Template deleted successfully");
      return true;

    } catch (error) {
      console.error("[CompanyDocumentTemplateService] Unexpected error during deletion:", error);
      toast.error("An unexpected error occurred while deleting the template");
      return false;
    }
  }
}