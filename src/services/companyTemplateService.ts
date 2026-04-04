
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DocumentItem } from "@/types/client";

/**
 * Service for managing company document templates in phase_assigned_documents table
 */
export class CompanyTemplateService {
  /**
   * Update a company document template
   */
  static async updateTemplate(templateId: string, updates: Partial<DocumentItem>): Promise<boolean> {
    try {
      console.log("CompanyTemplateService: Updating template:", templateId, updates);

      // Build update object for phase_assigned_documents table
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.type !== undefined) updateData.document_type = updates.type;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.techApplicability !== undefined) updateData.tech_applicability = updates.techApplicability;
      
      // Add timestamp
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from("phase_assigned_documents")
        .update(updateData)
        .eq("id", templateId)
        .eq("document_scope", "company_template");

      if (error) {
        console.error("CompanyTemplateService: Error updating template:", error);
        toast.error("Failed to update document template");
        return false;
      }

      console.log("CompanyTemplateService: Template updated successfully");
      toast.success("Document template updated successfully");
      return true;
    } catch (error) {
      console.error("CompanyTemplateService: Error in updateTemplate:", error);
      toast.error("Failed to update document template");
      return false;
    }
  }

  /**
   * Delete a company document template
   */
  static async deleteTemplate(templateId: string): Promise<boolean> {
    try {
      console.log("CompanyTemplateService: Deleting template:", templateId);

      const { error } = await supabase
        .from("phase_assigned_documents")
        .delete()
        .eq("id", templateId)
        .eq("document_scope", "company_template");

      if (error) {
        console.error("CompanyTemplateService: Error deleting template:", error);
        toast.error("Failed to delete document template");
        return false;
      }

      console.log("CompanyTemplateService: Template deleted successfully");
      toast.success("Document template deleted successfully");
      return true;
    } catch (error) {
      console.error("CompanyTemplateService: Error in deleteTemplate:", error);
      toast.error("Failed to delete document template");
      return false;
    }
  }

  /**
   * Check if a document is a company template
   */
  static async isCompanyTemplate(documentId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("phase_assigned_documents")
        .select("id")
        .eq("id", documentId)
        .eq("document_scope", "company_template")
        .single();

      return !error && !!data;
    } catch (error) {
      console.error("CompanyTemplateService: Error checking template status:", error);
      return false;
    }
  }
}
