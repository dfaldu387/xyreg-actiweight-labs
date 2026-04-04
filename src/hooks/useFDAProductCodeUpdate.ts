import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fdaProductCodeUpdateService, FDAProductCodeUpdateResponse } from '@/services/fdaProductCodeUpdateService';
import { toast } from 'sonner';

export function useFDAProductCodeUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, newFdaCode }: { productId: string; newFdaCode: string }): Promise<FDAProductCodeUpdateResponse> =>
      fdaProductCodeUpdateService.updateProductFDACode(productId, newFdaCode),
    onSuccess: (data, variables) => {
      if (data.success) {
        toast.success(`FDA product code updated to ${variables.newFdaCode}`);
        
        // Invalidate relevant queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['product-details', variables.productId] });
        queryClient.invalidateQueries({ queryKey: ['combined-competitive-analysis'] });
        queryClient.invalidateQueries({ queryKey: ['fda-device-search'] });
        
        // Refresh the page to ensure all components get the updated FDA code
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error(data.message || 'Failed to update FDA product code');
      }
    },
    onError: (error) => {
      console.error('FDA code update error:', error);
      toast.error('Failed to update FDA product code');
    },
  });
}