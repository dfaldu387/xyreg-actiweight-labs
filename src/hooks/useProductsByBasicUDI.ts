import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProductWithBasicUDI {
  id: string;
  name: string;
  trade_name: string | null;
  udi_di: string | null;
  basic_udi_di: string | null;
  model_reference: string | null;
  device_category: string | null;
  status: string | null;
  sibling_group_id: string | null;
  model_id: string | null;
  current_lifecycle_phase: string | null;
  updated_at: string | null;
  is_master_device: boolean;
  parent_product_id: string | null;
  parent_relationship_type: string | null;
}

/**
 * Fetch all products that share the same basic_udi_di value
 * This groups "sibling" products together (different sizes, variants of same device family)
 */
export function useProductsByBasicUDI(companyId: string, currentBasicUDI?: string) {
  const { data, isLoading, error } = useQuery<Map<string, ProductWithBasicUDI[]>>({
    queryKey: ['products-by-basic-udi', companyId, currentBasicUDI],
    queryFn: async (): Promise<Map<string, ProductWithBasicUDI[]>> => {
      if (!companyId) return new Map();

      // Get all products for this company with a basic_udi_di
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, trade_name, udi_di, basic_udi_di, model_reference, device_category, status, sibling_group_id, model_id, current_lifecycle_phase, updated_at, is_master_device, parent_product_id, parent_relationship_type')
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .not('basic_udi_di', 'is', null)
        .order('basic_udi_di', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching products by Basic UDI:', error);
        throw error;
      }

      // Debug: Log raw products from database
      // console.log('[useProductsByBasicUDI] Raw products from DB:', {
      //   companyId,
      //   totalCount: products?.length || 0,
      //   products: products?.map(p => ({
      //     id: p.id,
      //     name: p.name,
      //     basic_udi_di: p.basic_udi_di
      //   }))
      // });

      // Group products by basic_udi_di
      const grouped = new Map<string, ProductWithBasicUDI[]>();
      (products || []).forEach((product: ProductWithBasicUDI) => {
        if (product.basic_udi_di) {
          if (!grouped.has(product.basic_udi_di)) {
            grouped.set(product.basic_udi_di, []);
          }
          grouped.get(product.basic_udi_di)!.push(product);
        }
      });

      // Debug: Log grouped results
      // console.log('[useProductsByBasicUDI] Grouped by basic_udi_di:', {
      //   groupCount: grouped.size,
      //   groups: Array.from(grouped.entries()).map(([basicUdi, prods]) => ({
      //     basicUdi,
      //     count: prods.length,
      //     productIds: prods.map(p => p.id)
      //   }))
      // });
      // console.log('Products grouped by Basic UDI-DI:', {
      //   companyId,
      //   currentBasicUDI,
      //   totalProducts: products?.length || 0,
      //   groupCount: grouped.size,
      //   groups: Array.from(grouped.entries()).map(([basicUDI, prods]) => ({
      //     basicUDI,
      //     count: prods.length,
      //     products: prods.map(p => ({ id: p.id, name: p.name, udi_di: p.udi_di }))
      //   }))
      // });

      return grouped;
    },
    enabled: !!companyId,
  });

  // Get siblings for the current product's Basic UDI-DI
  const getCurrentProductSiblings = (): ProductWithBasicUDI[] => {
    if (!currentBasicUDI || !data) return [];
    return data.get(currentBasicUDI) || [];
  };

  // Get all groups
  const getAllGroups = (): { basicUDI: string; products: ProductWithBasicUDI[] }[] => {
    if (!data) return [];
    return Array.from(data.entries()).map(([basicUDI, products]) => ({
      basicUDI: basicUDI,
      products: products
    }));
  };

  return {
    groupedProducts: data,
    siblings: getCurrentProductSiblings(),
    allGroups: getAllGroups(),
    isLoading,
    error,
  };
}
