import { useQuery } from '@tanstack/react-query';
import { getProductFamilies, FamilySummary } from '@/services/productFamilyService';

/**
 * Hook to fetch all product families for a company
 */
export function useProductFamilies(companyId: string | undefined) {
  return useQuery<FamilySummary[]>({
    queryKey: ['product-families', companyId],
    queryFn: () => {
      if (!companyId) throw new Error('Company ID is required');
      return getProductFamilies(companyId);
    },
    enabled: !!companyId,
  });
}
