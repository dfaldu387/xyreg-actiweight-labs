import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CompanyBundle {
  id: string;
  bundle_name: string;
  description: string | null;
  company_id: string;
  created_at: string;
  updated_at: string;
  created_by_product_id: string | null;
  is_feasibility_study: boolean;
  target_markets: string[] | null;
  thumbnail_url?: string | null;
  member_count: number;
  product_members: Array<{
    id: string;
    name: string;
  }>;
  sibling_group_members: Array<{
    id: string;
    name: string;
  }>;
}

export function useCompanyBundles(companyId: string | undefined) {
  return useQuery({
    queryKey: ['company-bundles', companyId],
    queryFn: async (): Promise<CompanyBundle[]> => {
      if (!companyId) return [];

      // Fetch all bundles for the company
      const { data: bundles, error: bundlesError } = await supabase
        .from('product_bundles')
        .select('id, bundle_name, description, company_id, created_at, updated_at, created_by_product_id, is_feasibility_study, target_markets')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (bundlesError) throw bundlesError;
      if (!bundles) return [];

      // Fetch members for each bundle
      const bundlesWithMembers = await Promise.all(
        bundles.map(async (bundle) => {
          const { data: members, error: membersError } = await supabase
            .from('product_bundle_members')
            .select(`
              id,
              product_id,
              sibling_group_id
            `)
            .eq('bundle_id', bundle.id);

          if (membersError) throw membersError;

          const productIds = members?.filter(m => m.product_id).map(m => m.product_id) || [];
          const siblingGroupIds = members?.filter(m => m.sibling_group_id).map(m => m.sibling_group_id) || [];

          // Fetch product names and images
          let productMembers: Array<{ id: string; name: string }> = [];
          let thumbnailUrl: string | null = null;
          if (productIds.length > 0) {
            const { data: products } = await supabase
              .from('products')
              .select('id, name, images')
              .in('id', productIds);
            productMembers = products || [];
            
          // Try to get thumbnail from created_by_product or first product with image
          const primaryProduct = products?.find(p => p.id === bundle.created_by_product_id);
          if (primaryProduct?.images && Array.isArray(primaryProduct.images) && primaryProduct.images.length > 0) {
            thumbnailUrl = primaryProduct.images[0] as string;
          } else {
            // Fallback to first product with an image
            const firstProductWithImage = products?.find(p => p.images && Array.isArray(p.images) && p.images.length > 0);
            if (firstProductWithImage?.images && Array.isArray(firstProductWithImage.images)) {
              thumbnailUrl = firstProductWithImage.images[0] as string;
            }
          }
          }

          // Fetch sibling group names
          let siblingGroupMembers: Array<{ id: string; name: string }> = [];
          if (siblingGroupIds.length > 0) {
            const { data: groups } = await supabase
              .from('product_sibling_groups')
              .select('id, name')
              .in('id', siblingGroupIds);
            siblingGroupMembers = groups || [];
          }

          return {
            ...bundle,
            target_markets: Array.isArray(bundle.target_markets) ? bundle.target_markets as string[] : null,
            member_count: (members?.length || 0),
            product_members: productMembers,
            sibling_group_members: siblingGroupMembers,
            thumbnail_url: thumbnailUrl,
          };
        })
      );

      return bundlesWithMembers;
    },
    enabled: !!companyId,
  });
}
