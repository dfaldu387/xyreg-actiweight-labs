import { useQuery } from '@tanstack/react-query';

interface ProductRNPV {
  riskAdjustedNPV: number;
  nominalNPV: number;
  combinedLOA: number;
  lastCalculated: string | null;
}

export function useProductRNPV(productId: string | undefined) {
  return useQuery({
    queryKey: ['product-rnpv', productId],
    queryFn: async (): Promise<ProductRNPV> => {
      if (!productId) {
        return {
          riskAdjustedNPV: 0,
          nominalNPV: 0,
          combinedLOA: 0,
          lastCalculated: null
        };
      }

      // Mock data for now - rNPV analysis table may not exist yet
      // Return empty to show "No analysis yet" state
      return {
        riskAdjustedNPV: 0,
        nominalNPV: 0,
        combinedLOA: 0,
        lastCalculated: null
      };
    },
    enabled: !!productId,
    staleTime: 60000
  });
}
