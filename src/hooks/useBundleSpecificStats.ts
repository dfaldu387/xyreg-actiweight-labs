import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface BundleSpecificStats {
  totalProducts: number;
  totalVariants: number;
  relationshipTypes: Set<string>;
}

export function useBundleSpecificStats(bundleId: string | null) {
  return useQuery({
    queryKey: ['bundle-specific-stats', bundleId],
    queryFn: async (): Promise<BundleSpecificStats> => {
      if (!bundleId) {
        return {
          totalProducts: 0,
          totalVariants: 0,
          relationshipTypes: new Set()
        };
      }

      // Get bundle members
      const { data: members, error: membersError } = await supabase
        .from('product_bundle_members')
        .select('id, product_id, sibling_group_id, relationship_type')
        .eq('bundle_id', bundleId);

      if (membersError) throw membersError;

      const productIds = members
        ?.filter(m => m.product_id)
        .map(m => m.product_id)
        .filter(Boolean) || [];

      const siblingGroupIds = members
        ?.filter(m => m.sibling_group_id)
        .map(m => m.sibling_group_id)
        .filter(Boolean) || [];

      // Count variants for all member products
      let totalVariants = 0;
      if (productIds.length > 0) {
        const { data: variants, error: variantsError } = await supabase
          .from('product_variants')
          .select('id, product_id')
          .in('product_id', productIds);

        if (variantsError) throw variantsError;
        totalVariants = variants?.length || 0;
      }

      // Count products in sibling groups
      let siblingGroupProductCount = 0;
      if (siblingGroupIds.length > 0) {
        const { data: assignments, error: assignmentsError } = await supabase
          .from('product_sibling_assignments')
          .select('id, sibling_group_id')
          .in('sibling_group_id', siblingGroupIds);

        if (assignmentsError) throw assignmentsError;
        siblingGroupProductCount = assignments?.length || 0;
      }

      const relationshipTypes = new Set(
        members?.map(m => m.relationship_type).filter(Boolean) || []
      );

      return {
        totalProducts: productIds.length + siblingGroupProductCount,
        totalVariants,
        relationshipTypes
      };
    },
    enabled: !!bundleId,
  });
}
