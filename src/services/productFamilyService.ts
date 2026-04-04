import { supabase } from "@/integrations/supabase/client";
import { VariantGroupSummary, VariantDimensionSummary } from "./variantGroupService";

export interface ProductWithFamily {
  id: string;
  name: string;
  basic_udi_di: string | null;
  product_family_placeholder: string | null;
  variant_tags: Record<string, string> | null;
  [key: string]: any;
}

export interface FamilySummary {
  familyKey: string;
  familyName: string;
  productCount: number;
  variantSummary: VariantGroupSummary;
  products: ProductWithFamily[];
  isPlaceholder: boolean;
}

/**
 * Gets the family key for a product
 * Priority: Basic UDI-DI > Placeholder ID
 */
export function getFamilyKey(product: ProductWithFamily): string | null {
  if (product.basic_udi_di) return product.basic_udi_di;
  if (product.product_family_placeholder) return `PLACEHOLDER_${product.product_family_placeholder}`;
  return null;
}

/**
 * Extracts base family name by removing variant indicators
 * Only removes trailing parentheses/brackets that contain numbers or single words
 * "Snap-on Electrode Cables (10)" → "Snap-on Electrode Cables"
 * "Snap-on Electrode Cables" → "Snap-on Electrode Cables"
 */
export function extractBaseFamilyName(productName: string): string {
  return productName
    .replace(/\s*\((\d+|[A-Za-z]+)\)\s*$/g, '') // Only remove (10), (I), (II), etc at end
    .replace(/\s*\[(\d+|[A-Za-z]+)\]\s*$/g, '') // Only remove [10], [I], [II], etc at end
    .trim();
}

/**
 * Groups products by their family key (Basic UDI-DI or placeholder)
 */
export function groupProductsByFamily(products: ProductWithFamily[]): Map<string, ProductWithFamily[]> {
  const grouped = new Map<string, ProductWithFamily[]>();
  
  products.forEach(product => {
    const familyKey = getFamilyKey(product);
    if (familyKey) {
      if (!grouped.has(familyKey)) {
        grouped.set(familyKey, []);
      }
      grouped.get(familyKey)!.push(product);
    }
  });
  
  return grouped;
}

/**
 * Computes variant summary by aggregating variant_tags across all products in a family
 */
export function computeFamilySummary(
  familyKey: string, 
  products: ProductWithFamily[]
): FamilySummary {
  // Aggregate variant tags across all products
  const dimensionMap: Record<string, Set<string>> = {};
  
  products.forEach(product => {
    if (product.variant_tags) {
      Object.entries(product.variant_tags).forEach(([dimName, optionValue]) => {
        if (!dimensionMap[dimName]) {
          dimensionMap[dimName] = new Set();
        }
        dimensionMap[dimName].add(optionValue);
      });
    }
  });
  
  // Convert to variant summary format
  const variantSummary: VariantGroupSummary = {};
  Object.entries(dimensionMap).forEach(([dimName, optionsSet]) => {
    const optionsArray = Array.from(optionsSet).sort();
    const summary: VariantDimensionSummary = {
      count: optionsArray.length
    };
    
    if (optionsArray.length === 1) {
      summary.value = optionsArray[0];
    } else {
      summary.values = optionsArray;
    }
    
    variantSummary[dimName] = summary;
  });
  
  // Extract base family name from first product
  const familyName = products.length > 0 
    ? extractBaseFamilyName(products[0].name) 
    : familyKey;
  
  return {
    familyKey,
    familyName,
    productCount: products.length,
    variantSummary,
    products,
    isPlaceholder: familyKey.startsWith('PLACEHOLDER_')
  };
}

/**
 * Gets all product families for a company
 */
export async function getProductFamilies(companyId: string): Promise<FamilySummary[]> {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, basic_udi_di, product_family_placeholder, variant_tags')
      .eq('company_id', companyId)
      .eq('is_archived', false);
    
    if (error) throw error;
    if (!products) return [];
    
    const grouped = groupProductsByFamily(products as ProductWithFamily[]);
    const families: FamilySummary[] = [];
    
    grouped.forEach((familyProducts, familyKey) => {
      if (familyProducts.length > 1) { // Only create families with multiple products
        families.push(computeFamilySummary(familyKey, familyProducts));
      }
    });
    
    // Sort by product count (descending)
    return families.sort((a, b) => b.productCount - a.productCount);
  } catch (error) {
    console.error('Error fetching product families:', error);
    throw error;
  }
}

/**
 * Updates variant tags for a product
 */
export async function updateProductVariantTags(
  productId: string, 
  tags: Record<string, string>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('products')
      .update({ variant_tags: tags })
      .eq('id', productId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error updating product variant tags:', error);
    throw error;
  }
}

/**
 * Updates family placeholder for a product
 */
export async function updateProductFamilyPlaceholder(
  productId: string,
  placeholder: string | null
): Promise<void> {
  try {
    const { error } = await supabase
      .from('products')
      .update({ product_family_placeholder: placeholder })
      .eq('id', productId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error updating product family placeholder:', error);
    throw error;
  }
}

/**
 * Gets all products in a family by family key (excluding legacy master products)
 */
export async function getProductsByFamily(
  companyId: string, 
  familyKey: string
): Promise<ProductWithFamily[]> {
  try {
    const isPlaceholder = familyKey.startsWith('PLACEHOLDER_');
    const cleanKey = isPlaceholder ? familyKey.replace('PLACEHOLDER_', '') : familyKey;
    
    const query = supabase
      .from('products')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_archived', false)
      .eq('is_master_product', false);  // Exclude legacy master products
    
    if (isPlaceholder) {
      query.eq('product_family_placeholder', cleanKey);
    } else {
      query.eq('basic_udi_di', cleanKey);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return (data || []) as ProductWithFamily[];
  } catch (error) {
    console.error('Error fetching products by family:', error);
    throw error;
  }
}

/**
 * Creates a product model from a family by linking all products to a new model
 * Returns the new model ID
 */
export async function createModelFromFamily(params: {
  templateProductId: string;
  familyKey: string;
  companyId: string;
}): Promise<string> {
  try {
    const { templateProductId, familyKey, companyId } = params;
    
    // Get the template product to extract model information
    const { data: templateProduct, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', templateProductId)
      .single();
    
    if (fetchError) throw fetchError;
    if (!templateProduct) throw new Error('Template product not found');
    
    // Get all products in the family
    const products = await getProductsByFamily(companyId, familyKey);
    if (products.length === 0) throw new Error('No products found in family');
    
    // Extract family name from products
    const familyName = extractBaseFamilyName(templateProduct.name);
    
    // Create the model record
    const { data: newModel, error: modelError } = await supabase
      .from('company_product_models')
      .insert({
        company_id: companyId,
        name: familyName,
        description: `Model created from product family: ${familyKey}`,
        is_active: true,
        variant_count: products.length,
        primary_product_id: templateProductId,
      })
      .select('id')
      .single();
    
    if (modelError) throw modelError;
    if (!newModel) throw new Error('Failed to create model');
    
    // Link all products to the model via model_id
    const productIds = products.map(p => p.id);
    const { error: linkError } = await supabase
      .from('products')
      .update({ 
        model_id: newModel.id,
        model_reference: familyName,
      })
      .in('id', productIds);
    
    if (linkError) throw linkError;
    
    return newModel.id;
  } catch (error) {
    console.error('Error creating model from family:', error);
    throw error;
  }
}

/**
 * Gets the model for a product family (if one exists)
 * Returns current product count (excluding legacy master products)
 */
export async function getFamilyModel(
  companyId: string,
  familyKey: string
): Promise<{ id: string; name: string; variant_count: number } | null> {
  try {
    // Get products in the family (already excludes master products)
    const products = await getProductsByFamily(companyId, familyKey);
    if (products.length === 0) return null;
    
    // Check if any product has a model_id
    const productWithModel = products.find(p => p.model_id);
    if (!productWithModel) return null;
    
    // Get the model and return actual current product count
    const { data: model, error } = await supabase
      .from('company_product_models')
      .select('id, name')
      .eq('id', productWithModel.model_id)
      .single();
    
    if (error) throw error;
    
    // Return model with current product count instead of stored variant_count
    return model ? {
      ...model,
      variant_count: products.length  // Use actual current count
    } : null;
  } catch (error) {
    console.error('Error fetching family model:', error);
    return null;
  }
}
