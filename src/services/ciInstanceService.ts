import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CIInstance {
  id: string;
  template_id: string;
  company_id: string;
  product_id?: string;
  type: 'audit' | 'gap' | 'document' | 'activity';
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_to?: string;
  due_date?: string;
  instance_config: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by: string;
  // Joined data from template
  template?: {
    title: string;
    template_config: Record<string, any>;
  };
}

export interface CreateCIInstanceData {
  template_id: string;
  company_id: string;
  product_id?: string;
  title?: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assigned_to?: string;
  due_date?: string;
  instance_config?: Record<string, any>;
}

/**
 * Service for managing CI Instances (inherited from templates)
 * Changes to instances DO NOT affect the original templates
 */
export class CIInstanceService {
  /**
   * Create CI instances from company templates for a product
   */
  static async inheritTemplatesForProduct(companyId: string, productId: string, userId: string): Promise<CIInstance[]> {
    // console.log("[CIInstanceService] Inheriting templates for product:", { companyId, productId });

    try {
      // Get all active templates for the company
      const { data: templates, error: templatesError } = await supabase
        .from("ci_templates")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true);

      if (templatesError) {
        console.error("[CIInstanceService] Error fetching templates:", templatesError);
        toast.error("Failed to fetch CI templates");
        return [];
      }

      if (!templates || templates.length === 0) {
        // console.log("[CIInstanceService] No templates found for company");
        return [];
      }

      // Check which templates are already instantiated for this product
      const { data: existingInstances, error: existingError } = await supabase
        .from("ci_instances")
        .select("template_id")
        .eq("product_id", productId);

      if (existingError) {
        console.error("[CIInstanceService] Error checking existing instances:", existingError);
        toast.error("Failed to check existing CI instances");
        return [];
      }

      const existingTemplateIds = new Set(existingInstances?.map(instance => instance.template_id) || []);

      // Filter templates that haven't been instantiated yet
      const templatesToInstantiate = templates.filter(template => !existingTemplateIds.has(template.id));

      if (templatesToInstantiate.length === 0) {
        // console.log("[CIInstanceService] All templates already instantiated for this product");
        toast.info("All CI templates are already inherited for this product");
        return [];
      }

      // Create instances from templates
      const instancesData = templatesToInstantiate.map(template => ({
        template_id: template.id,
        company_id: companyId,
        product_id: productId,
        type: template.type,
        title: template.title,
        description: template.description,
        status: 'pending' as const,
        priority: template.priority,
        instance_config: typeof template.template_config === 'object' && template.template_config !== null ? 
          { ...template.template_config as Record<string, any> } : {}, // Copy template config
        created_by: userId,
      }));

      const { data: instances, error: insertError } = await supabase
        .from("ci_instances")
        .insert(instancesData)
        .select();

      if (insertError) {
        console.error("[CIInstanceService] Error creating instances:", insertError);
        toast.error("Failed to inherit CI templates");
        return [];
      }

      // console.log("[CIInstanceService] Successfully inherited templates:", instances?.length || 0);
      toast.success(`Inherited ${instances?.length || 0} CI templates for product`);
      return (instances || []).map(item => ({
        ...item,
        instance_config: typeof item.instance_config === 'object' ? 
          item.instance_config as Record<string, any> : {}
      })) as CIInstance[];

    } catch (error) {
      console.error("[CIInstanceService] Unexpected error inheriting templates:", error);
      toast.error("An unexpected error occurred while inheriting templates");
      return [];
    }
  }

  /**
   * Get CI instances for a product
   */
  static async getProductInstances(productId: string): Promise<CIInstance[]> {
    // console.log("[CIInstanceService] Fetching instances for product:", productId);

    try {
      const { data, error } = await supabase
        .from("ci_instances")
        .select(`
          *,
          template:ci_templates(title, template_config)
        `)
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[CIInstanceService] Error fetching instances:", error);
        toast.error("Failed to load CI instances");
        return [];
      }

      // console.log("[CIInstanceService] Fetched instances:", data?.length || 0);
      return (data || []).map(item => ({
        ...item,
        instance_config: typeof item.instance_config === 'object' ? 
          item.instance_config as Record<string, any> : {},
        template: item.template ? {
          title: item.template.title,
          template_config: typeof item.template.template_config === 'object' ? 
            item.template.template_config as Record<string, any> : {}
        } : undefined
      })) as CIInstance[];

    } catch (error) {
      console.error("[CIInstanceService] Unexpected error fetching instances:", error);
      toast.error("An unexpected error occurred while loading instances");
      return [];
    }
  }

  /**
   * Get CI instances for a company (across all products)
   */
  static async getCompanyInstances(companyId: string): Promise<CIInstance[]> {
    // console.log("[CIInstanceService] Fetching instances for company:", companyId);

    try {
      const { data, error } = await supabase
        .from("ci_instances")
        .select(`
          *,
          template:ci_templates(title, template_config)
        `)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[CIInstanceService] Error fetching company instances:", error);
        toast.error("Failed to load CI instances");
        return [];
      }

      // console.log("[CIInstanceService] Fetched company instances:", data?.length || 0);
      return (data || []).map(item => ({
        ...item,
        instance_config: typeof item.instance_config === 'object' ? 
          item.instance_config as Record<string, any> : {},
        template: item.template ? {
          title: item.template.title,
          template_config: typeof item.template.template_config === 'object' ? 
            item.template.template_config as Record<string, any> : {}
        } : undefined
      })) as CIInstance[];

    } catch (error) {
      console.error("[CIInstanceService] Unexpected error fetching company instances:", error);
      toast.error("An unexpected error occurred while loading instances");
      return [];
    }
  }

  /**
   * Update a CI instance (does NOT affect the template)
   */
  static async updateInstance(
    instanceId: string, 
    updates: Partial<Omit<CIInstance, 'id' | 'template_id' | 'company_id' | 'created_at' | 'updated_at' | 'created_by'>>
  ): Promise<boolean> {
    // console.log("[CIInstanceService] Updating instance:", instanceId, updates);

    try {
      const { error } = await supabase
        .from("ci_instances")
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq("id", instanceId);

      if (error) {
        console.error("[CIInstanceService] Error updating instance:", error);
        toast.error("Failed to update CI instance");
        return false;
      }

      // console.log("[CIInstanceService] Instance updated successfully");
      toast.success("CI instance updated successfully");
      return true;

    } catch (error) {
      console.error("[CIInstanceService] Unexpected error updating instance:", error);
      toast.error("An unexpected error occurred while updating instance");
      return false;
    }
  }

  /**
   * Delete a CI instance (does NOT affect the template)
   */
  static async deleteInstance(instanceId: string): Promise<boolean> {
    // console.log("[CIInstanceService] Deleting instance:", instanceId);

    try {
      // Check for dependencies first
      const { data: dependencies, error: depError } = await supabase
        .from("ci_dependencies")
        .select("id")
        .or(`source_ci_id.eq.${instanceId},target_ci_id.eq.${instanceId}`)
        .limit(1);

      if (depError) {
        console.error("[CIInstanceService] Error checking dependencies:", depError);
        toast.error("Failed to check CI dependencies");
        return false;
      }

      if (dependencies && dependencies.length > 0) {
        toast.error("Cannot delete CI instance - it has dependencies. Remove dependencies first.");
        return false;
      }

      const { error } = await supabase
        .from("ci_instances")
        .delete()
        .eq("id", instanceId);

      if (error) {
        console.error("[CIInstanceService] Error deleting instance:", error);
        toast.error("Failed to delete CI instance");
        return false;
      }

      // console.log("[CIInstanceService] Instance deleted successfully");
      toast.success("CI instance deleted successfully");
      return true;

    } catch (error) {
      console.error("[CIInstanceService] Unexpected error deleting instance:", error);
      toast.error("An unexpected error occurred while deleting instance");
      return false;
    }
  }

  /**
   * Sync instances with updated templates (preserves instance-specific changes)
   */
  static async syncWithTemplates(productId: string, userId: string): Promise<boolean> {
    // console.log("[CIInstanceService] Syncing instances with templates for product:", productId);

    try {
      // Get product's company
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("company_id")
        .eq("id", productId)
        .single();

      if (productError || !product) {
        console.error("[CIInstanceService] Error fetching product:", productError);
        toast.error("Failed to find product");
        return false;
      }

      // Inherit any new templates
      await this.inheritTemplatesForProduct(product.company_id, productId, userId);

      // console.log("[CIInstanceService] Sync completed successfully");
      return true;

    } catch (error) {
      console.error("[CIInstanceService] Unexpected error syncing with templates:", error);
      toast.error("An unexpected error occurred while syncing");
      return false;
    }
  }

  /**
   * Get instances by status
   */
  static async getInstancesByStatus(
    companyId: string, 
    status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled',
    productId?: string
  ): Promise<CIInstance[]> {
    // console.log("[CIInstanceService] Fetching instances by status:", { companyId, status, productId });

    try {
      let query = supabase
        .from("ci_instances")
        .select(`
          *,
          template:ci_templates(title, template_config)
        `)
        .eq("company_id", companyId)
        .eq("status", status);

      if (productId) {
        query = query.eq("product_id", productId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        console.error("[CIInstanceService] Error fetching instances by status:", error);
        return [];
      }

      return (data || []).map(item => ({
        ...item,
        instance_config: typeof item.instance_config === 'object' ? 
          item.instance_config as Record<string, any> : {},
        template: item.template ? {
          title: item.template.title,
          template_config: typeof item.template.template_config === 'object' ? 
            item.template.template_config as Record<string, any> : {}
        } : undefined
      })) as CIInstance[];

    } catch (error) {
      console.error("[CIInstanceService] Unexpected error fetching instances by status:", error);
      return [];
    }
  }

  /**
   * Get overdue instances
   */
  static async getOverdueInstances(companyId: string, productId?: string): Promise<CIInstance[]> {
    // console.log("[CIInstanceService] Fetching overdue instances:", { companyId, productId });

    try {
      const today = new Date().toISOString().split('T')[0];

      let query = supabase
        .from("ci_instances")
        .select(`
          *,
          template:ci_templates(title, template_config)
        `)
        .eq("company_id", companyId)
        .not("status", "eq", "completed")
        .not("status", "eq", "cancelled")
        .not("due_date", "is", null)
        .lt("due_date", today);

      if (productId) {
        query = query.eq("product_id", productId);
      }

      const { data, error } = await query.order("due_date", { ascending: true });

      if (error) {
        console.error("[CIInstanceService] Error fetching overdue instances:", error);
        return [];
      }

      return (data || []).map(item => ({
        ...item,
        instance_config: typeof item.instance_config === 'object' ? 
          item.instance_config as Record<string, any> : {},
        template: item.template ? {
          title: item.template.title,
          template_config: typeof item.template.template_config === 'object' ? 
            item.template.template_config as Record<string, any> : {}
        } : undefined
      })) as CIInstance[];

    } catch (error) {
      console.error("[CIInstanceService] Unexpected error fetching overdue instances:", error);
      return [];
    }
  }

  /**
   * Create a supplier audit CI instance
   */
  static async createSupplierAuditCI(
    companyId: string,
    supplierId: string,
    supplierName: string,
    supplierCriticality: 'Critical' | 'Non-Critical',
    scopeOfSupply: string,
    userId: string,
    dueDate?: string,
    auditInterval?: string
  ): Promise<CIInstance | null> {
    

    try {
      // Get or create a dummy template ID for supplier audits
      // This bypasses the need for an enabled template in company settings
      let templateId = "dummy-supplier-audit-template";

      // Check if a supplier audit template exists
      const { data: existingTemplate } = await supabase
        .from("ci_templates")
        .select("id")
        .eq("company_id", companyId)
        .eq("type", "audit")
        .ilike("title", "%supplier%audit%")
        .limit(1)
        .single();

      if (existingTemplate) {
        templateId = existingTemplate.id;
      }

      // Determine audit type and configuration based on criticality
      const isCritical = supplierCriticality === 'Critical';
      const auditType = isCritical ? 'Critical Supplier On-Site Audit' : 'Non-Critical Supplier Evaluation';
      const auditorType = isCritical ? 'external' : 'internal';
      const priority = isCritical ? 'high' : 'medium';
      
      // Calculate default due date if not provided
      let calculatedDueDate = dueDate;
      if (!calculatedDueDate) {
        const defaultDays = isCritical ? 30 : 90;
        const future = new Date();
        future.setDate(future.getDate() + defaultDays);
        calculatedDueDate = future.toISOString().split('T')[0];
      }

      // Calculate next audit date based on interval if provided
      let nextAuditDate = calculatedDueDate;
      if (auditInterval && calculatedDueDate) {
        const currentDate = new Date(calculatedDueDate);
        switch (auditInterval) {
          case '6 months':
            currentDate.setMonth(currentDate.getMonth() + 6);
            break;
          case '1 year':
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            break;
          case '2 years':
            currentDate.setFullYear(currentDate.getFullYear() + 2);
            break;
          case '3 years':
            currentDate.setFullYear(currentDate.getFullYear() + 3);
            break;
        }
        nextAuditDate = currentDate.toISOString().split('T')[0];
      }

      const evaluationMethods = isCritical 
        ? ["on_site_inspection", "documentation_review", "process_verification"]
        : ["remote_questionnaire", "certification_verification", "performance_monitoring"];

      const instanceConfig = {
        supplier_id: supplierId,
        supplier_name: supplierName,
        supplier_criticality: supplierCriticality,
        audit_category: auditType,
        scope_of_supply: scopeOfSupply,
        evaluation_methods: evaluationMethods,
        auditor_type: auditorType,
        audit_interval: auditInterval,
        next_audit_date: nextAuditDate,
        regulatory_requirement: isCritical 
          ? "High risk component requires comprehensive verification" 
          : "Low risk to final device allows less intensive evaluation",
        audit_scope: isCritical 
          ? "Quality system, processes, facilities, documentation"
          : "Documentation review, certification status, performance data",
        auto_created: true,
        created_from: "supplier_creation"
      };

      const instanceData = {
        template_id: templateId,
        company_id: companyId,
        product_id: null, // Company-wide audit
        type: 'audit' as const,
        title: `${auditType} - ${supplierName}`,
        description: isCritical 
          ? `Mandatory on-site audit for critical supplier ${supplierName} providing ${scopeOfSupply}. Regulatory compliance requires highest level of assurance.`
          : `Risk-proportionate evaluation for non-critical supplier ${supplierName}. Alternative evaluation methods appropriate for low-risk components.`,
        status: 'pending' as const,
        priority: priority as 'high' | 'medium',
        due_date: calculatedDueDate,
        instance_config: instanceConfig,
        created_by: userId,
      };

      const { data: instance, error } = await supabase
        .from("ci_instances")
        .insert(instanceData)
        .select()
        .single();

      if (error) {
        console.error("[CIInstanceService] Error creating supplier audit CI instance:", error);
        toast.error("Failed to create supplier audit CI instance");
        return null;
      }

      // console.log("[CIInstanceService] Successfully created supplier audit CI instance:", instance.id);
      toast.success(`${auditType} scheduled for ${supplierName}`);
      
      return {
        ...instance,
        instance_config: typeof instance.instance_config === 'object' ? 
          instance.instance_config as Record<string, any> : {}
      } as CIInstance;

    } catch (error) {
      console.error("[CIInstanceService] Unexpected error creating supplier audit CI instance:", error);
      toast.error("An unexpected error occurred while scheduling supplier audit");
      return null;
    }
  }

  /**
   * Update supplier audit CI instance
   */
  static async updateSupplierAuditCI(
    instanceId: string,
    supplierName: string,
    supplierCriticality: 'Critical' | 'Non-Critical',
    scopeOfSupply: string,
    dueDate?: string
  ): Promise<boolean> {
    

    try {
      // Get current instance
      const { data: currentInstance, error: fetchError } = await supabase
        .from("ci_instances")
        .select("instance_config")
        .eq("id", instanceId)
        .single();

      if (fetchError || !currentInstance) {
        console.error("[CIInstanceService] Error fetching current instance:", fetchError);
        return false;
      }

      const currentConfig = typeof currentInstance.instance_config === 'object' 
        ? currentInstance.instance_config as Record<string, any> 
        : {};

      // Update configuration
      const isCritical = supplierCriticality === 'Critical';
      const auditType = isCritical ? 'Critical Supplier On-Site Audit' : 'Non-Critical Supplier Evaluation';
      const priority = isCritical ? 'high' : 'medium';
      
      const evaluationMethods = isCritical 
        ? ["on_site_inspection", "documentation_review", "process_verification"]
        : ["remote_questionnaire", "certification_verification", "performance_monitoring"];

      const updatedConfig = {
        ...currentConfig,
        supplier_name: supplierName,
        supplier_criticality: supplierCriticality,
        audit_category: auditType,
        scope_of_supply: scopeOfSupply,
        evaluation_methods: evaluationMethods,
        auditor_type: isCritical ? 'external' : 'internal',
        regulatory_requirement: isCritical 
          ? "High risk component requires comprehensive verification" 
          : "Low risk to final device allows less intensive evaluation",
        audit_scope: isCritical 
          ? "Quality system, processes, facilities, documentation"
          : "Documentation review, certification status, performance data"
      };

      const updates: any = {
        title: `${auditType} - ${supplierName}`,
        description: isCritical 
          ? `Mandatory on-site audit for critical supplier ${supplierName} providing ${scopeOfSupply}. Regulatory compliance requires highest level of assurance.`
          : `Risk-proportionate evaluation for non-critical supplier ${supplierName}. Alternative evaluation methods appropriate for low-risk components.`,
        priority: priority,
        instance_config: updatedConfig,
        updated_at: new Date().toISOString()
      };

      if (dueDate) {
        updates.due_date = dueDate;
      }

      const { error } = await supabase
        .from("ci_instances")
        .update(updates)
        .eq("id", instanceId);

      if (error) {
        console.error("[CIInstanceService] Error updating supplier audit CI instance:", error);
        toast.error("Failed to update supplier audit");
        return false;
      }

      // console.log("[CIInstanceService] Successfully updated supplier audit CI instance");
      toast.success("Supplier audit updated successfully");
      return true;

    } catch (error) {
      console.error("[CIInstanceService] Unexpected error updating supplier audit CI instance:", error);
      toast.error("An unexpected error occurred while updating supplier audit");
      return false;
    }
  }
}