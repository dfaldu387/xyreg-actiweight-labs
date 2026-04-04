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

interface BasicUDIGroup {
  id: string;
  company_id: string;
  basic_udi_di: string;
  internal_reference: string;
  issuing_agency: string;
  company_prefix: string;
  check_character: string;
  intended_purpose: string | null;
  essential_characteristics: string | null;
  risk_class: string | null;
  display_as_merged: boolean;
  created_at: string;
  updated_at: string;
}

export interface UseProductUDIResult {
  /** UDI-DI to display: null if 0 variants or >1 variants */
  displayUdiDi: string | null;
  /** Basic UDI-DI to display */
  displayBasicUdiDi: string | null;
  /** Number of UDI-DI variants for this product */
  variantCount: number;
  /** All variants for this product */
  variants: UDIDIVariant[];
  /** The linked Basic UDI-DI group (if any) */
  basicUdiGroup: BasicUDIGroup | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
}

/**
 * Hook to fetch UDI data from the Single Source of Truth:
 * - product_udi_di_variants table for UDI-DI
 * - basic_udi_di_groups table for Basic UDI-DI
 * 
 * Display logic (per user requirements):
 * - If a Basic UDI-DI group is assigned, always show Basic UDI-DI
 * - 1 variant: show variant.generated_udi_di
 * - 0 or >1 variants: do not show a single UDI-DI
 */
export function useProductUDI(productId: string | undefined): UseProductUDIResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ['product-udi', productId],
    queryFn: async () => {
      if (!productId) {
        return { variants: [], basicUdiGroup: null, productUdiDi: null, productBasicUdiDi: null };
      }

      // Fetch the product's direct udi_di and basic_udi_di fields as fallback
      const { data: productRow, error: productFetchError } = await supabase
        .from('products')
        .select('udi_di, basic_udi_di, company_id')
        .eq('id', productId)
        .maybeSingle();

      if (productFetchError) {
        console.error('Error fetching product UDI fields:', productFetchError);
      }

      const productUdiDi = (productRow as any)?.udi_di as string | null | undefined;
      const productBasicUdiDi = (productRow as any)?.basic_udi_di as string | null | undefined;

      // Fetch all UDI-DI variants for this product
      const { data: variants, error: variantsError } = await supabase
        .from('product_udi_di_variants')
        .select('*')
        .eq('product_id', productId)
        .order('package_level_indicator', { ascending: true });

      if (variantsError) {
        console.error('Error fetching UDI-DI variants:', variantsError);
        throw variantsError;
      }

      // Determine the assigned Basic UDI-DI group
      let groupId: string | null = null;

      if (variants && variants.length > 0) {
        groupId = variants[0].basic_udi_di_group_id;
      } else {
        const { data: assignment, error: assignmentError } = await supabase
          .from('product_basic_udi_assignments')
          .select('basic_udi_di_group_id')
          .eq('product_id', productId)
          .order('assigned_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (assignmentError) {
          console.error('Error fetching Basic UDI-DI assignment:', assignmentError);
        }

        groupId = assignment?.basic_udi_di_group_id ?? null;

        if (!groupId && productBasicUdiDi && productRow?.company_id) {
          const { data: groupByCode, error: groupByCodeError } = await supabase
            .from('basic_udi_di_groups')
            .select('id')
            .eq('company_id', productRow.company_id)
            .eq('basic_udi_di', productBasicUdiDi)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (groupByCodeError) {
            console.error('Error fetching Basic UDI-DI group fallback:', groupByCodeError);
          }

          groupId = groupByCode?.id ?? null;
        }
      }

      // Fetch the Basic UDI-DI group (if assigned)
      let basicUdiGroup: BasicUDIGroup | null = null;
      if (groupId) {
        const { data: group, error: groupError } = await supabase
          .from('basic_udi_di_groups')
          .select('*')
          .eq('id', groupId)
          .maybeSingle();

        if (groupError) {
          console.error('Error fetching Basic UDI-DI group:', groupError);
        }

        basicUdiGroup = group || null;
      }

      return {
        variants: (variants || []) as UDIDIVariant[],
        basicUdiGroup,
        productUdiDi: productUdiDi || null,
        productBasicUdiDi: productBasicUdiDi || null,
      };
    },
    enabled: !!productId,
    staleTime: 30 * 1000,
    refetchOnMount: 'always',
  });

  const variants = data?.variants || [];
  const basicUdiGroup = data?.basicUdiGroup || null;
  const variantCount = variants.length;

  // Display logic:
  // - Always show Basic UDI-DI if assigned (from group or product fallback)
  // - Only show a single UDI-DI if exactly one variant exists, else fall back to product.udi_di
  const displayBasicUdiDi: string | null = basicUdiGroup?.basic_udi_di || data?.productBasicUdiDi || null;
  const displayUdiDi: string | null = variantCount === 1 ? variants[0].generated_udi_di : (data?.productUdiDi || null);

  return {
    displayUdiDi,
    displayBasicUdiDi,
    variantCount,
    variants,
    basicUdiGroup,
    isLoading,
    error: error as Error | null,
  };
}
