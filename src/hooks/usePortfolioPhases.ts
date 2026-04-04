import { useQuery } from '@tanstack/react-query';
import { getPortfolioPhasesData } from '@/services/portfolioPhasesService';
import { EnhancedSunburstNode } from '@/services/portfolioSunburstService';

export function usePortfolioPhases(companyId: string | undefined) {
  return useQuery<EnhancedSunburstNode>({
    queryFn: () => getPortfolioPhasesData(companyId!),
    queryKey: ['portfolio-phases', companyId],
    enabled: !!companyId,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 300 * 1000, // 5 minutes cache time
    retry: 1,
    retryDelay: 2000,
  });
}