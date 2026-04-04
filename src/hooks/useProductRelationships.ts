import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProductAccessoryRelationship {
  id: string;
  company_id: string;
  main_product_id: string;
  accessory_product_id: string;
  relationship_type: 'component' | 'accessory' | 'consumable' | 'required' | 'optional' | 'replacement_part';
  revenue_attribution_percentage: number;
  typical_quantity: number;
  is_required: boolean;
  initial_multiplier: number;
  recurring_multiplier: number;
  recurring_period: string;
  lifecycle_duration_months: number;
  seasonality_factors: Record<string, number>;
  has_variant_distribution: boolean;
  distribution_method: 'fixed_percentages' | 'conditional_logic' | 'equal_distribution' | 'gaussian';
  created_at: string;
  updated_at: string;
  main_product?: {
    id: string;
    name: string;
    model_reference?: string;
    trade_name?: string;
  };
  accessory_product?: {
    id: string;
    name: string;
    model_reference?: string;
    trade_name?: string;
  };
}

// Hook for Product Accessory Relationships
export function useProductAccessoryRelationships(companyId: string, productId?: string) {
  return useQuery({
    queryKey: ['product-accessory-relationships', companyId, productId],
    queryFn: async () => {
      if (!companyId) throw new Error('Company ID is required');

      // First get the relationships
      let relationshipQuery = supabase
        .from('product_accessory_relationships')
        .select('*')
        .eq('company_id', companyId);

      if (productId) {
        relationshipQuery = relationshipQuery.or(`main_product_id.eq.${productId},accessory_product_id.eq.${productId}`);
      }

      const { data: relationships, error: relError } = await relationshipQuery.order('created_at', { ascending: false });

      if (relError) {
        console.error('Error fetching product accessory relationships:', relError);
        throw relError;
      }

      if (!relationships || relationships.length === 0) {
        return [];
      }

      // Get all unique product IDs
      const productIds = new Set<string>();
      relationships.forEach(rel => {
        if (rel.main_product_id) productIds.add(rel.main_product_id);
        if (rel.accessory_product_id) productIds.add(rel.accessory_product_id);
      });

      // Fetch all products in one query
      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('id, name, model_reference, trade_name')
        .in('id', Array.from(productIds));

      if (prodError) {
        console.error('Error fetching products:', prodError);
        throw prodError;
      }

      // Create a map for quick lookup
      const productMap = new Map(products?.map(p => [p.id, p]) || []);

      // Enrich relationships with product data
      return relationships.map(rel => ({
        ...rel,
        main_product: productMap.get(rel.main_product_id) || null,
        accessory_product: productMap.get(rel.accessory_product_id) || null,
      }));
    },
    enabled: !!companyId,
  });
}

// Mutations for creating and managing relationships

export function useCreateProductAccessoryRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<ProductAccessoryRelationship, 'id' | 'created_at' | 'updated_at' | 'main_product' | 'accessory_product'>) => {
      const { data: result, error } = await supabase
        .from('product_accessory_relationships')
        .insert(data)
        .select()
        .single();

      if (error) {
        console.error('Error creating product accessory relationship:', error);
        throw error;
      }

      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-accessory-relationships', variables.company_id] });
    },
  });
}

export function useUpdateProductAccessoryRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ProductAccessoryRelationship> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('product_accessory_relationships')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating product accessory relationship:', error);
        throw error;
      }

      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['product-accessory-relationships', result.company_id] });
    },
  });
}

export function useDeleteProductAccessoryRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_accessory_relationships')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting product accessory relationship:', error);
        throw error;
      }
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['product-accessory-relationships'] });
    },
  });
}
