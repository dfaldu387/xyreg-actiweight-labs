import { useQuery } from '@tanstack/react-query';
import { ProductBundleService } from '@/services/productBundleService';

export function useProductBundle(productId: string, companyId: string) {
  return useQuery({
    queryKey: ['product-bundle', productId, companyId],
    queryFn: () => ProductBundleService.getProductBundle(productId, companyId),
    enabled: !!productId && !!companyId,
  });
}

export function useProductBundleWithVariants(productId: string, companyId: string) {
  return useQuery({
    queryKey: ['product-bundle-variants', productId, companyId],
    queryFn: () => ProductBundleService.getProductBundleWithVariants(productId, companyId),
    enabled: !!productId && !!companyId,
  });
}

export function useBundleStats(productId: string) {
  return useQuery({
    queryKey: ['bundle-stats', productId],
    queryFn: () => ProductBundleService.getBundleStats(productId),
    enabled: !!productId,
  });
}
