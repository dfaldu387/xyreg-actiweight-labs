import { useQuery } from '@tanstack/react-query';
import { aggregateAdvisoryContext } from '@/services/advisoryContextAggregator';

export function useAdvisoryContext(companyId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['advisory-context', companyId],
    queryFn: () => aggregateAdvisoryContext(companyId!),
    enabled: !!companyId && enabled,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000,
  });
}
