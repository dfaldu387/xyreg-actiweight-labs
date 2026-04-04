import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CITemplate {
  id: string;
  company_id: string;
  type: 'audit' | 'gap' | 'document' | 'activity';
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  template_config: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface CreateCITemplateData {
  company_id: string;
  type: 'audit' | 'gap' | 'document' | 'activity';
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  template_config?: Record<string, any>;
}

/**
 * Service for managing CI Templates at company level
 * These are the master templates that define CIs for inheritance
 */
export class CITemplateService {
  /**
   * Get all CI templates for a company
   */
  static async getCompanyTemplates(companyId: string): Promise<CITemplate[]> {
    console.log("[CITemplateService] Fetching templates for company:", companyId);

    try {
      const { data, error } = await supabase
        .from("ci_templates")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[CITemplateService] Error fetching templates:", error);
        toast.error("Failed to load CI templates");
        return [];
      }

      console.log("[CITemplateService] Fetched templates:", data?.length || 0);
      return (data || []).map(item => ({
        ...item,
        template_config: typeof item.template_config === 'object' ? 
          item.template_config as Record<string, any> : {}
      })) as CITemplate[];

    } catch (error) {
      console.error("[CITemplateService] Unexpected error fetching templates:", error);
      toast.error("An unexpected error occurred while loading templates");
      return [];
    }
  }

  /**
   * Create a new CI template
   */
  static async createTemplate(templateData: CreateCITemplateData, userId: string): Promise<CITemplate | null> {
    console.log("[CITemplateService] Creating template:", templateData);

    try {
      const { data, error } = await supabase
        .from("ci_templates")
        .insert({
          ...templateData,
          template_config: templateData.template_config || {},
          created_by: userId,
        })
        .select()
        .single();

      if (error) {
        console.error("[CITemplateService] Error creating template:", error);
        toast.error("Failed to create CI template");
        return null;
      }

      console.log("[CITemplateService] Template created successfully:", data);
      toast.success("CI template created successfully");
      return {
        ...data,
        template_config: typeof data.template_config === 'object' ? 
          data.template_config as Record<string, any> : {}
      } as CITemplate;

    } catch (error) {
      console.error("[CITemplateService] Unexpected error creating template:", error);
      toast.error("An unexpected error occurred while creating template");
      return null;
    }
  }

  /**
   * Update a CI template
   */
  static async updateTemplate(
    templateId: string, 
    updates: Partial<Omit<CITemplate, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'created_by'>>
  ): Promise<boolean> {
    console.log("[CITemplateService] Updating template:", templateId, updates);

    try {
      const { error } = await supabase
        .from("ci_templates")
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq("id", templateId);

      if (error) {
        console.error("[CITemplateService] Error updating template:", error);
        toast.error("Failed to update CI template");
        return false;
      }

      console.log("[CITemplateService] Template updated successfully");
      toast.success("CI template updated successfully");
      return true;

    } catch (error) {
      console.error("[CITemplateService] Unexpected error updating template:", error);
      toast.error("An unexpected error occurred while updating template");
      return false;
    }
  }

  /**
   * Delete (deactivate) a CI template
   */
  static async deleteTemplate(templateId: string): Promise<boolean> {
    console.log("[CITemplateService] Deleting template:", templateId);

    try {
      // Check if template has any active instances
      const { data: instances, error: checkError } = await supabase
        .from("ci_instances")
        .select("id")
        .eq("template_id", templateId)
        .limit(1);

      if (checkError) {
        console.error("[CITemplateService] Error checking template instances:", checkError);
        toast.error("Failed to check template dependencies");
        return false;
      }

      if (instances && instances.length > 0) {
        toast.error("Cannot delete template - it has active instances in products");
        return false;
      }

      // Deactivate instead of hard delete to preserve data integrity
      const { error } = await supabase
        .from("ci_templates")
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq("id", templateId);

      if (error) {
        console.error("[CITemplateService] Error deleting template:", error);
        toast.error("Failed to delete CI template");
        return false;
      }

      console.log("[CITemplateService] Template deleted successfully");
      toast.success("CI template deleted successfully");
      return true;

    } catch (error) {
      console.error("[CITemplateService] Unexpected error deleting template:", error);
      toast.error("An unexpected error occurred while deleting template");
      return false;
    }
  }

  /**
   * Get templates by type for a company
   */
  static async getTemplatesByType(companyId: string, type: 'audit' | 'gap' | 'document' | 'activity'): Promise<CITemplate[]> {
    console.log("[CITemplateService] Fetching templates by type:", { companyId, type });

    try {
      const { data, error } = await supabase
        .from("ci_templates")
        .select("*")
        .eq("company_id", companyId)
        .eq("type", type)
        .eq("is_active", true)
        .order("title");

      if (error) {
        console.error("[CITemplateService] Error fetching templates by type:", error);
        return [];
      }

      console.log("[CITemplateService] Fetched templates by type:", data?.length || 0);
      return (data || []).map(item => ({
        ...item,
        template_config: typeof item.template_config === 'object' ? 
          item.template_config as Record<string, any> : {}
      })) as CITemplate[];

    } catch (error) {
      console.error("[CITemplateService] Unexpected error fetching templates by type:", error);
      return [];
    }
  }

  /**
   * Duplicate a template
   */
  static async duplicateTemplate(templateId: string, newTitle: string, userId: string): Promise<CITemplate | null> {
    console.log("[CITemplateService] Duplicating template:", templateId, "as:", newTitle);

    try {
      // Get the original template
      const { data: original, error: fetchError } = await supabase
        .from("ci_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (fetchError || !original) {
        console.error("[CITemplateService] Error fetching original template:", fetchError);
        toast.error("Failed to find template to duplicate");
        return null;
      }

      // Create the duplicate
      const { data, error } = await supabase
        .from("ci_templates")
        .insert({
          company_id: original.company_id,
          type: original.type,
          title: newTitle,
          description: `Copy of: ${original.description || original.title}`,
          priority: original.priority,
          template_config: original.template_config,
          created_by: userId,
        })
        .select()
        .single();

      if (error) {
        console.error("[CITemplateService] Error duplicating template:", error);
        toast.error("Failed to duplicate CI template");
        return null;
      }

      console.log("[CITemplateService] Template duplicated successfully");
      toast.success("CI template duplicated successfully");
      return {
        ...data,
        template_config: typeof data.template_config === 'object' ? 
          data.template_config as Record<string, any> : {}
      } as CITemplate;

    } catch (error) {
      console.error("[CITemplateService] Unexpected error duplicating template:", error);
      toast.error("An unexpected error occurred while duplicating template");
      return null;
    }
  }
}