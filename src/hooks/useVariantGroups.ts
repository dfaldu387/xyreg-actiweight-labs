import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ProductVariantGroup,
  CreateVariantGroupData,
  UpdateVariantGroupData,
} from '@/types/variantGroup';

export function useVariantGroups(productId?: string) {
  return useQuery({
    queryKey: ['variant-groups', productId],
    queryFn: async () => {
      if (!productId) return [];

      const { data, error } = await supabase
        .from('product_variant_groups')
        .select('*')
        .eq('product_id', productId)
        .order('position', { ascending: true });

      if (error) throw error;
      return data as ProductVariantGroup[];
    },
    enabled: !!productId,
  });
}

export function useCreateVariantGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateVariantGroupData) => {
      const { data: result, error } = await supabase
        .from('product_variant_groups')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result as ProductVariantGroup;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['variant-groups', variables.product_id],
      });
      toast.success('Variant group created');
    },
    onError: (error: any) => {
      toast.error('Failed to create variant group', {
        description: error.message,
      });
    },
  });
}

export function useUpdateVariantGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      productId,
      data,
    }: {
      id: string;
      productId: string;
      data: UpdateVariantGroupData;
    }) => {
      const { data: result, error } = await supabase
        .from('product_variant_groups')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as ProductVariantGroup;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['variant-groups', variables.productId],
      });
      toast.success('Variant group updated');
    },
    onError: (error: any) => {
      toast.error('Failed to update variant group', {
        description: error.message,
      });
    },
  });
}

export function useDeleteVariantGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, productId }: { id: string; productId: string }) => {
      const { error } = await supabase
        .from('product_variant_groups')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['variant-groups', variables.productId],
      });
      toast.success('Variant group deleted');
    },
    onError: (error: any) => {
      toast.error('Failed to delete variant group', {
        description: error.message,
      });
    },
  });
}

export function useReorderVariantGroups() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      groups,
    }: {
      productId: string;
      groups: { id: string; position: number }[];
    }) => {
      const updates = groups.map(({ id, position }) =>
        supabase
          .from('product_variant_groups')
          .update({ position })
          .eq('id', id)
      );

      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);
      
      if (errors.length > 0) {
        throw new Error('Failed to reorder some groups');
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['variant-groups', variables.productId],
      });
    },
    onError: (error: any) => {
      toast.error('Failed to reorder groups', {
        description: error.message,
      });
    },
  });
}
