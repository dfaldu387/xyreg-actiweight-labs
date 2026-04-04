import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UDIDIVariant {
  id: string;
  product_id: string;
  basic_udi_di_group_id: string;
  packaging_level: string;
  item_reference: string;
  package_level_indicator: number;
  generated_udi_di: string;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch ALL UDI-DI variants for a company's Basic UDI-DI groups
 * This includes variants across all products that share the same Basic UDI-DI
 */
export function useCompanyUDIDIVariants(companyId: string) {
  const { data: variants, isLoading, error } = useQuery({
    queryKey: ['company-udi-di-variants', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      // First get all Basic UDI-DI groups for this company
      const { data: groups, error: groupsError } = await supabase
        .from('basic_udi_di_groups')
        .select('id')
        .eq('company_id', companyId);

      if (groupsError) {
        console.error('Error fetching Basic UDI-DI groups:', groupsError);
        throw groupsError;
      }

      if (!groups || groups.length === 0) {
        return [];
      }

      const groupIds = groups.map(g => g.id);

      // Then fetch all variants that belong to these groups
      const { data, error } = await supabase
        .from('product_udi_di_variants')
        .select('*')
        .in('basic_udi_di_group_id', groupIds)
        .order('basic_udi_di_group_id', { ascending: true })
        .order('package_level_indicator', { ascending: true });

      if (error) {
        console.error('Error fetching UDI-DI variants:', error);
        throw error;
      }

      console.log('Fetched company UDI-DI variants:', {
        companyId,
        groupsCount: groups.length,
        variantsCount: data?.length || 0,
        variants: data
      });

      return data as UDIDIVariant[];
    },
    enabled: !!companyId,
  });

  return {
    variants: variants || [],
    isLoading,
    error,
  };
}
