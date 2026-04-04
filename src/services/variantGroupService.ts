import { supabase } from "@/integrations/supabase/client";

export interface VariantDimensionSummary {
  count: number;
  value?: string;
  values?: string[];
}

export interface VariantGroupSummary {
  [dimensionName: string]: VariantDimensionSummary;
}

/**
 * Computes the variant summary for a product by aggregating variant dimension data
 * Returns a summary object like: { "Size": { count: 5, values: ["XL", "L", "M", "S", "P"] } }
 */
export async function computeVariantSummary(productId: string): Promise<VariantGroupSummary> {
  try {
    // Get all variants for this product
    const { data: variants, error: varErr } = await supabase
      .from("product_variants")
      .select("id")
      .eq("product_id", productId);
    
    if (varErr) throw varErr;
    if (!variants || variants.length === 0) return {};

    const variantIds = variants.map(v => v.id);

    // Get all variant values with dimension and option info
    const { data: variantValues, error: valErr } = await supabase
      .from("product_variant_values")
      .select(`
        dimension_id,
        option_id,
        product_variation_options!inner(name),
        product_variation_dimensions!inner(name)
      `)
      .in("product_variant_id", variantIds);
    
    if (valErr) throw valErr;
    if (!variantValues) return {};

    // Group by dimension
    const dimensionMap: Record<string, Set<string>> = {};
    
    variantValues.forEach((vv: any) => {
      const dimensionName = vv.product_variation_dimensions?.name;
      const optionName = vv.product_variation_options?.name;
      
      if (dimensionName && optionName) {
        if (!dimensionMap[dimensionName]) {
          dimensionMap[dimensionName] = new Set();
        }
        dimensionMap[dimensionName].add(optionName);
      }
    });

    // Convert to summary format
    const summary: VariantGroupSummary = {};
    Object.entries(dimensionMap).forEach(([dimName, optionsSet]) => {
      const optionsArray = Array.from(optionsSet).sort();
      summary[dimName] = {
        count: optionsArray.length,
        ...(optionsArray.length === 1 
          ? { value: optionsArray[0] }
          : { values: optionsArray }
        )
      };
    });

    return summary;
  } catch (error) {
    console.error("Error computing variant summary:", error);
    throw error;
  }
}

/**
 * Updates the variant_group_summary field in the products table
 */
export async function updateProductVariantSummary(productId: string): Promise<void> {
  try {
    const summary = await computeVariantSummary(productId);
    
    const { error } = await supabase
      .from("products")
      .update({ variant_group_summary: summary as any })
      .eq("id", productId);
    
    if (error) throw error;
  } catch (error) {
    console.error("Error updating product variant summary:", error);
    throw error;
  }
}

/**
 * Enables variant group display for a product and computes its summary
 */
export async function enableVariantGroupDisplay(productId: string): Promise<void> {
  try {
    const summary = await computeVariantSummary(productId);
    
    const { error } = await supabase
      .from("products")
      .update({ 
        display_as_variant_group: true,
        variant_group_summary: summary as any
      })
      .eq("id", productId);
    
    if (error) throw error;
  } catch (error) {
    console.error("Error enabling variant group display:", error);
    throw error;
  }
}

/**
 * Disables variant group display for a product
 */
export async function disableVariantGroupDisplay(productId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("products")
      .update({ 
        display_as_variant_group: false,
        variant_group_summary: null 
      })
      .eq("id", productId);
    
    if (error) throw error;
  } catch (error) {
    console.error("Error disabling variant group display:", error);
    throw error;
  }
}
