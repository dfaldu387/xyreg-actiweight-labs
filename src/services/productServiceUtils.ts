import { supabase } from "@/integrations/supabase/client";

/**
 * Generate full product name from model name and variant display name
 */
export function generateFullProductName(
  modelName: string, 
  variantDisplayName: string | null
): string {
  if (!variantDisplayName) {
    return modelName;
  }
  return `${modelName} - ${variantDisplayName}`;
}

/**
 * Get product with full model context (model + siblings)
 */
export async function getProductWithModelContext(productId: string) {
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (productError) throw productError;
  if (!product) return null;

  let model = null;
  let siblings = [];

  if (product.model_id) {
    // Get model details
    const { data: modelData, error: modelError } = await supabase
      .from('company_product_models')
      .select('*')
      .eq('id', product.model_id)
      .single();

    if (modelError) throw modelError;
    model = modelData;

    // Get sibling variants
    const { data: siblingData, error: siblingsError } = await supabase
      .from('products')
      .select('*')
      .eq('model_id', product.model_id)
      .neq('id', productId)
      .eq('is_archived', false)
      .order('variant_sequence', { nullsFirst: false });

    if (siblingsError) throw siblingsError;
    siblings = siblingData || [];
  }

  return {
    product,
    model,
    siblings
  };
}

/**
 * Get effective price for a product (considers inheritance)
 */
export async function getEffectivePrice(productId: string): Promise<number | null> {
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('inherit_pricing_from_model, model_id')
    .eq('id', productId)
    .single();

  if (productError) throw productError;
  if (!product) return null;

  // If inheriting from model, get model price
  if (product.inherit_pricing_from_model && product.model_id) {
    const { data: model, error: modelError } = await supabase
      .from('company_product_models')
      .select('model_price')
      .eq('id', product.model_id)
      .single();

    if (modelError) throw modelError;
    return model?.model_price || null;
  }

  // Otherwise return product's own price (assuming products table has a price field)
  // This would need to be adjusted based on your actual product pricing schema
  return null;
}

/**
 * Get effective regulatory data for a product (considers overrides)
 */
export async function getEffectiveRegulatoryData(productId: string): Promise<{
  regulatory_class: string | null;
  risk_class: string | null;
  has_override: boolean;
  override_reason: string | null;
}> {
  const { data: product, error: productError } = await supabase
    .from('products')
    .select(`
      regulatory_override_reason,
      model_id
    `)
    .eq('id', productId)
    .single();

  if (productError) throw productError;
  if (!product) {
    return {
      regulatory_class: null,
      risk_class: null,
      has_override: false,
      override_reason: null
    };
  }

  const hasOverride = !!product.regulatory_override_reason;

  // If has override, product has its own regulatory data
  if (hasOverride) {
    const { data: fullProduct, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) throw error;

    return {
      regulatory_class: (fullProduct as any).regulatory_class || null,
      risk_class: (fullProduct as any).risk_class || null,
      has_override: true,
      override_reason: product.regulatory_override_reason
    };
  }

  // Otherwise, inherit from model if exists
  if (product.model_id) {
    const { data: model, error: modelError } = await supabase
      .from('company_product_models')
      .select('regulatory_class, risk_class')
      .eq('id', product.model_id)
      .single();

    if (modelError) throw modelError;

    return {
      regulatory_class: model?.regulatory_class || null,
      risk_class: model?.risk_class || null,
      has_override: false,
      override_reason: null
    };
  }

  // No model, no override - return product's own data
  const { data: fullProduct, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (error) throw error;

  return {
    regulatory_class: (fullProduct as any).regulatory_class || null,
    risk_class: (fullProduct as any).risk_class || null,
    has_override: false,
    override_reason: null
  };
}

/**
 * Update model price and propagate to all variants that inherit pricing
 */
export async function updateModelPriceAndPropagate(
  modelId: string, 
  newPrice: number
): Promise<{ updatedCount: number; variantIds: string[] }> {
  // Update model price
  const { error: modelError } = await supabase
    .from('company_product_models')
    .update({ model_price: newPrice })
    .eq('id', modelId);

  if (modelError) throw modelError;

  // Get variants that inherit pricing
  const { data: variants, error: variantsError } = await supabase
    .from('products')
    .select('id')
    .eq('model_id', modelId)
    .eq('inherit_pricing_from_model', true);

  if (variantsError) throw variantsError;

  const variantIds = (variants || []).map(v => v.id);
  
  return {
    updatedCount: variantIds.length,
    variantIds
  };
}
