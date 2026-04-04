import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DeviceFamilyProduct {
  id: string;
  name: string;
  trade_name: string | null;
  udi_di: string | null;
  basic_udi_di: string | null;
  status: string | null;
  current_lifecycle_phase: string | null;
  updated_at: string | null;
  is_master_device: boolean;
  parent_product_id: string | null;
  parent_relationship_type: string | null;
  company_id?: string | null;
}

export interface DeviceFamily {
  master: DeviceFamilyProduct;
  variants: DeviceFamilyProduct[];
  totalCount: number;
}

/**
 * Fetch a single device family by master product ID.
 * Returns the master device + all its variants (linked via parent_product_id).
 */
export function useDeviceFamily(masterProductId: string | undefined, companyId: string | undefined) {
  return useQuery<DeviceFamily | null>({
    queryKey: ['device-family', masterProductId, companyId],
    queryFn: async () => {
      if (!masterProductId || !companyId) return null;

      // Fetch master device
      const { data: master, error: masterError } = await supabase
        .from('products')
        .select('id, name, trade_name, udi_di, basic_udi_di, status, current_lifecycle_phase, updated_at, is_master_device, parent_product_id, parent_relationship_type, company_id')
        .eq('id', masterProductId)
        .eq('is_archived', false)
        .single();

      if (masterError || !master) {
        console.error('[useDeviceFamily] Error fetching master:', masterError);
        return null;
      }

      // Fetch all variants linked to this master
      const { data: variants, error: variantsError } = await supabase
        .from('products')
        .select('id, name, trade_name, udi_di, basic_udi_di, status, current_lifecycle_phase, updated_at, is_master_device, parent_product_id, parent_relationship_type')
        .eq('parent_product_id', masterProductId)
        .eq('parent_relationship_type', 'variant')
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .order('name', { ascending: true });

      if (variantsError) {
        console.error('[useDeviceFamily] Error fetching variants:', variantsError);
      }

      const variantsList = (variants || []) as DeviceFamilyProduct[];

      return {
        master: master as DeviceFamilyProduct,
        variants: variantsList,
        totalCount: 1 + variantsList.length,
      };
    },
    enabled: !!masterProductId && !!companyId,
  });
}
