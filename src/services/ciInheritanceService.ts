import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CITemplateService } from "./ciTemplateService";
import { CIInstanceService } from "./ciInstanceService";

/**
 * Service to manage the inheritance relationship between CI templates and instances
 * Ensures that template changes can be propagated while preserving instance customizations
 */
export class CIInheritanceService {
  /**
   * Auto-inherit CI templates when a product is created
   */
  static async autoInheritForNewProduct(companyId: string, productId: string, userId: string): Promise<boolean> {
    console.log("[CIInheritanceService] Auto-inheriting CIs for new product:", { companyId, productId });

    try {
      // Check if auto-inheritance is enabled for this company (could be a setting)
      const instances = await CIInstanceService.inheritTemplatesForProduct(companyId, productId, userId);
      
      if (instances.length > 0) {
        toast.success(`Automatically inherited ${instances.length} CI templates for new product`);
        return true;
      }

      return false;

    } catch (error) {
      console.error("[CIInheritanceService] Error in auto-inheritance:", error);
      return false;
    }
  }

  /**
   * Bulk inherit templates for multiple products
   */
  static async bulkInheritForProducts(companyId: string, productIds: string[], userId: string): Promise<{
    success: number;
    failed: string[];
    totalInstances: number;
  }> {
    console.log("[CIInheritanceService] Bulk inheriting for products:", { companyId, productIds });

    const result = {
      success: 0,
      failed: [] as string[],
      totalInstances: 0
    };

    try {
      for (const productId of productIds) {
        try {
          const instances = await CIInstanceService.inheritTemplatesForProduct(companyId, productId, userId);
          if (instances.length >= 0) {
            result.success++;
            result.totalInstances += instances.length;
          } else {
            result.failed.push(productId);
          }
        } catch (error) {
          console.error("[CIInheritanceService] Failed to inherit for product:", productId, error);
          result.failed.push(productId);
        }
      }

      if (result.success > 0) {
        toast.success(`Successfully inherited CIs for ${result.success} products (${result.totalInstances} total instances)`);
      }
      
      if (result.failed.length > 0) {
        toast.error(`Failed to inherit CIs for ${result.failed.length} products`);
      }

      return result;

    } catch (error) {
      console.error("[CIInheritanceService] Error in bulk inheritance:", error);
      toast.error("Failed to perform bulk CI inheritance");
      return result;
    }
  }

  /**
   * Check inheritance status for a product
   */
  static async getInheritanceStatus(companyId: string, productId: string): Promise<{
    totalTemplates: number;
    inheritedInstances: number;
    missingTemplates: string[];
    upToDate: boolean;
  }> {
    console.log("[CIInheritanceService] Checking inheritance status:", { companyId, productId });

    try {
      // Get all active templates
      const templates = await CITemplateService.getCompanyTemplates(companyId);
      
      // Get all instances for the product
      const instances = await CIInstanceService.getProductInstances(productId);
      
      const instanceTemplateIds = new Set(instances.map(instance => instance.template_id));
      const missingTemplates = templates
        .filter(template => !instanceTemplateIds.has(template.id))
        .map(template => template.title);

      return {
        totalTemplates: templates.length,
        inheritedInstances: instances.length,
        missingTemplates,
        upToDate: missingTemplates.length === 0
      };

    } catch (error) {
      console.error("[CIInheritanceService] Error checking inheritance status:", error);
      return {
        totalTemplates: 0,
        inheritedInstances: 0,
        missingTemplates: [],
        upToDate: false
      };
    }
  }

  /**
   * Get inheritance analytics for a company
   */
  static async getCompanyInheritanceAnalytics(companyId: string): Promise<{
    totalTemplates: number;
    totalProducts: number;
    productsWithInstances: number;
    averageInstancesPerProduct: number;
    templateUtilization: Array<{
      templateId: string;
      templateTitle: string;
      instanceCount: number;
      utilizationPercentage: number;
    }>;
  }> {
    console.log("[CIInheritanceService] Getting inheritance analytics:", companyId);

    try {
      // Get templates
      const templates = await CITemplateService.getCompanyTemplates(companyId);

      // Get all products for company
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id")
        .eq("company_id", companyId)
        .eq("is_archived", false);

      if (productsError) {
        console.error("[CIInheritanceService] Error fetching products:", productsError);
        return {
          totalTemplates: 0,
          totalProducts: 0,
          productsWithInstances: 0,
          averageInstancesPerProduct: 0,
          templateUtilization: []
        };
      }

      // Get all instances for company
      const instances = await CIInstanceService.getCompanyInstances(companyId);

      // Calculate products with instances
      const productIds = new Set(instances.map(instance => instance.product_id).filter(Boolean));
      const productsWithInstances = productIds.size;

      // Calculate template utilization
      const templateUtilization = templates.map(template => {
        const instanceCount = instances.filter(instance => instance.template_id === template.id).length;
        const utilizationPercentage = products.length > 0 ? (instanceCount / products.length) * 100 : 0;
        
        return {
          templateId: template.id,
          templateTitle: template.title,
          instanceCount,
          utilizationPercentage
        };
      });

      const averageInstancesPerProduct = productsWithInstances > 0 
        ? instances.length / productsWithInstances 
        : 0;

      return {
        totalTemplates: templates.length,
        totalProducts: products.length,
        productsWithInstances,
        averageInstancesPerProduct,
        templateUtilization
      };

    } catch (error) {
      console.error("[CIInheritanceService] Error getting analytics:", error);
      return {
        totalTemplates: 0,
        totalProducts: 0,
        productsWithInstances: 0,
        averageInstancesPerProduct: 0,
        templateUtilization: []
      };
    }
  }

  /**
   * Refresh instances from templates (sync template changes to instances while preserving customizations)
   */
  static async refreshInstancesFromTemplates(
    companyId: string, 
    productId?: string,
    templateIds?: string[]
  ): Promise<{
    updated: number;
    skipped: number;
    errors: number;
  }> {
    console.log("[CIInheritanceService] Refreshing instances from templates:", { companyId, productId, templateIds });

    const result = { updated: 0, skipped: 0, errors: 0 };

    try {
      // Get instances to refresh
      let instances = productId 
        ? await CIInstanceService.getProductInstances(productId)
        : await CIInstanceService.getCompanyInstances(companyId);

      // Filter by template IDs if provided
      if (templateIds && templateIds.length > 0) {
        instances = instances.filter(instance => templateIds.includes(instance.template_id));
      }

      // Get all templates
      const templates = await CITemplateService.getCompanyTemplates(companyId);
      const templateMap = new Map(templates.map(t => [t.id, t]));

      for (const instance of instances) {
        try {
          const template = templateMap.get(instance.template_id);
          if (!template) {
            console.warn("[CIInheritanceService] Template not found for instance:", instance.id);
            result.skipped++;
            continue;
          }

          // Only update if instance hasn't been significantly customized
          const hasCustomizations = (
            instance.title !== template.title ||
            instance.description !== template.description ||
            instance.priority !== template.priority
          );

          if (hasCustomizations) {
            console.log("[CIInheritanceService] Skipping customized instance:", instance.id);
            result.skipped++;
            continue;
          }

          // Update instance with template data, preserving instance-specific fields
          const success = await CIInstanceService.updateInstance(instance.id, {
            title: template.title,
            description: template.description,
            priority: template.priority,
            // Merge configs: template config as base, instance config for overrides
            instance_config: {
              ...template.template_config,
              ...instance.instance_config
            }
          });

          if (success) {
            result.updated++;
          } else {
            result.errors++;
          }

        } catch (error) {
          console.error("[CIInheritanceService] Error updating instance:", instance.id, error);
          result.errors++;
        }
      }

      if (result.updated > 0) {
        toast.success(`Refreshed ${result.updated} CI instances from templates`);
      }
      
      if (result.errors > 0) {
        toast.error(`Failed to refresh ${result.errors} CI instances`);
      }
      
      if (result.skipped > 0) {
        toast.info(`Skipped ${result.skipped} customized CI instances`);
      }

      return result;

    } catch (error) {
      console.error("[CIInheritanceService] Error refreshing instances:", error);
      toast.error("Failed to refresh CI instances from templates");
      return result;
    }
  }
}