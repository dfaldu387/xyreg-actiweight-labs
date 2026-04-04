import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

interface CreateUDIDIVariantData {
  product_id: string;
  basic_udi_di_group_id: string;
  packaging_level: string;
  item_reference: string;
  package_level_indicator: number;
  generated_udi_di: string;
}

export function useUDIDIVariants(productId?: string) {
  const queryClient = useQueryClient();

  // Query for UDI-DI variants
  const { data: variants, isLoading, error } = useQuery({
    queryKey: ['udi-di-variants', productId],
    queryFn: async () => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .from('product_udi_di_variants')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching UDI-DI variants:', error);
        throw error;
      }

      return data as UDIDIVariant[];
    },
    enabled: !!productId,
  });

  // Create UDI-DI variant mutation
  const createVariantMutation = useMutation({
    mutationFn: async (data: CreateUDIDIVariantData) => {
      const { data: result, error } = await supabase
        .from('product_udi_di_variants')
        .insert(data)
        .select()
        .single();

      if (error) {
        console.error('Error creating UDI-DI variant:', error);
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['udi-di-variants'] });
      toast.success('UDI-DI variant created successfully');
    },
    onError: (error) => {
      console.error('Failed to create UDI-DI variant:', error);
      toast.error('Failed to create UDI-DI variant');
    },
  });

  // Update UDI-DI variant mutation
  const updateVariantMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateUDIDIVariantData> }) => {
      const { data: result, error } = await supabase
        .from('product_udi_di_variants')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating UDI-DI variant:', error);
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['udi-di-variants'] });
      toast.success('UDI-DI variant updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update UDI-DI variant:', error);
      toast.error('Failed to update UDI-DI variant');
    },
  });

  // Delete UDI-DI variant mutation
  const deleteVariantMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_udi_di_variants')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting UDI-DI variant:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['udi-di-variants'] });
      toast.success('UDI-DI variant deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete UDI-DI variant:', error);
      toast.error('Failed to delete UDI-DI variant');
    },
  });

  // Create UDI-DI variant
  const createVariant = async (data: CreateUDIDIVariantData) => {
    return createVariantMutation.mutateAsync(data);
  };

  // Update UDI-DI variant
  const updateVariant = async (id: string, data: Partial<CreateUDIDIVariantData>) => {
    return updateVariantMutation.mutateAsync({ id, data });
  };

  // Delete UDI-DI variant
  const deleteVariant = async (id: string) => {
    return deleteVariantMutation.mutateAsync(id);
  };

  return {
    variants: variants || [],
    isLoading,
    error,
    createVariant,
    updateVariant,
    deleteVariant,
    isCreating: createVariantMutation.isPending,
    isUpdating: updateVariantMutation.isPending,
    isDeleting: deleteVariantMutation.isPending,
  };
}

/**
 * Hook to fetch used Item References for a specific Basic UDI-DI group
 * Fetches from BOTH product_udi_di_variants AND products table (where udi_di is set)
 */
export function useGroupItemReferences(basicUdiDiGroupId?: string) {
  const { data: usedReferences, isLoading } = useQuery({
    queryKey: ['group-item-references', basicUdiDiGroupId],
    queryFn: async () => {
      if (!basicUdiDiGroupId) return [];
      
      // First, get the Basic UDI-DI group details to know the basic_udi_di code and company_prefix
      const { data: groupData, error: groupError } = await supabase
        .from('basic_udi_di_groups')
        .select('basic_udi_di, company_prefix, company_id')
        .eq('id', basicUdiDiGroupId)
        .maybeSingle();

      if (groupError) {
        console.error('Error fetching basic UDI-DI group:', groupError);
        throw groupError;
      }

      if (!groupData) return [];

      const { basic_udi_di, company_id } = groupData;
      let { company_prefix } = groupData;
      
      // If company_prefix is empty, extract it from basic_udi_di (leading digits)
      // IMPORTANT: The leading digits include packaging indicator as the first digit
      // e.g., "1569431111NOX_..." -> full numeric is "1569431111" where first "1" is pkg level
      if (!company_prefix && basic_udi_di) {
        const match = basic_udi_di.match(/^(\d+)/);
        if (match) {
          const fullNumeric = match[1];
          // For GTIN-14, first digit is packaging indicator, rest is GS1 prefix
          // We keep the full numeric for UDI-DI matching since stored UDI-DIs include pkg level
          company_prefix = fullNumeric;
        }
      }
      
      const usedRefs: { itemReference: string; productId: string; productName: string }[] = [];
      
      // Source 1: product_udi_di_variants table
      const { data: variantsData, error: variantsError } = await supabase
        .from('product_udi_di_variants')
        .select('item_reference, product_id, products(name)')
        .eq('basic_udi_di_group_id', basicUdiDiGroupId);

      if (!variantsError && variantsData) {
        variantsData.forEach(v => {
          usedRefs.push({
            itemReference: v.item_reference,
            productId: v.product_id,
            productName: (v.products as { name: string } | null)?.name || 'Unknown Product'
          });
        });
      }

      // Source 2: products table - find ALL products sharing the same GS1 prefix
      // Products with same prefix share item reference namespace even if basic_udi_di text differs
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, udi_di')
        .eq('company_id', company_id)
        .not('udi_di', 'is', null)
        .like('udi_di', `${company_prefix}%`); // Match all UDI-DIs starting with the prefix

      if (!productsError && productsData) {
        productsData.forEach(product => {
          const udiDi = product.udi_di || '';
          let itemRef = '';
          
          if (udiDi && company_prefix) {
            // Try to extract after company prefix
            if (udiDi.startsWith(company_prefix)) {
              const afterPrefix = udiDi.slice(company_prefix.length);
              // Item reference is everything except the last digit (check digit)
              itemRef = afterPrefix.slice(0, -1);
            } else if (udiDi.includes(company_prefix)) {
              const afterPrefix = udiDi.slice(udiDi.indexOf(company_prefix) + company_prefix.length);
              itemRef = afterPrefix.slice(0, -1);
            }
          }
          
          // Fallback: if extraction failed, try last 4 digits before check digit
          if (!itemRef && udiDi.length >= 5) {
            itemRef = udiDi.slice(-5, -1);
          }
          
          if (itemRef && !usedRefs.some(r => r.itemReference === itemRef)) {
            usedRefs.push({
              itemReference: itemRef,
              productId: product.id,
              productName: product.name || 'Unknown Product'
            });
          }
        });
      }
      
      console.log('Used item references for group:', basicUdiDiGroupId, 'prefix:', company_prefix, 'refs:', usedRefs);
      return usedRefs;
    },
    enabled: !!basicUdiDiGroupId,
  });

  return {
    usedReferences: usedReferences || [],
    isLoading,
  };
}