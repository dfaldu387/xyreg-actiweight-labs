import { supabase } from "@/integrations/supabase/client";

export interface ProductDefinitionData {
  intended_use?: string | null;
  intended_purpose_data?: any;
  intended_users?: any;
  mode_of_action?: string | null;
  contraindications?: string[] | null;
  warnings?: string | null;
  precautions?: string | null;
}

export interface EffectiveDefinition extends ProductDefinitionData {
  isInherited: boolean;
  hasOverride: boolean;
  overrideReason?: string | null;
  modelId?: string | null;
  modelName?: string | null;
}

/**
 * Get effective product definition (considers model inheritance)
 */
export async function getEffectiveDefinition(productId: string): Promise<EffectiveDefinition> {
  // Get product with model info
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*, company_product_models(*)')
    .eq('id', productId)
    .single();

  if (productError) throw productError;
  if (!product) throw new Error('Product not found');

  const hasOverride = product.has_definition_override || false;
  const model = product.company_product_models;

  // If has override, use product's own data
  if (hasOverride) {
    return {
      intended_use: (product as any).intended_use,
      intended_purpose_data: (product as any).intended_purpose_data,
      intended_users: (product as any).intended_users,
      mode_of_action: (product as any).mode_of_action,
      contraindications: (product as any).contraindications,
      warnings: (product as any).warnings,
      precautions: (product as any).precautions,
      isInherited: false,
      hasOverride: true,
      overrideReason: (product as any).definition_override_reason,
      modelId: product.model_id,
      modelName: model?.name
    };
  }

  // If has model, inherit from model
  if (product.model_id && model) {
    return {
      intended_use: (model as any).intended_use,
      intended_purpose_data: (model as any).intended_purpose_data,
      intended_users: (model as any).intended_users,
      mode_of_action: (model as any).mode_of_action,
      contraindications: (model as any).contraindications,
      warnings: (model as any).warnings,
      precautions: (model as any).precautions,
      isInherited: true,
      hasOverride: false,
      modelId: model.id,
      modelName: model.name
    };
  }

  // Standalone product - use its own data
  return {
    intended_use: (product as any).intended_use,
    intended_purpose_data: (product as any).intended_purpose_data,
    intended_users: (product as any).intended_users,
    mode_of_action: (product as any).mode_of_action,
    contraindications: (product as any).contraindications,
    warnings: (product as any).warnings,
    precautions: (product as any).precautions,
    isInherited: false,
    hasOverride: false
  };
}

export type ApplyToOption = 'variant-only' | 'all-variants' | 'model';

/**
 * Update product definition with inheritance logic
 */
export async function updateDefinitionWithInheritance(
  productId: string,
  data: ProductDefinitionData,
  applyTo: ApplyToOption
): Promise<{ updatedCount: number; variantIds: string[] }> {
  // Get product with model
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('model_id, company_id')
    .eq('id', productId)
    .single();

  if (productError) throw productError;
  if (!product) throw new Error('Product not found');

  if (applyTo === 'variant-only') {
    // Update only this variant
    const { error } = await supabase
      .from('products')
      .update(data)
      .eq('id', productId);

    if (error) throw error;
    return { updatedCount: 1, variantIds: [productId] };
  }

  if (applyTo === 'model' && product.model_id) {
    // Update the model
    const { error: modelError } = await supabase
      .from('company_product_models')
      .update(data)
      .eq('id', product.model_id);

    if (modelError) throw modelError;

    // Get all variants that inherit (no override)
    const { data: variants, error: variantsError } = await supabase
      .from('products')
      .select('id')
      .eq('model_id', product.model_id)
      .eq('has_definition_override', false);

    if (variantsError) throw variantsError;

    const variantIds = (variants || []).map(v => v.id);
    return { updatedCount: variantIds.length, variantIds };
  }

  if (applyTo === 'all-variants' && product.model_id) {
    // Update all variants directly (regardless of override status)
    const { data: variants, error: variantsError } = await supabase
      .from('products')
      .select('id')
      .eq('model_id', product.model_id);

    if (variantsError) throw variantsError;

    const variantIds = (variants || []).map(v => v.id);

    // Update all variants
    const { error: updateError } = await supabase
      .from('products')
      .update({ ...data, has_definition_override: false, definition_override_reason: null })
      .in('id', variantIds);

    if (updateError) throw updateError;

    // Also update model
    const { error: modelError } = await supabase
      .from('company_product_models')
      .update(data)
      .eq('id', product.model_id);

    if (modelError) throw modelError;

    return { updatedCount: variantIds.length, variantIds };
  }

  // Fallback to variant-only
  const { error } = await supabase
    .from('products')
    .update(data)
    .eq('id', productId);

  if (error) throw error;
  return { updatedCount: 1, variantIds: [productId] };
}

/**
 * Create definition override for a variant
 */
export async function createDefinitionOverride(
  productId: string,
  data: ProductDefinitionData,
  reason: string
): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({
      ...data,
      has_definition_override: true,
      definition_override_reason: reason
    })
    .eq('id', productId);

  if (error) throw error;
}

/**
 * Remove definition override (revert to model inheritance)
 */
export async function removeDefinitionOverride(productId: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({
      has_definition_override: false,
      definition_override_reason: null,
      intended_use: null,
      intended_purpose_data: null,
      intended_users: null,
      mode_of_action: null,
      contraindications: null,
      warnings: null,
      precautions: null
    })
    .eq('id', productId);

  if (error) throw error;
}

/**
 * Get model definition data
 */
export async function getModelDefinition(modelId: string): Promise<ProductDefinitionData> {
  const { data: model, error } = await supabase
    .from('company_product_models')
    .select('intended_use, intended_purpose_data, intended_users, mode_of_action, contraindications, warnings, precautions')
    .eq('id', modelId)
    .single();

  if (error) throw error;
  return model;
}

/**
 * Update model definition
 */
export async function updateModelDefinition(
  modelId: string,
  data: ProductDefinitionData
): Promise<void> {
  const { error } = await supabase
    .from('company_product_models')
    .update(data)
    .eq('id', modelId);

  if (error) throw error;
}

/**
 * Get variant count for model by inheritance status
 */
export async function getModelVariantStats(modelId: string): Promise<{
  totalVariants: number;
  inheritingVariants: number;
  overriddenVariants: number;
}> {
  const { data: variants, error } = await supabase
    .from('products')
    .select('id, has_definition_override')
    .eq('model_id', modelId)
    .eq('is_archived', false);

  if (error) throw error;

  const totalVariants = (variants || []).length;
  const overriddenVariants = (variants || []).filter(v => v.has_definition_override).length;
  const inheritingVariants = totalVariants - overriddenVariants;

  return { totalVariants, inheritingVariants, overriddenVariants };
}
