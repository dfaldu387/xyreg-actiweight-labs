import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductBundleGroupService } from '@/services/productBundleGroupService';
import type { BundleMemberConfig } from '@/types/productBundle';

export function useProductBundles(productId: string) {
  return useQuery({
    queryKey: ['product-bundles', productId],
    queryFn: () => ProductBundleGroupService.getBundlesForProduct(productId),
    enabled: !!productId,
  });
}

export function useBundleDetails(bundleId: string) {
  return useQuery({
    queryKey: ['bundle-details', bundleId],
    queryFn: () => ProductBundleGroupService.getBundleDetails(bundleId),
    enabled: !!bundleId,
  });
}

export function useCreateBundleGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      companyId,
      bundleName,
      members,
      description,
      createdByProductId,
      isFeasibilityStudy,
      targetMarkets,
    }: {
      companyId: string;
      bundleName: string;
      members: BundleMemberConfig[];
      description?: string;
      createdByProductId?: string;
      isFeasibilityStudy?: boolean;
      targetMarkets?: string[];
    }) => ProductBundleGroupService.createBundleGroup(
      companyId,
      bundleName,
      members,
      description,
      createdByProductId,
      isFeasibilityStudy,
      targetMarkets
    ),
    onSuccess: (data) => {
      // Invalidate queries for all member products
      data.members.forEach(member => {
        if (member.product_id) {
          queryClient.invalidateQueries({ queryKey: ['product-bundles', member.product_id] });
          queryClient.invalidateQueries({ queryKey: ['product-bundle', member.product_id] });
          queryClient.invalidateQueries({ queryKey: ['bundle-stats', member.product_id] });
        }
      });
    },
  });
}

export function useUpdateBundleGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bundleId,
      updates,
    }: {
      bundleId: string;
      updates: { bundle_name?: string; description?: string; is_feasibility_study?: boolean; target_markets?: string[] };
    }) => ProductBundleGroupService.updateBundleGroup(bundleId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bundle-details', variables.bundleId] });
      queryClient.invalidateQueries({ queryKey: ['product-bundles'] });
    },
  });
}

export function useDeleteBundleGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bundleId: string) => ProductBundleGroupService.deleteBundleGroup(bundleId),
    onMutate: async (bundleId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['company-bundles'] });
      
      // Snapshot the previous value
      const previousBundles = queryClient.getQueryData(['company-bundles']);
      
      // Optimistically remove the bundle
      queryClient.setQueryData(['company-bundles'], (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.filter((bundle: any) => bundle.id !== bundleId);
      });
      
      return { previousBundles };
    },
    onError: (err, bundleId, context: any) => {
      // Only rollback on error, no refetch
      if (context?.previousBundles) {
        queryClient.setQueryData(['company-bundles'], context.previousBundles);
      }
    },
    // No onSuccess or onSettled - optimistic update is enough!
  });
}

export function useAddBundleMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bundleId,
      memberConfig,
    }: {
      bundleId: string;
      memberConfig: BundleMemberConfig;
    }) => ProductBundleGroupService.addMemberToBundle(bundleId, memberConfig),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bundle-details', variables.bundleId] });
      if (data.product_id) {
        queryClient.invalidateQueries({ queryKey: ['product-bundles', data.product_id] });
      }
    },
  });
}

export function useRemoveBundleMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => ProductBundleGroupService.removeMemberFromBundle(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bundle-details'] });
      queryClient.invalidateQueries({ queryKey: ['product-bundles'] });
    },
  });
}

export function useUpdateBundleMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      updates,
    }: {
      memberId: string;
      updates: Partial<BundleMemberConfig>;
    }) => ProductBundleGroupService.updateBundleMember(memberId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bundle-details'] });
      queryClient.invalidateQueries({ queryKey: ['product-bundles'] });
    },
  });
}

export function useBundleDetailsWithVariants(bundleId: string) {
  return useQuery({
    queryKey: ['bundle-details-variants', bundleId],
    queryFn: () => ProductBundleGroupService.getBundleDetailsWithVariants(bundleId),
    enabled: !!bundleId,
  });
}
