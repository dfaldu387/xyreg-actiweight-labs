import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProductSiblingGroupRelationship {
  id: string;
  company_id: string;
  main_product_id: string;
  accessory_sibling_group_id: string;
  relationship_type: 'component' | 'accessory' | 'consumable' | 'required' | 'optional' | 'replacement_part';
  revenue_attribution_percentage: number;
  typical_quantity: number;
  is_required: boolean;
  initial_multiplier: number;
  recurring_multiplier: number;
  recurring_period: string;
  lifecycle_duration_months: number;
  seasonality_factors: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export function useProductSiblingGroupRelationships(companyId: string, productId?: string) {
  return useQuery({
    queryKey: ['product-sibling-group-relationships', companyId, productId],
    queryFn: async () => {
      if (!companyId) throw new Error('Company ID is required');

      let query = supabase
        .from('product_sibling_group_relationships')
        .select('*')
        .eq('company_id', companyId);

      if (productId) {
        query = query.eq('main_product_id', productId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching product sibling group relationships:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!companyId,
  });
}

export function useCreateProductSiblingGroupRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<ProductSiblingGroupRelationship, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await supabase
        .from('product_sibling_group_relationships')
        .insert(data)
        .select()
        .single();

      if (error) {
        console.error('Error creating product sibling group relationship:', error);
        throw error;
      }

      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-sibling-group-relationships', variables.company_id] });
    },
  });
}

export function useUpdateProductSiblingGroupRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ProductSiblingGroupRelationship> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('product_sibling_group_relationships')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating product sibling group relationship:', error);
        throw error;
      }

      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['product-sibling-group-relationships', result.company_id] });
    },
  });
}

export function useDeleteProductSiblingGroupRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_sibling_group_relationships')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting product sibling group relationship:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-sibling-group-relationships'] });
    },
  });
}
