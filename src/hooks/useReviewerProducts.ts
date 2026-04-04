import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { getReviewerAssignedProducts, ReviewerProduct } from '@/services/reviewerProductService';

interface UseReviewerProductsOptions {
  reviewerGroupIds: string[];
  enabled?: boolean;
}

export function useReviewerProducts({ reviewerGroupIds, enabled = true }: UseReviewerProductsOptions) {
  const { user } = useAuth();

  return useQuery<ReviewerProduct[], Error>({
    queryKey: ['reviewer-products', user?.id, reviewerGroupIds],
    queryFn: async () => {
      if (!user?.id || reviewerGroupIds.length === 0) {
        return [];
      }
      return getReviewerAssignedProducts(user.id, reviewerGroupIds);
    },
    enabled: enabled && !!user?.id && reviewerGroupIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
