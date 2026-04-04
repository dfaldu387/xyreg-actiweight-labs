import { EudamedProductImportService } from './eudamedProductImportService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Service to auto-complete development phases when a product is marked as launched.
 * Reuses the existing setupEudamedProductPhases logic which:
 * - Syncs phases from company settings
 * - Backdates all linear phases before launch date (Completed, 100%)
 * - Sets PMS phase as In Progress / current
 */
export class ProductLaunchPhaseService {
  /**
   * Complete all development phases and set PMS as current when a product is launched.
   * Only triggers if this is the first launched market for the product.
   */
  static async completePhasesOnLaunch(
    productId: string,
    companyId: string,
    actualLaunchDate: string
  ): Promise<boolean> {
    try {
      const launchDateStr = actualLaunchDate.split('T')[0]; // Normalize to date only
      
      // Reuse the existing EUDAMED phase setup logic
      await EudamedProductImportService.setupEudamedProductPhases(productId, companyId, launchDateStr);

      // Update product-level fields
      await supabase
        .from('products')
        .update({
          current_lifecycle_phase: 'Post-Market Surveillance',
          launch_status: 'launched',
        })
        .eq('id', productId);

      
      toast.success('Development phases auto-completed for launched product');
      return true;
    } catch (error) {
      console.error('[ProductLaunchPhaseService] Error completing phases:', error);
      toast.error('Failed to auto-complete phases');
      return false;
    }
  }
}
