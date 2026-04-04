import { useQuery } from '@tanstack/react-query';
import { BundleRNPVPersistenceService } from '@/services/bundleRNPVPersistenceService';

const persistenceService = new BundleRNPVPersistenceService();

export function useBundleRNPV(bundleId: string, scenarioName: string = 'Base Case') {
  return useQuery({
    queryKey: ['bundle-rnpv', bundleId, scenarioName],
    queryFn: () => persistenceService.loadBundleAnalysis(bundleId, scenarioName),
    enabled: !!bundleId,
  });
}

export function useBundleScenarios(bundleId: string) {
  return useQuery({
    queryKey: ['bundle-rnpv-scenarios', bundleId],
    queryFn: () => persistenceService.getBundleScenarios(bundleId),
    enabled: !!bundleId,
  });
}
