import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEffectiveDefinition,
  updateDefinitionWithInheritance,
  createDefinitionOverride,
  removeDefinitionOverride,
  getModelDefinition,
  updateModelDefinition,
  getModelVariantStats,
  type ApplyToOption,
  type ProductDefinitionData,
  type EffectiveDefinition
} from '@/services/productDefinitionService';
import { supabase } from '@/integrations/supabase/client';
import { checkAndAutoEnable } from '@/services/gapAutoEnableService';
import { toast } from 'sonner';

/**
 * Hook to get effective product definition (with inheritance)
 */
export function useProductDefinition(productId: string | undefined) {
  return useQuery<EffectiveDefinition>({
    queryKey: ['product-definition', productId],
    queryFn: () => getEffectiveDefinition(productId!),
    enabled: !!productId,
    staleTime: 1000 * 60 * 5
  });
}

/**
 * Hook to update product definition with apply-to-all logic
 */
export function useUpdateProductDefinition(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, applyTo }: { data: ProductDefinitionData; applyTo: ApplyToOption }) =>
      updateDefinitionWithInheritance(productId, data, applyTo),
    onSuccess: async (result) => {
      // Invalidate affected products
      result.variantIds.forEach(id => {
        queryClient.invalidateQueries({ queryKey: ['product-definition', id] });
        queryClient.invalidateQueries({ queryKey: ['product', id] });
      });

      if (result.updatedCount > 1) {
        toast.success(`Updated ${result.updatedCount} variants`);
      } else {
        toast.success('Definition updated');
      }

      // Reactively auto-enable gap templates based on new product conditions
      try {
        const { data: product } = await supabase
          .from('products')
          .select('company_id')
          .eq('id', productId)
          .single();
        if (product?.company_id) {
          const newlyEnabled = await checkAndAutoEnable(product.company_id);
          if (newlyEnabled.length > 0) {
            toast.success(`Auto-enabled gap frameworks: ${newlyEnabled.join(', ')}`);
            queryClient.invalidateQueries({ queryKey: ['enabled-gap-frameworks'] });
            queryClient.invalidateQueries({ queryKey: ['company-gap-templates'] });
          }
        }
      } catch (e) {
        console.error('Auto-enable check failed:', e);
      }
    },
    onError: (error) => {
      console.error('Error updating product definition:', error);
      toast.error('Failed to update definition');
    }
  });
}

/**
 * Hook to create definition override
 */
export function useCreateDefinitionOverride(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, reason }: { data: ProductDefinitionData; reason: string }) =>
      createDefinitionOverride(productId, data, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-definition', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      toast.success('Custom definition created');
    },
    onError: (error) => {
      console.error('Error creating override:', error);
      toast.error('Failed to create custom definition');
    }
  });
}

/**
 * Hook to remove definition override
 */
export function useRemoveDefinitionOverride(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => removeDefinitionOverride(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-definition', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      toast.success('Reverted to model definition');
    },
    onError: (error) => {
      console.error('Error removing override:', error);
      toast.error('Failed to revert to model');
    }
  });
}

/**
 * Hook to get model definition
 */
export function useModelDefinition(modelId: string | undefined) {
  return useQuery<ProductDefinitionData>({
    queryKey: ['model-definition', modelId],
    queryFn: () => getModelDefinition(modelId!),
    enabled: !!modelId,
    staleTime: 1000 * 60 * 5
  });
}

/**
 * Hook to update model definition
 */
export function useUpdateModelDefinition(modelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProductDefinitionData) => updateModelDefinition(modelId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['model-definition', modelId] });
      queryClient.invalidateQueries({ queryKey: ['company-product-models'] });
      toast.success('Model definition updated');
    },
    onError: (error) => {
      console.error('Error updating model definition:', error);
      toast.error('Failed to update model definition');
    }
  });
}

/**
 * Hook to get model variant statistics
 */
export function useModelVariantStats(modelId: string | undefined) {
  return useQuery({
    queryKey: ['model-variant-stats', modelId],
    queryFn: () => getModelVariantStats(modelId!),
    enabled: !!modelId,
    staleTime: 1000 * 60 * 3
  });
}
