import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { computeVariantSummary, VariantGroupSummary } from "@/services/variantGroupService";

export interface UseProductVariantSummaryReturn {
  summary: VariantGroupSummary | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch and manage product variant summary data
 */
export function useProductVariantSummary(productId?: string): UseProductVariantSummaryReturn {
  const [summary, setSummary] = useState<VariantGroupSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = async () => {
    if (!productId) {
      setSummary(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First, try to get cached summary from products table
      const { data: product, error: productErr } = await supabase
        .from("products")
        .select("variant_group_summary, display_as_variant_group")
        .eq("id", productId)
        .single();

      if (productErr) throw productErr;

      // If cached summary exists and variant grouping is enabled, use it
      if (product?.variant_group_summary && product?.display_as_variant_group) {
        setSummary(product.variant_group_summary as VariantGroupSummary);
      } else {
        // Otherwise, compute it fresh
        const computed = await computeVariantSummary(productId);
        setSummary(computed);
      }
    } catch (err) {
      console.error("Error loading variant summary:", err);
      setError(err as Error);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [productId]);

  return {
    summary,
    loading,
    error,
    refresh: load,
  };
}
