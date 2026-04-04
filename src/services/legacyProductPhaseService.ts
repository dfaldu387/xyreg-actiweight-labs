import { supabase } from "@/integrations/supabase/client";
import { detectProductType } from "@/utils/productTypeDetection";
import { toast } from "sonner";

export class LegacyProductPhaseService {
  /**
   * Automatically assign Post-Market Surveillance phase to legacy products
   * CRITICAL: Only updates products that are actually legacy (imported from EUDAMED)
   * NPD/new products should NEVER be marked as launched by this service
   */
  static async assignLegacyProductsToPhase(companyId: string): Promise<{
    success: boolean;
    updatedCount: number;
    products: string[];
  }> {
    try {
      console.log('[LegacyProductPhaseService] Starting legacy product phase assignment for company:', companyId);

      // Fetch all products (we'll filter for legacy products that need phase assignment)
      const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('id, name, project_types, current_lifecycle_phase, launch_status, actual_launch_date, inserted_at')
        .eq('company_id', companyId)
        .eq('is_archived', false);

      if (fetchError) {
        console.error('[LegacyProductPhaseService] Error fetching products:', fetchError);
        throw fetchError;
      }

      if (!products || products.length === 0) {
        console.log('[LegacyProductPhaseService] No products without lifecycle phase found');
        return { success: true, updatedCount: 0, products: [] };
      }

      // Filter for legacy products that need phase assignment
      // (either no phase or wrong phase - legacy products should be in Post-Market Surveillance)
      // CRITICAL: Only process actual legacy products, never NPD products
      const legacyProducts = products.filter(product => {
        const productType = detectProductType(product);
        const isLegacy = productType === 'legacy_product';
        
        // SAFEGUARD: Never process NPD products
        const projectTypes = Array.isArray(product.project_types) ? product.project_types : [];
        if (projectTypes.includes('New Product Development (NPD)')) {
          console.log('[LegacyProductPhaseService] Skipping NPD product:', product.name);
          return false;
        }
        
        const needsPhaseUpdate = !product.current_lifecycle_phase || product.current_lifecycle_phase !== 'Post-Market Surveillance';
        return isLegacy && needsPhaseUpdate;
      });

      if (legacyProducts.length === 0) {
        console.log('[LegacyProductPhaseService] No legacy products found');
        return { success: true, updatedCount: 0, products: [] };
      }

      console.log('[LegacyProductPhaseService] Found legacy products:', legacyProducts.map(p => p.name));

      // Update each legacy product
      const updatedProductNames: string[] = [];
      for (const product of legacyProducts) {
        console.log('[LegacyProductPhaseService] Updating legacy product:', {
          name: product.name,
          currentPhase: product.current_lifecycle_phase,
          currentLaunchStatus: product.launch_status,
          projectTypes: product.project_types
        });
        
        const { error: updateError } = await supabase
          .from('products')
          .update({
            current_lifecycle_phase: 'Post-Market Surveillance',
            launch_status: 'launched',
            actual_launch_date: product.actual_launch_date || product.inserted_at?.split('T')[0] || new Date().toISOString().split('T')[0]
          })
          .eq('id', product.id);

        if (updateError) {
          console.error(`[LegacyProductPhaseService] Error updating product ${product.name}:`, updateError);
        } else {
          updatedProductNames.push(product.name);
          console.log(`[LegacyProductPhaseService] Successfully updated ${product.name} to Post-Market Surveillance with launch_status='launched'`);
        }
      }

      console.log('[LegacyProductPhaseService] Successfully updated', updatedProductNames.length, 'legacy products');
      
      if (updatedProductNames.length > 0) {
        toast.success(`Assigned ${updatedProductNames.length} legacy product${updatedProductNames.length > 1 ? 's' : ''} to Post-Market Surveillance`);
      }

      return {
        success: true,
        updatedCount: updatedProductNames.length,
        products: updatedProductNames
      };
    } catch (error) {
      console.error('[LegacyProductPhaseService] Error in assignLegacyProductsToPhase:', error);
      toast.error('Failed to assign legacy products to phases');
      return {
        success: false,
        updatedCount: 0,
        products: []
      };
    }
  }
}
