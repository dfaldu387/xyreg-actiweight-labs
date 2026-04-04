import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PMSActivityGenerationService } from '@/services/pmsActivityGenerationService';
import { toast } from 'sonner';
import { getLaunchedMarkets } from '@/utils/launchStatusUtils';

export function useGeneratePMSActivities() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      companyId,
      markets
    }: {
      productId: string;
      companyId: string;
      markets: any[];
    }) => {
      // Pre-validation: check if any markets are launched
      const launchedMarkets = getLaunchedMarkets(markets);
      
      if (launchedMarkets.length === 0) {
        toast.warning('No markets launched yet. Mark markets as "Launched in Market" in Target Markets tab.');
        return {
          success: false,
          created: 0,
          skipped: 0,
          errors: ['No markets have been launched yet']
        };
      }

      return PMSActivityGenerationService.generateActivitiesForProduct(
        productId,
        companyId,
        markets
      );
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['pms-activity-tracking', variables.productId] 
      });

      if (result.errors.length > 0) {
        result.errors.forEach(error => toast.error(error));
      }
    },
    onError: (error) => {
      console.error('Failed to generate PMS activities:', error);
      toast.error('Failed to generate PMS activities');
    }
  });
}

export function useRegeneratePMSActivities() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      companyId,
      markets
    }: {
      productId: string;
      companyId: string;
      markets: any[];
    }) => {
      return PMSActivityGenerationService.regenerateActivitiesForProduct(
        productId,
        companyId,
        markets
      );
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['pms-activity-tracking', variables.productId] 
      });

      if (result.errors.length > 0) {
        result.errors.forEach(error => toast.error(error));
      }
    },
    onError: (error) => {
      console.error('Failed to regenerate PMS activities:', error);
      toast.error('Failed to regenerate PMS activities');
    }
  });
}
