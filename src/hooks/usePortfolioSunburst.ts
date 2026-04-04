import { useQuery } from '@tanstack/react-query';
import { getPortfolioSunburstData, EnhancedSunburstNode } from '@/services/portfolioSunburstService';
import { SunburstNode } from '@/types/charts';
import { VariantFilters, MarketFilters } from '@/components/charts/VariantFilters';

export function usePortfolioSunburst(companyId: string | undefined, filters?: VariantFilters, marketFilters?: MarketFilters) {
  return useQuery<EnhancedSunburstNode>({
    queryFn: () => getPortfolioSunburstData(companyId!, filters, marketFilters),
    queryKey: ['portfolio-sunburst', companyId, filters, marketFilters],
    enabled: !!companyId,
    staleTime: 60 * 1000, // 1 minute - prevent excessive refetching
    gcTime: 300 * 1000, // 5 minutes cache time
    retry: 1, // Reduce retries to prevent loops
    retryDelay: 2000, // Fixed delay instead of exponential backoff
  });
}