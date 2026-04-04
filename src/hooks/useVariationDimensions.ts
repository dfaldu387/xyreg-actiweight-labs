import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface VariationDimension {
  id: string;
  company_id: string;
  product_id?: string | null;
  name: string;
  slug?: string | null;
  position: number;
  is_active: boolean;
}

export interface VariationOption {
  id: string;
  company_id: string;
  dimension_id: string;
  name: string;
  value_key?: string | null;
  position: number;
  is_active: boolean;
}

export interface ProductVariantOptionEntry {
  dimensionId: string;
  optionId: string | null;
  optionName?: string | null;
  dimensionName?: string;
  valueText?: string | null;
}

interface UseVariationDimensionsOptions {
  productIds?: string[];
  /** When set, also fetches product-scoped dimensions for this master product */
  masterProductId?: string;
}

interface DimensionsData {
  dimensions: VariationDimension[];
  optionsByDimension: Record<string, VariationOption[]>;
}

async function fetchDimensionsData(companyId: string, masterProductId?: string): Promise<DimensionsData> {
  // Build query: company-wide (product_id IS NULL) + product-specific if masterProductId provided
  let query = supabase
    .from("product_variation_dimensions")
    .select("*")
    .eq("company_id", companyId)
    .order("position", { ascending: true });

  if (masterProductId) {
    // Fetch both company-wide and product-scoped dimensions
    query = query.or(`product_id.is.null,product_id.eq.${masterProductId}`);
  } else {
    // Settings view: only company-wide dimensions
    query = query.is("product_id", null);
  }

  const { data: dims, error: dimErr } = await query;
  if (dimErr) throw dimErr;

  const dimensions = dims || [];
  let optionsByDimension: Record<string, VariationOption[]> = {};

  if (dimensions.length > 0) {
    const { data: opts, error: optErr } = await supabase
      .from("product_variation_options")
      .select("*")
      .eq("company_id", companyId)
      .in("dimension_id", dimensions.map(d => d.id))
      .order("position", { ascending: true });
    if (optErr) throw optErr;

    (opts || []).forEach(o => {
      optionsByDimension[o.dimension_id] = optionsByDimension[o.dimension_id] || [];
      optionsByDimension[o.dimension_id].push(o as VariationOption);
    });
  }

  return { dimensions, optionsByDimension };
}

async function fetchProductVariantOptions(
  companyId: string,
  productIds: string[]
): Promise<Record<string, ProductVariantOptionEntry[]>> {
  if (productIds.length === 0) return {};

  // First, fetch product_variants for all product IDs
  const { data: productVariants, error: variantsErr } = await supabase
    .from("product_variants")
    .select("id, product_id")
    .in("product_id", productIds);

  if (variantsErr) {
    console.error("Error fetching product variants:", variantsErr);
    return {};
  }

  if (!productVariants || productVariants.length === 0) return {};

  // Get variant IDs
  const variantIds = productVariants.map((pv) => pv.id);

  // Then fetch product_variant_values with joins
  const { data: variantValues, error: valuesErr } = await supabase
    .from("product_variant_values")
    .select(`
      product_variant_id,
      dimension_id,
      option_id,
      value_text,
      product_variation_dimensions!inner(name),
      product_variation_options!inner(name)
    `)
    .in("product_variant_id", variantIds)
    .not("option_id", "is", null);

  if (valuesErr) {
    console.error("Error fetching variant values:", valuesErr);
    return {};
  }

  if (!variantValues || variantValues.length === 0) return {};

  // Build a map from variant_id to product_id
  const variantToProductMap = new Map<string, string>();
  productVariants.forEach((pv) => {
    variantToProductMap.set(pv.id, pv.product_id);
  });

  // Build the result map grouped by product_id
  const variantMap: Record<string, ProductVariantOptionEntry[]> = {};

  variantValues.forEach((entry: any) => {
    const productId = variantToProductMap.get(entry.product_variant_id);
    if (!productId) return;

    const dimensionId = entry.dimension_id;
    if (!dimensionId) return;

    const dimensionName = entry.product_variation_dimensions?.name;
    const optionName = entry.product_variation_options?.name || entry.value_text;

    if (!variantMap[productId]) {
      variantMap[productId] = [];
    }

    variantMap[productId].push({
      dimensionId,
      optionId: entry.option_id,
      optionName,
      dimensionName,
      valueText: entry.value_text,
    });
  });

  return variantMap;
}

export function useVariationDimensions(companyId?: string, options: UseVariationDimensionsOptions = {}) {
  const queryClient = useQueryClient();

  const masterProductId = options.masterProductId;

  const productIds = useMemo(() => {
    return (options.productIds || []).filter((id): id is string => Boolean(id));
  }, [options.productIds]);

  const productIdsKey = useMemo(() => productIds.slice().sort().join("|"), [productIds]);

  // Query for dimensions and options (cached by companyId + masterProductId)
  const { data: dimensionsData, isLoading: dimensionsLoading, refetch: refetchDimensions } = useQuery({
    queryKey: ['variation-dimensions', companyId, masterProductId || 'global'],
    queryFn: () => fetchDimensionsData(companyId!, masterProductId),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Query for product variant options (cached by companyId + productIds)
  const { data: productVariantOptions = {}, isLoading: variantOptionsLoading } = useQuery({
    queryKey: ['product-variant-options', companyId, productIdsKey],
    queryFn: () => fetchProductVariantOptions(companyId!, productIds),
    enabled: !!companyId && productIds.length > 0,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  const dimensions = dimensionsData?.dimensions || [];
  const optionsByDimension = dimensionsData?.optionsByDimension || {};
  const loading = dimensionsLoading || variantOptionsLoading;

  const load = async () => {
    await refetchDimensions();
  };

  const invalidateDimensionsCache = () => {
    queryClient.invalidateQueries({ queryKey: ['variation-dimensions', companyId] });
  };

  const createDimension = async (name: string, productId?: string) => {
    if (!companyId) return;
    try {
      const insertData: any = { company_id: companyId, name };
      if (productId) insertData.product_id = productId;
      const { data, error } = await supabase
        .from("product_variation_dimensions")
        .insert(insertData)
        .select("*")
        .single();
      if (error) throw error;
      toast.success("Dimension created");
      invalidateDimensionsCache();
      return data as VariationDimension;
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to create dimension");
    }
  };

  const updateDimension = async (dimensionId: string, name: string) => {
    try {
      const { error } = await supabase
        .from("product_variation_dimensions")
        .update({ name })
        .eq("id", dimensionId);
      if (error) throw error;
      toast.success("Dimension updated");
      invalidateDimensionsCache();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to update dimension");
    }
  };

  const deleteDimension = async (dimensionId: string) => {
    try {
      const { error } = await supabase
        .from("product_variation_dimensions")
        .delete()
        .eq("id", dimensionId);
      if (error) throw error;
      toast.success("Dimension deleted");
      invalidateDimensionsCache();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to delete dimension");
    }
  };

  const createOption = async (dimensionId: string, name: string) => {
    if (!companyId) return;
    try {
      const { data, error } = await supabase
        .from("product_variation_options")
        .insert({ company_id: companyId, dimension_id: dimensionId, name })
        .select("*")
        .single();
      if (error) throw error;
      toast.success("Option created");
      invalidateDimensionsCache();
      return data as VariationOption;
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to create option");
    }
  };

  const deleteOption = async (optionId: string) => {
    try {
      const { error } = await supabase
        .from("product_variation_options")
        .delete()
        .eq("id", optionId);
      if (error) throw error;
      toast.success("Option deleted");
      invalidateDimensionsCache();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to delete option");
    }
  };

  return {
    dimensions,
    optionsByDimension,
    productVariantOptions,
    loading,
    refresh: load,
    createDimension,
    updateDimension,
    deleteDimension,
    createOption,
    deleteOption,
  };
}
