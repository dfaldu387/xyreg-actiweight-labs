
import { queryClient } from "@/lib/query-client";
import { supabase } from "@/integrations/supabase/client";

export class ProductUpdateService {
  /**
   * Invalidates all product-related caches for comprehensive updates
   */
  static async invalidateProductCaches(productId: string, companyId?: string) {
    // Invalidate all product-related queries
    await Promise.all([
      // Product details cache
      queryClient.invalidateQueries({ queryKey: ['productDetails', productId] }),
      // Company products cache (for sidebar)
      queryClient.invalidateQueries({ queryKey: ['sidebarCompanyProducts'] }),
      // Simple clients cache (for overall product list)
      queryClient.invalidateQueries({ queryKey: ['simpleClients'] }),
      // Phase-related caches
      queryClient.invalidateQueries({ queryKey: ['companyProductPhases'] }),
      queryClient.invalidateQueries({ queryKey: ['phases', productId] }),
      // Document-related caches
      queryClient.invalidateQueries({ queryKey: ['documents', productId] }),
      // NPV analysis cache
      queryClient.invalidateQueries({ queryKey: ['productNPV', productId] }),
      // Line extensions cache (for platform detection)
      queryClient.invalidateQueries({ queryKey: ['product-line-extensions', productId] }),
      // Timeline and milestones cache
      queryClient.invalidateQueries({ queryKey: ['productTimeline', productId] }),
      // Effective markets cache (for hierarchical market inheritance) - Force refetch
      queryClient.invalidateQueries({ queryKey: ['effective-markets', productId] }),
      queryClient.refetchQueries({ queryKey: ['effective-markets', productId] }),
      // Competitive analysis caches (for EMDN code changes)
      queryClient.invalidateQueries({ queryKey: ['enhanced-competitive-analysis'] }),
      queryClient.invalidateQueries({ queryKey: ['emdn-competitive-stats'] }),
      queryClient.invalidateQueries({ queryKey: ['emdn-code-details'] }),
      queryClient.invalidateQueries({ queryKey: ['fda-device-search'] }),
      queryClient.invalidateQueries({ queryKey: ['combined-competitive-analysis'] }),
    ]);
  }

  /**
   * Updates a product field and handles all cache invalidation
   */
  static async updateProductField(
    productId: string, 
    field: string, 
    value: any, 
    companyId?: string
  ): Promise<void> {
    try {
      // Update the product in the database
      const { error } = await supabase
        .from('products')
        .update({ [field]: value } as any)
        .eq('id', productId);

      if (error) {
        console.error(`❌ [ProductUpdateService] Database error for ${field}:`, error);
        throw error;
      }

      // Invalidate all related caches
      await this.invalidateProductCaches(productId, companyId);

      // Trigger real-time update for sidebar
      if (field === 'name') {
        // Use a small delay to ensure database update is propagated
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['sidebarCompanyProducts'] });
        }, 100);
      }
    } catch (error) {
      console.error(`❌ [ProductUpdateService] Error updating ${field}:`, error);
      throw error;
    }
  }

  /**
   * Forces a refresh of the sidebar product list
   */
  static async refreshSidebarProducts(companyName?: string) {
    // Invalidate sidebar-specific caches
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['sidebarCompanyProducts'] }),
      queryClient.invalidateQueries({ queryKey: ['simpleClients'] }),
    ]);
    
    // Force refetch with fresh data
    await queryClient.refetchQueries({ 
      queryKey: ['sidebarCompanyProducts'],
      type: 'active'
    });
  }

  /**
   * Updates product type and project types, handling special flags and cache invalidation
   */
  static async updateProductType(
    productId: string,
    productType: string,
    projectTypes: string[],
    companyId?: string
  ): Promise<void> {
    try {
      // Prepare update data
      const updateData: any = {
        project_types: projectTypes
      };

      // Set is_line_extension flag based on product type
      if (productType === 'line_extension') {
        updateData.is_line_extension = true;
      } else if (productType !== 'line_extension') {
        updateData.is_line_extension = false;
      }

      // Update the product in the database
      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId);

      if (error) {
        console.error(`❌ [ProductUpdateService] Database error updating product type:`, error);
        throw error;
      }

      // Invalidate all related caches
      await this.invalidateProductCaches(productId, companyId);

      // Additional refresh for type-dependent components
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['sidebarCompanyProducts'] });
        queryClient.invalidateQueries({ queryKey: ['productDetails', productId] });
      }, 100);
    } catch (error) {
      console.error(`❌ [ProductUpdateService] Error updating product type:`, error);
      throw error;
    }
  }
}
