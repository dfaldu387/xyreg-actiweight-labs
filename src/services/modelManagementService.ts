import { supabase } from "@/integrations/supabase/client";

export interface RegulatoryOverride {
  reason: string;
  userId: string;
  timestamp: string;
}

export interface VariantProduct {
  id: string;
  name: string;
  variant_display_name: string | null;
  variant_sequence: number | null;
  model_id: string | null;
  is_variant: boolean;
  inherit_pricing_from_model: boolean;
  regulatory_override_reason: string | null;
  regulatory_override_by: string | null;
  regulatory_override_at: string | null;
  [key: string]: any;
}

export interface ModelWithVariants {
  id: string;
  name: string;
  description: string | null;
  model_code: string | null;
  basic_udi_di: string | null;
  primary_product_id: string | null;
  variant_count: number;
  is_active: boolean;
  regulatory_class: string | null;
  risk_class: string | null;
  model_price: number | null;
  company_id: string;
  variants: VariantProduct[];
}

export class ModelManagementService {
  /**
   * Get all models with their variants for a company
   */
  static async getModelsWithVariants(companyId: string): Promise<ModelWithVariants[]> {
    const { data: models, error: modelsError } = await supabase
      .from('company_product_models')
      .select('*')
      .eq('company_id', companyId)
      .order('name');

    if (modelsError) throw modelsError;
    if (!models) return [];

    // Get variants for all models
    const modelsWithVariants: ModelWithVariants[] = await Promise.all(
      models.map(async (model) => {
        const { data: variants, error: variantsError } = await supabase
          .from('products')
          .select('*')
          .eq('model_id', model.id)
          .eq('is_archived', false)
          .order('variant_sequence', { nullsFirst: false });

        if (variantsError) throw variantsError;

        return {
          ...model,
          variants: (variants || []) as VariantProduct[]
        };
      })
    );

    return modelsWithVariants;
  }

  /**
   * Get a single model with its variants
   */
  static async getModelById(modelId: string): Promise<ModelWithVariants | null> {
    const { data: model, error: modelError } = await supabase
      .from('company_product_models')
      .select('*')
      .eq('id', modelId)
      .single();

    if (modelError) throw modelError;
    if (!model) return null;

    const { data: variants, error: variantsError } = await supabase
      .from('products')
      .select('*')
      .eq('model_id', modelId)
      .eq('is_archived', false)
      .order('variant_sequence', { nullsFirst: false });

    if (variantsError) throw variantsError;

    return {
      ...model,
      variants: (variants || []) as VariantProduct[]
    };
  }

  /**
   * Create a new model
   */
  static async createModel(
    companyId: string, 
    data: {
      name: string;
      description?: string;
      model_code?: string;
      basic_udi_di?: string;
      regulatory_class?: string;
      risk_class?: string;
      model_price?: number;
    }
  ): Promise<string> {
    const { data: result, error } = await supabase
      .from('company_product_models')
      .insert({
        company_id: companyId,
        name: data.name,
        description: data.description,
        model_code: data.model_code,
        basic_udi_di: data.basic_udi_di,
        regulatory_class: data.regulatory_class,
        risk_class: data.risk_class,
        model_price: data.model_price,
        is_active: true,
        variant_count: 0
      })
      .select('id')
      .single();

    if (error) throw error;
    return result.id;
  }

  /**
   * Update model properties
   */
  static async updateModel(
    modelId: string, 
    data: {
      name?: string;
      description?: string;
      model_code?: string;
      basic_udi_di?: string;
      regulatory_class?: string;
      risk_class?: string;
      model_price?: number;
      is_active?: boolean;
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('company_product_models')
      .update(data)
      .eq('id', modelId);

    if (error) throw error;
  }

  /**
   * Delete a model and handle variant reassignment
   */
  static async deleteModel(modelId: string): Promise<void> {
    // First, remove model_id from all products
    const { error: updateError } = await supabase
      .from('products')
      .update({ 
        model_id: null,
        is_variant: false,
        variant_sequence: null,
        inherit_pricing_from_model: false
      })
      .eq('model_id', modelId);

    if (updateError) throw updateError;

    // Then delete the model
    const { error: deleteError } = await supabase
      .from('company_product_models')
      .delete()
      .eq('id', modelId);

    if (deleteError) throw deleteError;
  }

  /**
   * Set the primary/representative product for a model
   */
  static async setModelPrimaryProduct(modelId: string, productId: string): Promise<void> {
    const { error } = await supabase
      .from('company_product_models')
      .update({ primary_product_id: productId })
      .eq('id', modelId);

    if (error) throw error;
  }

  /**
   * Reorder variants by setting sequence numbers
   */
  static async reorderVariants(modelId: string, variantIds: string[]): Promise<void> {
    const updates = variantIds.map((id, index) => ({
      id,
      variant_sequence: index + 1
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from('products')
        .update({ variant_sequence: update.variant_sequence })
        .eq('id', update.id)
        .eq('model_id', modelId);

      if (error) throw error;
    }
  }

  /**
   * Convert a standalone product to a model (create model from product)
   */
  static async convertProductToModel(productId: string, modelData?: {
    model_code?: string;
    description?: string;
  }): Promise<string> {
    // Get the product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError) throw productError;
    if (!product) throw new Error('Product not found');

    // Create model from product data
    const { data: model, error: modelError } = await supabase
      .from('company_product_models')
      .insert({
        company_id: product.company_id,
        name: product.name,
        description: modelData?.description,
        model_code: modelData?.model_code,
        basic_udi_di: product.basic_udi_di,
        is_active: true,
        variant_count: 1
      })
      .select('id')
      .single();

    if (modelError) throw modelError;

    // Link product to model
    const { error: updateError } = await supabase
      .from('products')
      .update({
        model_id: model.id,
        is_variant: true,
        variant_sequence: 1
      })
      .eq('id', productId);

    if (updateError) throw updateError;

    return model.id;
  }

  /**
   * Link a product to a model as a variant
   */
  static async linkProductToModel(
    productId: string, 
    modelId: string, 
    variantDisplayName?: string
  ): Promise<void> {
    // Get current max sequence for this model
    const { data: variants, error: variantsError } = await supabase
      .from('products')
      .select('variant_sequence')
      .eq('model_id', modelId)
      .order('variant_sequence', { ascending: false })
      .limit(1);

    if (variantsError) throw variantsError;

    const nextSequence = variants && variants.length > 0 && variants[0].variant_sequence
      ? variants[0].variant_sequence + 1
      : 1;

    const { error } = await supabase
      .from('products')
      .update({
        model_id: modelId,
        is_variant: true,
        variant_sequence: nextSequence,
        variant_display_name: variantDisplayName
      })
      .eq('id', productId);

    if (error) throw error;
  }

  /**
   * Get all variants in the same model (sibling variants)
   */
  static async getVariantSiblings(productId: string): Promise<VariantProduct[]> {
    // Get the product's model_id
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('model_id')
      .eq('id', productId)
      .single();

    if (productError) throw productError;
    if (!product || !product.model_id) return [];

    // Get all variants in the same model
    const { data: variants, error: variantsError } = await supabase
      .from('products')
      .select('*')
      .eq('model_id', product.model_id)
      .eq('is_archived', false)
      .neq('id', productId)
      .order('variant_sequence', { nullsFirst: false });

    if (variantsError) throw variantsError;
    return (variants || []) as VariantProduct[];
  }

  /**
   * Get regulatory data inherited from model
   */
  static async calculateInheritedRegulatoryData(modelId: string): Promise<{
    regulatory_class: string | null;
    risk_class: string | null;
  }> {
    const { data: model, error } = await supabase
      .from('company_product_models')
      .select('regulatory_class, risk_class')
      .eq('id', modelId)
      .single();

    if (error) throw error;

    return {
      regulatory_class: model?.regulatory_class || null,
      risk_class: model?.risk_class || null
    };
  }

  /**
   * Apply regulatory override to a product variant
   */
  static async applyRegulatoryOverride(
    productId: string,
    overrideData: {
      regulatory_class?: string;
      risk_class?: string;
    },
    reason: string,
    userId: string
  ): Promise<void> {
    if (!reason || reason.trim() === '') {
      throw new Error('Override reason is required');
    }

    const { error } = await supabase
      .from('products')
      .update({
        ...overrideData,
        regulatory_override_reason: reason,
        regulatory_override_by: userId,
        regulatory_override_at: new Date().toISOString()
      })
      .eq('id', productId);

    if (error) throw error;
  }
}
