import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BundleRNPVPersistenceService } from '@/services/bundleRNPVPersistenceService';
import { BundleRNPVCalculationService } from '@/services/bundleRNPVCalculationService';
import { BundleProductInputData } from '@/types/bundleRNPV';

const persistenceService = new BundleRNPVPersistenceService();
const calculationService = new BundleRNPVCalculationService();

export function useSaveBundleRNPV() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bundleId,
      scenarioName,
      currency,
      productInputs,
    }: {
      bundleId: string;
      scenarioName: string;
      currency: string;
      productInputs: BundleProductInputData[];
    }) => {
      // Calculate NPVs for all products
      const { totalBundleNPV, productResults } = calculationService.calculateBundleNPV(productInputs);

      // Prepare data for persistence
      const productInputsWithNPV = productInputs.map((input, index) => ({
        ...input,
        productNPV: productResults[index].npv,
      }));

      // Save to database
      const analysisId = await persistenceService.saveBundleAnalysis(
        bundleId,
        scenarioName,
        currency,
        totalBundleNPV,
        productInputsWithNPV
      );

      return { analysisId, totalBundleNPV, productResults };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bundle-rnpv', variables.bundleId] });
      queryClient.invalidateQueries({ queryKey: ['bundle-rnpv-scenarios', variables.bundleId] });
    },
  });
}
