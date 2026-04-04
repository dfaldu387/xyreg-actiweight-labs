import { supabase } from "@/integrations/supabase/client";

export interface CompanyProductModel {
  id?: string;
  name: string;
  productCount: number;
  isStandalone?: boolean;
  description?: string;
  model_code?: string;
  basic_udi_di?: string;
  primary_product_id?: string;
  variant_count?: number;
  is_active?: boolean;
  regulatory_class?: string;
  risk_class?: string;
  model_price?: number;
}

export interface CreateModelData {
  name: string;
  description?: string;
  model_code?: string;
  basic_udi_di?: string;
  regulatory_class?: string;
  risk_class?: string;
  model_price?: number;
}

export class CompanyProductModelsService {
  // Get combined standalone + product-derived models
  static async getDistinctModels(companyId: string): Promise<CompanyProductModel[]> {
    // Get standalone models with all new fields
    const { data: standaloneModels, error: standaloneError } = await supabase
      .from('company_product_models')
      .select('*')
      .eq('company_id', companyId);

    if (standaloneError) throw standaloneError;

    // Get product-derived models
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('model_reference')
      .eq('company_id', companyId)
      .eq('is_archived', false);

    if (productError) throw productError;

    // Count product-derived models
    const productCounts = new Map<string, number>();
    (productData || []).forEach((row: any) => {
      const m = (row.model_reference || '').trim();
      if (!m) return;
      productCounts.set(m, (productCounts.get(m) || 0) + 1);
    });

    // Combine results
    const result: CompanyProductModel[] = [];
    
    // Add standalone models
    (standaloneModels || []).forEach(model => {
      result.push({
        id: model.id,
        name: model.name,
        description: model.description,
        productCount: productCounts.get(model.name) || 0,
        isStandalone: true
      });
      // Remove from product counts to avoid duplicates
      productCounts.delete(model.name);
    });

    // Add remaining product-derived models
    Array.from(productCounts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([name, productCount]) => {
        result.push({ name, productCount, isStandalone: false });
      });

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Create new standalone model
  static async createModel(companyId: string, data: CreateModelData): Promise<string> {
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

  // Update standalone model
  static async updateModel(companyId: string, modelId: string, data: CreateModelData): Promise<void> {
    const { error } = await supabase
      .from('company_product_models')
      .update({
        name: data.name,
        description: data.description,
        model_code: data.model_code,
        basic_udi_di: data.basic_udi_di,
        regulatory_class: data.regulatory_class,
        risk_class: data.risk_class,
        model_price: data.model_price
      })
      .eq('company_id', companyId)
      .eq('id', modelId);

    if (error) throw error;
  }

  // Get models with their variants in hierarchical format
  static async getModelsHierarchical(companyId: string) {
    const { data: models, error: modelsError } = await supabase
      .from('company_product_models')
      .select('*')
      .eq('company_id', companyId)
      .order('name');

    if (modelsError) throw modelsError;
    if (!models) return [];

    // Get variants for each model
    const modelsWithVariants = await Promise.all(
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
          variants: variants || []
        };
      })
    );

    return modelsWithVariants;
  }

  // Get all variants for a specific model
  static async getModelVariants(modelId: string) {
    const { data: variants, error } = await supabase
      .from('products')
      .select('*')
      .eq('model_id', modelId)
      .eq('is_archived', false)
      .order('variant_sequence', { nullsFirst: false });

    if (error) throw error;
    return variants || [];
  }

  static async renameModel(companyId: string, oldName: string, newName: string): Promise<number> {
    const { data, error } = await supabase
      .from('products')
      .update({ model_reference: newName })
      .eq('company_id', companyId)
      .eq('model_reference', oldName)
      .select('id');

    if (error) throw error;
    return (data || []).length;
  }

  static async deleteModel(companyId: string, modelName: string): Promise<number> {
    // Set to null on products that used this model
    const { data, error } = await supabase
      .from('products')
      .update({ model_reference: null })
      .eq('company_id', companyId)
      .eq('model_reference', modelName)
      .select('id');

    if (error) throw error;
    return (data || []).length;
  }
}