import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductVariantDistributionSetting {
  id: string;
  company_id: string;
  product_id: string;
  variant_id: string;
  distribution_percentage: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  group_id?: string | null;
  group_position?: number;
}

export interface CreateVariantDistributionSettingData {
  company_id: string;
  product_id: string;
  variant_id: string;
  distribution_percentage: number;
  notes?: string;
  group_id?: string | null;
}

export interface UpdateVariantDistributionSettingData {
  distribution_percentage?: number;
  notes?: string;
  group_id?: string | null;
}

export function useProductVariantDistributionSettings(productId?: string) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['product-variant-distribution-settings', productId],
    queryFn: async () => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .from('product_variant_distribution_settings')
        .select('*')
        .eq('product_id', productId)
        .order('distribution_percentage', { ascending: false });
      
      if (error) throw error;
      return data as ProductVariantDistributionSetting[];
    },
    enabled: !!productId,
  });

  const createMutation = useCreateVariantDistributionSetting();
  const updateMutation = useUpdateVariantDistributionSetting();
  const deleteMutation = useDeleteVariantDistributionSetting();

  return {
    ...query,
    create: createMutation,
    update: updateMutation,
    delete: deleteMutation,
  };
}

export function useCreateVariantDistributionSetting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateVariantDistributionSettingData) => {
      const { data: result, error } = await supabase
        .from('product_variant_distribution_settings')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['product-variant-distribution-settings', variables.product_id] 
      });
      toast.success('Variant distribution setting created');
    },
    onError: (error: any) => {
      toast.error('Failed to create variant distribution setting', {
        description: error.message
      });
    },
  });
}

export function useUpdateVariantDistributionSetting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      productId, 
      data 
    }: { 
      id: string; 
      productId: string; 
      data: UpdateVariantDistributionSettingData 
    }) => {
      const { data: result, error } = await supabase
        .from('product_variant_distribution_settings')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['product-variant-distribution-settings', variables.productId] 
      });
      toast.success('Variant distribution setting updated');
    },
    onError: (error: any) => {
      toast.error('Failed to update variant distribution setting', {
        description: error.message
      });
    },
  });
}

export function useDeleteVariantDistributionSetting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, productId }: { id: string; productId: string }) => {
      const { error } = await supabase
        .from('product_variant_distribution_settings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['product-variant-distribution-settings', variables.productId] 
      });
      toast.success('Variant distribution setting deleted');
    },
    onError: (error: any) => {
      toast.error('Failed to delete variant distribution setting', {
        description: error.message
      });
    },
  });
}