
import { useEffect, useCallback } from 'react';
import { CannibalizationImpactService } from '@/services/cannibalizationImpactService';
import { AffectedProduct } from '@/types/affectedProducts';

interface UseCannibalizationTrackingProps {
  productId?: string;
  marketInputData: Record<string, any>;
  enabled?: boolean;
}

export function useCannibalizationTracking({
  productId,
  marketInputData,
  enabled = true
}: UseCannibalizationTrackingProps) {
  const cannibalizationService = new CannibalizationImpactService();

  const updateCannibalizationImpacts = useCallback(async () => {
    if (!productId || !enabled) return;

    try {
      // Extract all affected products from market input data
      const allAffectedProducts: AffectedProduct[] = [];
      
      Object.values(marketInputData).forEach((inputData: any) => {
        if (inputData?.affectedProducts) {
          allAffectedProducts.push(...inputData.affectedProducts);
        }
      });

      if (allAffectedProducts.length > 0) {
        await cannibalizationService.updateCannibalizationImpacts(productId, allAffectedProducts);
        console.log(`[useCannibalizationTracking] Updated impacts for ${allAffectedProducts.length} affected products`);
      }
    } catch (error) {
      console.error('[useCannibalizationTracking] Error updating cannibalization impacts:', error);
    }
  }, [productId, marketInputData, enabled, cannibalizationService]);

  // Update impacts whenever market input data changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateCannibalizationImpacts();
    }, 1000); // Debounce to avoid too frequent updates

    return () => clearTimeout(timeoutId);
  }, [updateCannibalizationImpacts]);

  return {
    updateCannibalizationImpacts
  };
}
