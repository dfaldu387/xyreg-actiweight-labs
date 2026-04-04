import { useQuery } from '@tanstack/react-query';
import { TimelineDriftService, DriftResult } from '@/services/timelineDriftService';

export function useTimelineDrift(productId?: string, productName?: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['timeline-drift', productId],
    queryFn: async () => {
      if (!productId || !productName) return null;
      return TimelineDriftService.detectDrift(productId, productName);
    },
    enabled: !!productId && !!productName,
    staleTime: 1000 * 60 * 2,
  });

  return {
    driftResult: data as DriftResult | null,
    driftAlerts: data?.driftAlerts ?? [],
    hasDrift: data?.hasDrift ?? false,
    maxDriftDays: data?.maxDriftDays ?? 0,
    downstreamAtRiskCount: data?.downstreamAtRiskCount ?? 0,
    isLoading,
  };
}
