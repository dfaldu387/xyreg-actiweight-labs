import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BundleRNPVPersistenceService } from '@/services/bundleRNPVPersistenceService';

const persistenceService = new BundleRNPVPersistenceService();

export function useDeleteBundleScenario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (analysisId: string) => persistenceService.deleteScenario(analysisId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bundle-rnpv-scenarios'] });
      queryClient.invalidateQueries({ queryKey: ['bundle-rnpv'] });
    },
  });
}
