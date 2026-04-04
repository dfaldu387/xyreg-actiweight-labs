import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type IPAssetRow = Database['public']['Tables']['ip_assets']['Row'];
type IPAssetInsert = Database['public']['Tables']['ip_assets']['Insert'];

export interface ProductIPAsset extends IPAssetRow {
  link_notes?: string | null;
  protection_type?: string | null;
}

// Fetch IP assets linked to a specific product
export function useProductIPAssets(productId: string | undefined) {
  return useQuery({
    queryKey: ['product-ip-assets', productId],
    queryFn: async () => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .from('ip_asset_products')
        .select(`
          ip_asset_id,
          notes,
          protection_type,
          ip_assets (*)
        `)
        .eq('product_id', productId);

      if (error) throw error;
      
      // Flatten the response
      return (data || []).map(item => ({
        ...(item.ip_assets as IPAssetRow),
        link_notes: item.notes,
        protection_type: item.protection_type,
      })) as ProductIPAsset[];
    },
    enabled: !!productId,
  });
}

// Link an existing IP asset to a product
export function useLinkIPAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      assetId, 
      productId, 
      notes 
    }: { 
      assetId: string; 
      productId: string; 
      notes?: string;
    }) => {
      const { error } = await supabase
        .from('ip_asset_products')
        .insert({
          ip_asset_id: assetId,
          product_id: productId,
          notes,
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-ip-assets', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['funnel-ip-assets', variables.productId] });
    },
  });
}

// Unlink an IP asset from a product
export function useUnlinkIPAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      assetId, 
      productId 
    }: { 
      assetId: string; 
      productId: string;
    }) => {
      const { error } = await supabase
        .from('ip_asset_products')
        .delete()
        .eq('ip_asset_id', assetId)
        .eq('product_id', productId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-ip-assets', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['funnel-ip-assets', variables.productId] });
    },
  });
}

// Create a new IP asset and link it to a product
export function useCreateAndLinkIPAsset(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      productId, 
      asset 
    }: { 
      productId: string; 
      asset: Omit<IPAssetInsert, 'company_id'>;
    }) => {
      // Create the IP asset
      const { data: newAsset, error: assetError } = await supabase
        .from('ip_assets')
        .insert({
          ...asset,
          company_id: companyId,
        })
        .select()
        .single();

      if (assetError) throw assetError;

      // Link it to the product
      const { error: linkError } = await supabase
        .from('ip_asset_products')
        .insert({
          ip_asset_id: newAsset.id,
          product_id: productId,
        });

      if (linkError) throw linkError;

      return newAsset;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-ip-assets', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['funnel-ip-assets', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['ip-assets', companyId] });
    },
  });
}
