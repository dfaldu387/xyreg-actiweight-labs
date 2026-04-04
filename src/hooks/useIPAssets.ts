import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type IPAssetRow = Database['public']['Tables']['ip_assets']['Row'];
type IPAssetInsert = Database['public']['Tables']['ip_assets']['Insert'];
type IPAssetUpdate = Database['public']['Tables']['ip_assets']['Update'];

export type IPAsset = IPAssetRow;
export type IPAssetFormData = Omit<IPAssetInsert, 'company_id' | 'id' | 'created_at' | 'updated_at'>;

export function useIPAssets(companyId: string | undefined) {
  return useQuery({
    queryKey: ['ip-assets', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from('ip_assets')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });
}

export function useIPAsset(assetId: string | undefined) {
  return useQuery({
    queryKey: ['ip-asset', assetId],
    queryFn: async () => {
      if (!assetId) return null;
      
      const { data, error } = await supabase
        .from('ip_assets')
        .select('*')
        .eq('id', assetId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!assetId,
  });
}

export function useCreateIPAsset(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: IPAssetFormData) => {
      const { data, error } = await supabase
        .from('ip_assets')
        .insert({
          company_id: companyId,
          ...formData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-assets', companyId] });
    },
  });
}

export function useUpdateIPAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...formData }: IPAssetUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('ip_assets')
        .update(formData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ip-assets'] });
      queryClient.invalidateQueries({ queryKey: ['ip-asset', data.id] });
    },
  });
}

export function useDeleteIPAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assetId: string) => {
      const { error } = await supabase
        .from('ip_assets')
        .delete()
        .eq('id', assetId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-assets'] });
    },
  });
}
