import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string | null;
  description: string | null;
  status: string;
}

export interface VariantValueRow {
  id: string;
  product_variant_id: string;
  dimension_id: string;
  option_id: string | null;
  value_text: string | null;
}

interface VariantsData {
  variants: ProductVariant[];
  values: VariantValueRow[];
}

async function fetchVariantsData(productId: string): Promise<VariantsData> {
  const { data: vs, error: vErr } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: true });
  if (vErr) throw vErr;

  // Map to ensure description field is included (may be null if column doesn't exist yet)
  const variants = (vs || []).map(v => ({
    ...v,
    description: (v as any).description || null
  })) as ProductVariant[];

  let values: VariantValueRow[] = [];
  if (variants.length > 0) {
    const { data: vals, error: valErr } = await supabase
      .from("product_variant_values")
      .select("*")
      .in("product_variant_id", variants.map(x => x.id));
    if (valErr) throw valErr;
    values = vals || [];
  }

  return { variants, values };
}

export function useProductVariants(productId?: string) {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);

  const { data, isLoading: loading, refetch } = useQuery({
    queryKey: ['product-variants', productId],
    queryFn: () => fetchVariantsData(productId!),
    enabled: !!productId,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  const variants = data?.variants || [];
  const values = data?.values || [];

  const load = async () => {
    await refetch();
  };

  const createVariant = async (name?: string, description?: string) => {
    if (!productId || creating) return;
    
    setCreating(true);
    try {
      const displayName = name || `Variant ${(variants?.length || 0) + 1}`;
      
      // Check if a variant with this name already exists
      const existingVariant = variants.find(v => v.name === displayName);
      if (existingVariant) {
        console.log(`Variant "${displayName}" already exists, skipping creation`);
        return existingVariant;
      }
      
      const { data, error } = await supabase
        .from("product_variants")
        .insert({ 
          product_id: productId, 
          name: displayName,
          description: description || null
        })
        .select("*")
        .single();
      if (error) throw error;
      toast.success("Variant created");
      // Invalidate cache to refetch
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
      return {
        ...data,
        description: (data as any).description || null
      } as ProductVariant;
    } catch (e: any) {
      console.error(e);
      // Only show error if it's not a duplicate constraint violation
      if (!e.message?.includes('duplicate key value violates unique constraint')) {
        toast.error(e.message || "Failed to create variant");
      }
    } finally {
      setCreating(false);
    }
  };

  const deleteVariant = async (variantId: string) => {
    try {
      const { error } = await supabase
        .from("product_variants")
        .delete()
        .eq("id", variantId);
      if (error) throw error;
      toast.success("Variant deleted");
      // Invalidate cache to refetch
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to delete variant");
    }
  };

  const setVariantOption = async (variantId: string, dimensionId: string, optionId: string | null) => {
    try {
      // Validate inputs
      if (!variantId || variantId === 'undefined') {
        throw new Error('Invalid variant ID');
      }
      if (!dimensionId || dimensionId === 'undefined') {
        throw new Error('Invalid dimension ID');
      }
      
      // Convert undefined string to null
      const cleanOptionId = optionId === 'undefined' ? null : optionId;
      
      // Upsert the row for this variant + dimension
      // First check if exists
      const existing = values.find(v => v.product_variant_id === variantId && v.dimension_id === dimensionId);
      if (existing) {
        const { error } = await supabase
          .from("product_variant_values")
          .update({ option_id: cleanOptionId })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("product_variant_values")
          .insert({ product_variant_id: variantId, dimension_id: dimensionId, option_id: cleanOptionId });
        if (error) throw error;
      }
      // Invalidate cache to refetch
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to set option");
    }
  };

  return {
    variants,
    values,
    loading,
    creating,
    refresh: load,
    createVariant,
    deleteVariant,
    setVariantOption,
  };
}
