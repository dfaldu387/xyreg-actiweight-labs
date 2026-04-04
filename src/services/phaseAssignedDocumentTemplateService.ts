import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Service for managing phase assigned document templates
 */
export class PhaseAssignedDocumentTemplateService {
  /**
   * Update a phase assigned document template
   */
  static async updateTemplate(templateId: string, updates: {
    name?: string;
    document_type?: string;
    tech_applicability?: string;
    status?: string;
    tags?: string[];
  }): Promise<boolean> {
    try {
      console.log("PhaseAssignedDocumentTemplateService: Updating template:", templateId, updates);

      // Build update object
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.document_type !== undefined) updateData.document_type = updates.document_type;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.tech_applicability !== undefined) updateData.tech_applicability = updates.tech_applicability;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      
      // Add timestamp
      updateData.updated_at = new Date().toISOString();

      // Normalize template ID (strip any non-UUID prefixes like "template-")
      const normalizedId = typeof templateId === 'string' ? templateId.replace(/^template-/, '') : templateId;

      const { data, error } = await supabase
        .from("phase_assigned_document_template")
        .update(updateData)
        .eq("id", normalizedId)
        .select()
        .single();

      if (error) {
        console.error("PhaseAssignedDocumentTemplateService: Error updating template:", error);
        return false;
      }

      console.log("PhaseAssignedDocumentTemplateService: Template updated successfully:", data);
      toast.success("Document template updated successfully");
      return true;
    } catch (error) {
      console.error("PhaseAssignedDocumentTemplateService: Error in updateTemplate:", error);
      toast.error("Failed to update document template");
      return false;
    }
  }

  /**
   * Check if a document exists in phase_assigned_document_template table
   */
  static async documentExists(templateId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("phase_assigned_document_template")
        .select("id")
        .eq("id", templateId)
        .single();

      return !error && !!data;
    } catch (error) {
      console.error("PhaseAssignedDocumentTemplateService: Error checking document existence:", error);
      return false;
    }
  }
}