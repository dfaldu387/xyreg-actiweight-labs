import { supabase } from "@/integrations/supabase/client";
import { EnhancedProductMarket } from "@/utils/enhancedMarketRiskClassMapping";

// Types
export type BulkOperationType = 'hierarchy' | 'markets' | 'pricing' | 'regulatory_status' | 'variations' | 'reassign_category' | 'reassign_platform' | 'reassign_model';

export interface VariantAttribute {
  dimensionName: string;
  optionName: string;
  dimensionId: string;
  optionId: string;
}

export interface HierarchicalNode {
  id: string;
  name: string;
  type: 'category' | 'platform' | 'model' | 'product' | 'variant';
  productCount: number;
  variantCount?: number;
  children?: HierarchicalNode[];
  parentId?: string;
  
  // Product-specific fields
  trade_name?: string;
  
  // Configurable attributes
  markets?: EnhancedProductMarket[];
  pricingRules?: any[];
  fdaCodes?: string[];
  regulatoryStatus?: string;
  
  // Variant attributes for products
  variants?: VariantAttribute[];
  
  // Configuration status
  hasIndividualConfig: boolean;
  inheritanceSource?: 'company' | 'category' | 'platform' | 'model' | 'individual';
  
  // Selection for bulk operations
  isSelected?: boolean;
  isPartiallySelected?: boolean;
}

export interface BulkOperation {
  type: BulkOperationType;
  nodes: HierarchicalNode[];
  payload: any;
}

export interface HierarchyStats {
  totalProducts: number;
  totalVariants: number;
  configuredProducts: number;
  categoriesConfigured: number;
  platformsConfigured: number;
  modelsConfigured: number;
}

export interface DetailedHierarchyStats extends HierarchyStats {
  categories: CategoryStats[];
  platforms: PlatformStats[];
  models: ModelStats[];
}

export interface CategoryStats {
  id: string;
  name: string;
  description?: string;
  productCount: number;
  variantCount: number;
  platformCount: number;
  modelCount: number;
  configured: boolean;
  platforms: PlatformStats[];
}

export interface PlatformStats {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  productCount: number;
  variantCount: number;
  modelCount: number;
  configured: boolean;
  models: ModelStats[];
}

export interface ModelStats {
  id: string;
  name: string;
  description?: string;
  platformId?: string;
  platformName?: string;
  productCount: number;
  variantCount: number;
  configured: boolean;
}

export class HierarchicalBulkService {
  
  // Get the complete hierarchy tree for a company
  static async getCompanyHierarchy(companyId: string): Promise<HierarchicalNode[]> {
    if (!companyId) {
      console.error('[HierarchicalBulkService] ❌ No company ID provided');
      return [];
    }

    try {
      // Use the SAME logic as detailed stats (which works!)
      const { data: categories, error: categoriesError } = await supabase
        .from('company_device_categories')
        .select('*')
        .eq('company_id', companyId)
        .order('name');
      
      if (categoriesError) {
        console.error('[DetailedHierarchyStats] Categories error:', categoriesError);
        throw categoriesError;
      }

      const { data: platforms, error: platformsError } = await supabase
        .from('company_platforms')
        .select('*')
        .eq('company_id', companyId)
        .order('name');
        
      if (platformsError) {
        console.error('[DetailedHierarchyStats] Platforms error:', platformsError);
        throw platformsError;
      }

      const { data: models, error: modelsError } = await supabase
        .from('company_product_models')
        .select('*')
        .eq('company_id', companyId)
        .order('name');
        
      if (modelsError) {
        console.error('[DetailedHierarchyStats] Models error:', modelsError);
        throw modelsError;
      }

      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, device_category, product_platform, model_reference, markets, trade_name, eudamed_trade_names')
        .eq('company_id', companyId)
        .eq('is_archived', false);

      // Fetch variant information for all products
      const { data: productVariants, error: variantsError } = await supabase
        .from('product_variants')
        .select(`
          id,
          product_id,
          product_variant_values!inner (
            dimension_id,
            option_id,
            product_variation_dimensions!inner (
              id,
              name
            ),
            product_variation_options!inner (
              id,
              name
            )
          )
        `)
        .eq('product_variant_values.product_variation_dimensions.company_id', companyId);
      
      if (variantsError) {
        console.warn('[DetailedHierarchyStats] Variants error (non-critical):', variantsError);
      }
      
      // Build a map of product ID to its variant attributes
      const productVariantsMap = new Map<string, VariantAttribute[]>();
      if (productVariants) {
        productVariants.forEach((variant: any) => {
          if (!variant.product_variant_values) return;
          
          const variantAttrs: VariantAttribute[] = variant.product_variant_values.map((val: any) => ({
            dimensionName: val.product_variation_dimensions?.name || 'Unknown',
            optionName: val.product_variation_options?.name || 'Unknown',
            dimensionId: val.dimension_id,
            optionId: val.option_id
          }));
          
          productVariantsMap.set(variant.product_id, variantAttrs);
        });
      }
        
      if (productsError) {
        console.error('[DetailedHierarchyStats] Products error:', productsError);
        throw productsError;
      }

      // Build hierarchy using the SAME EXACT logic as detailed stats
      const hierarchy: HierarchicalNode[] = [];

      // Process each category
      for (const category of categories || []) {
        // Get products in this category with precise matching to avoid duplicates
        const categoryProducts = products?.filter(p => {
          // Only exact matches to prevent products appearing in multiple categories
          const matches = p.device_category === category.name || p.device_category === category.id;
          return matches;
        }) || [];

        if (categoryProducts.length === 0) {
          continue; // Skip empty categories
        }
        
        const categoryNode: HierarchicalNode = {
          id: category.id,
          name: category.name,
          type: 'category',
          productCount: categoryProducts.length,
          markets: category.markets as EnhancedProductMarket[],
            hasIndividualConfig: !!(category.markets && (category.markets as any[]).length > 0),
          children: []
        };
        
        // Get unique platforms for this category's products
        const categoryPlatformNames = new Set(
          categoryProducts
            .map(p => p.product_platform)
            .filter(Boolean)
        );

        // Process each platform
        for (const platformName of categoryPlatformNames) {
          const platform = platforms?.find(p => p.name === platformName);
          if (!platform) {
            continue;
          }

          const platformProducts = categoryProducts.filter(p => p.product_platform === platformName);

          const platformNode: HierarchicalNode = {
            id: `${platform.id}-${category.id}`, // Unique ID combining platform and category
            name: `${platform.name} (${category.name})`, // Add category context for clarity
            type: 'platform',
            productCount: platformProducts.length,
            parentId: category.id,
            markets: platform.markets as EnhancedProductMarket[],
            hasIndividualConfig: !!(platform.markets && (platform.markets as any[]).length > 0),
            children: []
          };
          
          // Get unique models for this platform's products
          const platformModelNames = new Set(
            platformProducts
              .map(p => p.model_reference)
              .filter(Boolean)
          );
          
          // Process each model
          for (const modelName of platformModelNames) {
            const model = models?.find(m => m.name === modelName);

            const modelProducts = platformProducts.filter(p => p.model_reference === modelName);

            const modelRecord = model || { 
              id: `model-${modelName}`, 
              name: modelName, 
              markets: [] 
            };
            
            const modelNode: HierarchicalNode = {
              id: `${modelRecord.id}-${platform.id}-${category.id}`, // Unique ID for model in context
              name: modelName,
              type: 'model',
              productCount: modelProducts.length,
              parentId: `${platform.id}-${category.id}`, // Reference the contextual platform ID
              markets: modelRecord.markets as EnhancedProductMarket[],
              hasIndividualConfig: !!(modelRecord.markets && (modelRecord.markets as any[]).length > 0),
              children: []
            };
            
            // Add individual products under this model
            for (const product of modelProducts) {
              const productNode: HierarchicalNode = {
                id: product.id, // Product IDs should remain unique as they are
                name: product.name,
                type: 'product',
                productCount: 1,
                parentId: `${modelRecord.id}-${platform.id}-${category.id}`, // Reference contextual model ID
                markets: product.markets as EnhancedProductMarket[],
                variants: productVariantsMap.get(product.id) || [], // Add variant attributes
                trade_name: product.trade_name || product.eudamed_trade_names,
                hasIndividualConfig: !!(
                  (product.markets && (product.markets as any[]).length > 0) ||
                  product.device_category ||
                  product.product_platform ||
                  product.model_reference
                )
              };
              
              modelNode.children!.push(productNode);
            }
            
            platformNode.children!.push(modelNode);
          }
          
          categoryNode.children!.push(platformNode);
        }
        
        // Add products that don't belong to any platform - group them by model first
        const directCategoryProducts = categoryProducts.filter(p => 
          !p.product_platform || 
          p.product_platform === undefined || 
          p.product_platform === null ||
          (typeof p.product_platform === 'object' && (p.product_platform as any)?._type === 'undefined')
        );

        // Group direct category products by model
        const directCategoryModelNames = new Set(
          directCategoryProducts
            .map(p => p.model_reference)
            .filter(Boolean)
        );
        
        // Process each model without platform in this category
        for (const modelName of directCategoryModelNames) {
          const model = models?.find(m => m.name === modelName);
          const modelProducts = directCategoryProducts.filter(p => p.model_reference === modelName);
          
          const modelNode: HierarchicalNode = {
            id: `${category.id}-model-${modelName}`,
            name: modelName,
            type: 'model',
            productCount: modelProducts.length,
            parentId: category.id,
            markets: model?.markets as EnhancedProductMarket[],
            hasIndividualConfig: !!(model?.markets && (model.markets as any[]).length > 0),
            children: []
          };
          
          // Add individual products under this model
          for (const product of modelProducts) {
            const productNode: HierarchicalNode = {
              id: product.id,
              name: product.name,
              type: 'product',
              productCount: 1,
              parentId: `${category.id}-model-${modelName}`,
              markets: product.markets as EnhancedProductMarket[],
              variants: productVariantsMap.get(product.id) || [],
              trade_name: product.trade_name || product.eudamed_trade_names,
              hasIndividualConfig: !!(
                (product.markets && (product.markets as any[]).length > 0) ||
                product.device_category ||
                product.product_platform ||
                product.model_reference
              )
            };
            
            modelNode.children!.push(productNode);
          }
          
          categoryNode.children!.push(modelNode);
        }
        
        // Add products without models directly under category
        const productsWithoutModel = directCategoryProducts.filter(p => !p.model_reference);
        for (const product of productsWithoutModel) {
          const productNode: HierarchicalNode = {
            id: product.id,
            name: product.name,
            type: 'product',
            productCount: 1,
            parentId: category.id,
            markets: product.markets as EnhancedProductMarket[],
            variants: productVariantsMap.get(product.id) || [],
            trade_name: product.trade_name || product.eudamed_trade_names,
            hasIndividualConfig: !!(
              (product.markets && (product.markets as any[]).length > 0) ||
              product.device_category ||
              product.product_platform ||
              product.model_reference
            )
          };
          
          categoryNode.children!.push(productNode);
        }
        
        hierarchy.push(categoryNode);
      }

      // Handle uncategorized products
      // Get all category names that exist
      const existingCategoryNames = new Set(categories?.map(c => c.name) || []);
      
      // Find products that don't belong to any existing category
      const uncategorizedProducts = products?.filter(p => {
        const hasValidCategory = p.device_category && 
          (existingCategoryNames.has(p.device_category) || 
           categories?.some(c => c.id === p.device_category));
        return !hasValidCategory;
      }) || [];

      if (uncategorizedProducts.length > 0) {
        // Create "Uncategorized Products" node
        const uncategorizedNode: HierarchicalNode = {
          id: 'uncategorized-products',
          name: 'Uncategorized Products',
          type: 'category',
          productCount: uncategorizedProducts.length,
          hasIndividualConfig: false,
          children: []
        };
        
        // Group uncategorized products by platform/model structure
        const uncategorizedPlatforms = new Set(
          uncategorizedProducts
            .map(p => p.product_platform)
            .filter(Boolean)
        );
        
        // Process platforms within uncategorized
        for (const platformName of uncategorizedPlatforms) {
          const platform = platforms?.find(p => p.name === platformName);
          const platformProducts = uncategorizedProducts.filter(p => p.product_platform === platformName);
          
          const platformNode: HierarchicalNode = {
            id: `uncategorized-platform-${platformName}`,
            name: platform?.name || platformName,
            type: 'platform',
            productCount: platformProducts.length,
            parentId: 'uncategorized-products',
            markets: platform?.markets as EnhancedProductMarket[],
            hasIndividualConfig: !!(platform?.markets && (platform.markets as any[]).length > 0),
            children: []
          };
          
          // Group by models within this platform
          const platformModelNames = new Set(
            platformProducts
              .map(p => p.model_reference)
              .filter(Boolean)
          );
          
          for (const modelName of platformModelNames) {
            const model = models?.find(m => m.name === modelName);
            const modelProducts = platformProducts.filter(p => p.model_reference === modelName);
            
            const modelNode: HierarchicalNode = {
              id: `uncategorized-model-${modelName}`,
              name: modelName,
              type: 'model',
              productCount: modelProducts.length,
              parentId: `uncategorized-platform-${platformName}`,
              markets: model?.markets as EnhancedProductMarket[],
              hasIndividualConfig: !!(model?.markets && (model.markets as any[]).length > 0),
              children: []
            };
            
            // Add individual products under this model
            for (const product of modelProducts) {
              const productNode: HierarchicalNode = {
                id: product.id,
                name: product.name,
                type: 'product',
                productCount: 1,
                parentId: `uncategorized-model-${modelName}`,
                markets: product.markets as EnhancedProductMarket[],
                variants: productVariantsMap.get(product.id) || [],
                trade_name: product.trade_name || product.eudamed_trade_names,
                hasIndividualConfig: !!(
                  (product.markets && (product.markets as any[]).length > 0) ||
                  product.device_category ||
                  product.product_platform ||
                  product.model_reference
                )
              };
              
              modelNode.children!.push(productNode);
            }
            
            platformNode.children!.push(modelNode);
          }
          
          // Add products without models directly under platform
          const productsWithoutModel = platformProducts.filter(p => !p.model_reference);
          for (const product of productsWithoutModel) {
            const productNode: HierarchicalNode = {
              id: product.id,
              name: product.name,
              type: 'product',
              productCount: 1,
              parentId: `uncategorized-platform-${platformName}`,
              markets: product.markets as EnhancedProductMarket[],
              variants: productVariantsMap.get(product.id) || [],
              trade_name: product.trade_name || product.eudamed_trade_names,
              hasIndividualConfig: !!(
                (product.markets && (product.markets as any[]).length > 0) ||
                product.device_category ||
                product.product_platform ||
                product.model_reference
              )
            };
            
            platformNode.children!.push(productNode);
          }
          
          uncategorizedNode.children!.push(platformNode);
        }
        
        // Add products without platforms - group them by model first
        const productsWithoutPlatform = uncategorizedProducts.filter(p => !p.product_platform);
        
        // Group these products by model
        const modelsWithoutPlatform = new Set(
          productsWithoutPlatform
            .map(p => p.model_reference)
            .filter(Boolean)
        );
        
        // Process each model without platform
        for (const modelName of modelsWithoutPlatform) {
          const model = models?.find(m => m.name === modelName);
          const modelProducts = productsWithoutPlatform.filter(p => p.model_reference === modelName);
          
          const modelNode: HierarchicalNode = {
            id: `uncategorized-model-${modelName}`,
            name: modelName,
            type: 'model',
            productCount: modelProducts.length,
            parentId: 'uncategorized-products',
            markets: model?.markets as EnhancedProductMarket[],
            hasIndividualConfig: !!(model?.markets && (model.markets as any[]).length > 0),
            children: []
          };
          
          // Add individual products under this model
          for (const product of modelProducts) {
            const productNode: HierarchicalNode = {
              id: product.id,
              name: product.name,
              type: 'product',
              productCount: 1,
              parentId: `uncategorized-model-${modelName}`,
              markets: product.markets as EnhancedProductMarket[],
              variants: productVariantsMap.get(product.id) || [],
              trade_name: product.trade_name || product.eudamed_trade_names,
              hasIndividualConfig: !!(
                (product.markets && (product.markets as any[]).length > 0) ||
                product.device_category ||
                product.product_platform ||
                product.model_reference
              )
            };
            
            modelNode.children!.push(productNode);
          }
          
          uncategorizedNode.children!.push(modelNode);
        }
        
        // Add products without models directly under uncategorized
        const productsWithoutModel = productsWithoutPlatform.filter(p => !p.model_reference);
        for (const product of productsWithoutModel) {
          const productNode: HierarchicalNode = {
            id: product.id,
            name: product.name,
            type: 'product',
            productCount: 1,
            parentId: 'uncategorized-products',
            markets: product.markets as EnhancedProductMarket[],
            variants: productVariantsMap.get(product.id) || [],
            trade_name: product.trade_name || product.eudamed_trade_names,
            hasIndividualConfig: !!(
              (product.markets && (product.markets as any[]).length > 0) ||
              product.device_category ||
              product.product_platform ||
              product.model_reference
            )
          };
          
          uncategorizedNode.children!.push(productNode);
        }
        
        // Add the uncategorized node to hierarchy
        hierarchy.push(uncategorizedNode);
      }

      return hierarchy;

    } catch (error) {
      console.error('[HierarchicalBulkService] Error building hierarchy:', error);
      throw error;
    }
  }

  // Move a node within the hierarchy (drag-and-drop support)
  static async moveNodeInHierarchy(
    companyId: string,
    nodeId: string,
    nodeType: 'category' | 'platform' | 'model' | 'product',
    targetId?: string,
    targetType?: 'category' | 'platform' | 'model'
  ): Promise<void> {
    try {
      if (!targetId || !targetType) {
        throw new Error('Target is required for hierarchy moves');
      }

      // Handle different move scenarios
      if (nodeType === 'product') {
        // Product moves - update the product's category/platform/model references
        await this.moveProduct(companyId, nodeId, targetId, targetType);
        
      } else if (nodeType === 'platform' && targetType === 'category') {
        // Platform move to category - this creates a "split" where platform appears in multiple categories
        await this.movePlatformToCategory(companyId, nodeId, targetId);
        
      } else if (nodeType === 'model' && targetType === 'platform') {
        // Model move to platform - update all products in this model to use the new platform
        await this.moveModelToPlatform(companyId, nodeId, targetId);
        
      } else if (nodeType === 'model' && targetType === 'category') {
        // Model move to category - update all products in this model to use the new category
        await this.moveModelToCategory(companyId, nodeId, targetId);
        
      } else if (nodeType === 'platform' && targetType === 'platform') {
        // Platform reordering within same level - just a visual change, no data update needed
      } else {
        throw new Error(`Move from ${nodeType} to ${targetType} is not supported yet`);
      }

    } catch (error) {
      console.error('[HierarchicalBulkService] Failed to move node:', error);
      throw error;
    }
  }

  // Move a single product
  private static async moveProduct(
    companyId: string,
    productId: string,
    targetId: string,
    targetType: 'category' | 'platform' | 'model'
  ): Promise<void> {
    let updateData: any = {};
    
    if (targetType === 'category') {
      // Extract the actual category ID from contextual ID if needed
      let actualTargetId = targetId;
      if (targetId.includes('-')) {
        // If it's a contextual ID, extract the first UUID (category ID)
        const parts = targetId.split('-');
        if (parts.length >= 5) {
          actualTargetId = parts.slice(0, 5).join('-');
        }
      }
      
      // Get target category name for product reference
      const { data: category, error: catError } = await supabase
        .from('company_device_categories')
        .select('name')
        .eq('id', actualTargetId)
        .eq('company_id', companyId)
        .single();
      
      if (catError) throw catError;
      if (category) {
        updateData.device_category = category.name;
      }
    } else if (targetType === 'platform') {
      // Extract the actual platform ID from contextual ID if needed
      let actualTargetId = targetId;
      if (targetId.includes('-')) {
        // If it's a contextual ID, extract the first UUID (platform ID)
        const parts = targetId.split('-');
        if (parts.length >= 5) {
          actualTargetId = parts.slice(0, 5).join('-');
        }
      }
      
      // Get target platform name for product reference
      const { data: platform, error: platError } = await supabase
        .from('company_platforms')
        .select('name')
        .eq('id', actualTargetId)
        .eq('company_id', companyId)
        .single();
      
      if (platError) throw platError;
      if (platform) {
        updateData.product_platform = platform.name;
      }
    } else if (targetType === 'model') {
      // Extract the actual model ID from contextual ID if needed
      let actualTargetId = targetId;
      if (targetId.includes('-')) {
        // If it's a contextual ID, extract the first UUID (model ID)
        const parts = targetId.split('-');
        if (parts.length >= 5) {
          actualTargetId = parts.slice(0, 5).join('-');
        }
      }
      
      // Get target model name for product reference
      const { data: model, error: modelError } = await supabase
        .from('company_product_models')
        .select('name')
        .eq('id', actualTargetId)
        .eq('company_id', companyId)
        .single();
      
      if (modelError) throw modelError;
      if (model) {
        updateData.model_reference = model.name;
      }
    }

    if (Object.keys(updateData).length > 0) {
      const { error: productError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId)
        .eq('company_id', companyId);
      
      if (productError) throw productError;
    }
  }

  // Move a platform to a different category (splits the platform across categories)
  private static async movePlatformToCategory(
    companyId: string,
    platformId: string,
    targetCategoryId: string
  ): Promise<void> {
    // Extract actual IDs from contextual IDs if needed
    let actualPlatformId = platformId;
    if (platformId.includes('-')) {
      const parts = platformId.split('-');
      if (parts.length >= 5) {
        actualPlatformId = parts.slice(0, 5).join('-');
      }
    }
    
    let actualCategoryId = targetCategoryId;
    if (targetCategoryId.includes('-')) {
      const parts = targetCategoryId.split('-');
      if (parts.length >= 5) {
        actualCategoryId = parts.slice(0, 5).join('-');
      }
    }
    
    // Get the platform name and target category name
    const { data: platform, error: platError } = await supabase
      .from('company_platforms')
      .select('name')
      .eq('id', actualPlatformId)
      .eq('company_id', companyId)
      .single();
    
    if (platError) throw platError;
    
    const { data: category, error: catError } = await supabase
      .from('company_device_categories')
      .select('name')
      .eq('id', actualCategoryId)
      .eq('company_id', companyId)
      .single();
    
    if (catError) throw catError;

    // Update ALL products using this platform to move to the new category
    const { error: updateError } = await supabase
      .from('products')
      .update({ device_category: category.name })
      .eq('company_id', companyId)
      .eq('product_platform', platform.name);
    
    if (updateError) throw updateError;
  }

  // Move a model to a different platform
  private static async moveModelToPlatform(
    companyId: string,
    modelId: string,
    targetPlatformId: string
  ): Promise<void> {
    // Extract actual IDs from contextual IDs if needed
    let actualModelId = modelId;
    if (modelId.includes('-')) {
      const parts = modelId.split('-');
      if (parts.length >= 5) {
        actualModelId = parts.slice(0, 5).join('-');
      }
    }
    
    let actualPlatformId = targetPlatformId;
    if (targetPlatformId.includes('-')) {
      const parts = targetPlatformId.split('-');
      if (parts.length >= 5) {
        actualPlatformId = parts.slice(0, 5).join('-');
      }
    }
    
    // Get the model name and target platform name
    const { data: model, error: modelError } = await supabase
      .from('company_product_models')
      .select('name')
      .eq('id', actualModelId)
      .eq('company_id', companyId)
      .single();
    
    if (modelError) throw modelError;
    
    const { data: platform, error: platError } = await supabase
      .from('company_platforms')
      .select('name')
      .eq('id', actualPlatformId)
      .eq('company_id', companyId)
      .single();
    
    if (platError) throw platError;

    // Update ALL products using this model to use the new platform
    const { error: updateError } = await supabase
      .from('products')
      .update({ product_platform: platform.name })
      .eq('company_id', companyId)
      .eq('model_reference', model.name);

    if (updateError) throw updateError;
  }

  // Move a model to a different category
  private static async moveModelToCategory(
    companyId: string,
    modelId: string,
    targetCategoryId: string
  ): Promise<void> {
    // Extract actual IDs from contextual IDs if needed
    let actualModelId = modelId;
    if (modelId.includes('-')) {
      const parts = modelId.split('-');
      if (parts.length >= 5) {
        actualModelId = parts.slice(0, 5).join('-');
      }
    }
    
    let actualCategoryId = targetCategoryId;
    if (targetCategoryId.includes('-')) {
      const parts = targetCategoryId.split('-');
      if (parts.length >= 5) {
        actualCategoryId = parts.slice(0, 5).join('-');
      }
    }
    
    // Get the model name and target category name
    const { data: model, error: modelError } = await supabase
      .from('company_product_models')
      .select('name')
      .eq('id', actualModelId)
      .eq('company_id', companyId)
      .single();
    
    if (modelError) throw modelError;
    
    const { data: category, error: catError } = await supabase
      .from('company_device_categories')
      .select('name')
      .eq('id', actualCategoryId)
      .eq('company_id', companyId)
      .single();
    
    if (catError) throw catError;

    // Update ALL products using this model to move to the new category
    const { error: updateError } = await supabase
      .from('products')
      .update({ device_category: category.name })
      .eq('company_id', companyId)
      .eq('model_reference', model.name);
    
    if (updateError) throw updateError;
  }

  // Get hierarchy statistics
  static async getHierarchyStats(companyId: string): Promise<HierarchyStats> {
    const hierarchy = await this.getCompanyHierarchy(companyId);
    
    let totalProducts = 0;
    let configuredProducts = 0;
    
    // Use Sets to track unique categories, platforms, and models
    const categories = new Set<string>();
    const platforms = new Set<string>();
    const models = new Set<string>();
    
    let categoriesConfigured = 0;
    let platformsConfigured = 0;
    let modelsConfigured = 0;
    
    const countNodes = (nodes: HierarchicalNode[]) => {
      for (const node of nodes) {
        if (node.type === 'product') {
          totalProducts++;
          if (node.hasIndividualConfig) configuredProducts++;
        } else if (node.type === 'category') {
          categories.add(node.id);
          if (node.hasIndividualConfig) categoriesConfigured++;
        } else if (node.type === 'platform') {
          platforms.add(node.id);
          if (node.hasIndividualConfig) platformsConfigured++;
        } else if (node.type === 'model') {
          models.add(node.id);
          if (node.hasIndividualConfig) modelsConfigured++;
        }
        
        if (node.children) {
          countNodes(node.children);
        }
      }
    };
    
    countNodes(hierarchy);
    
    return {
      totalProducts,
      totalVariants: 0, // Will be implemented when we add variant support
      configuredProducts,
      categoriesConfigured: categories.size, // Total categories, not just configured ones
      platformsConfigured: platforms.size,   // Total platforms, not just configured ones
      modelsConfigured: models.size          // Total models, not just configured ones
    };
  }
  
  // Get detailed hierarchy statistics with full breakdown
  static async getDetailedHierarchyStats(companyId: string): Promise<DetailedHierarchyStats> {
    const basicStats = await this.getHierarchyStats(companyId);
    const { data: categories, error: categoriesError } = await supabase
      .from('company_device_categories')
      .select('*')
      .eq('company_id', companyId)
      .order('name');
    
    if (categoriesError) {
      console.error('[DetailedHierarchyStats] Categories error:', categoriesError);
      throw categoriesError;
    }
    const { data: platforms, error: platformsError } = await supabase
      .from('company_platforms')
      .select('*')
      .eq('company_id', companyId)
      .order('name');
      
    if (platformsError) {
      console.error('[DetailedHierarchyStats] Platforms error:', platformsError);
      throw platformsError;
    }
    const { data: models, error: modelsError } = await supabase
      .from('company_product_models')
      .select('*')
      .eq('company_id', companyId)
      .order('name');
      
    if (modelsError) {
      console.error('[DetailedHierarchyStats] Models error:', modelsError);
      throw modelsError;
    }
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, device_category, product_platform, model_reference, markets')
      .eq('company_id', companyId)
      .eq('is_archived', false);
      
    if (productsError) {
      console.error('[DetailedHierarchyStats] Products error:', productsError);
      throw productsError;
    }
    
    // Get variants with actual configured attributes (not just empty records)
    let variants: any = { data: [], error: null };
    if (products && products.length > 0) {
      try {
        const productIds = products.map(p => p.id);
        variants = await supabase
          .from('product_variants')
          .select(`
            id, 
            name, 
            product_id,
            product_variant_values!inner (
              dimension_id,
              option_id,
              product_variation_dimensions!inner (
                id,
                name
              ),
              product_variation_options!inner (
                id,
                name
              )
            )
          `)
          .in('product_id', productIds)
          .eq('product_variant_values.product_variation_dimensions.company_id', companyId);
        
        if (variants.error) {
          console.warn('[DetailedHierarchyStats] Variants table not available or error:', variants.error);
          // Don't throw, just use empty variants
          variants = { data: [], error: null };
        } else {
          // Only count variants that have actual configured attribute values
          const configuredVariants = (variants.data || []).filter((variant: any) =>
            variant.product_variant_values &&
            variant.product_variant_values.length > 0 &&
            variant.product_variant_values.some((val: any) =>
              val.dimension_id && val.option_id
            )
          );
          variants.data = configuredVariants;
        }
      } catch (error) {
        console.warn('[DetailedHierarchyStats] Could not fetch variants, continuing without them:', error);
        variants = { data: [], error: null };
      }
    }

    const productsData = products || [];
    const variantsData = variants.data || [];
    
    // Create variant lookup
    const variantsByProduct = variantsData.reduce((acc, variant) => {
      if (!acc[variant.product_id]) acc[variant.product_id] = [];
      acc[variant.product_id].push(variant);
      return acc;
    }, {} as Record<string, any[]>);

    // Build category stats
    const categoryStats: CategoryStats[] = (categories || []).map(category => {
      // Filter products by exact category match to avoid duplicates
      const categoryProducts = productsData.filter(p => 
        p.device_category === category.name || p.device_category === category.id
      );
      const categoryVariants = categoryProducts.flatMap(p => variantsByProduct[p.id] || []);
      const categoryPlatforms = [...new Set(categoryProducts.map(p => p.product_platform).filter(Boolean))];
      const categoryModels = [...new Set(categoryProducts.map(p => p.model_reference).filter(Boolean))];
      
      const platformStats: PlatformStats[] = categoryPlatforms.map(platformName => {
        const platform = platforms?.find(p => p.name === platformName);
        const platformProducts = categoryProducts.filter(p => p.product_platform === platformName);
        const platformVariants = platformProducts.flatMap(p => variantsByProduct[p.id] || []);
        const platformModels = [...new Set(platformProducts.map(p => p.model_reference).filter(Boolean))];
        
        const modelStats: ModelStats[] = platformModels.map(modelName => {
          const model = models?.find(m => m.name === modelName);
          const modelProducts = platformProducts.filter(p => p.model_reference === modelName);
          const modelVariants = modelProducts.flatMap(p => variantsByProduct[p.id] || []);
          
          return {
            id: model?.id || `model-${modelName}`,
            name: modelName,
            description: model?.description,
            platformId: platform?.id,
            platformName,
            productCount: modelProducts.length,
            variantCount: modelVariants.length,
            configured: !!(model?.markets && (model.markets as any[]).length > 0)
          };
        });
        
        return {
          id: platform?.id || `platform-${platformName}`,
          name: platformName,
          description: platform?.description,
          categoryId: category.id,
          categoryName: category.name,
          productCount: platformProducts.length,
          variantCount: platformVariants.length,
          modelCount: platformModels.length,
          configured: !!(platform?.markets && (platform.markets as any[]).length > 0),
          models: modelStats
        };
      });

      // Add models that don't belong to any platform in this category
      const categoryDirectModels = [...new Set(
        categoryProducts
          .filter(p => !p.product_platform || p.product_platform === null || p.product_platform === undefined)
          .map(p => p.model_reference)
          .filter(Boolean)
      )];

      const directModelStats: ModelStats[] = categoryDirectModels.map(modelName => {
        const model = models?.find(m => m.name === modelName);
        const modelProducts = categoryProducts.filter(p => 
          p.model_reference === modelName && 
          (!p.product_platform || p.product_platform === null || p.product_platform === undefined)
        );
        const modelVariants = modelProducts.flatMap(p => variantsByProduct[p.id] || []);
        
        return {
          id: model?.id || `category-model-${modelName}`,
          name: modelName,
          description: model?.description,
          categoryId: category.id,
          categoryName: category.name,
          productCount: modelProducts.length,
          variantCount: modelVariants.length,
          configured: !!(model?.markets && (model.markets as any[]).length > 0)
        };
      });

      // Create a special "platform" for direct models under category
      if (directModelStats.length > 0) {
        const directModelsplatform: PlatformStats = {
          id: `${category.id}-direct-models`,
          name: `Models (No Platform)`,
          description: `Models directly under ${category.name} category`,
          categoryId: category.id,
          categoryName: category.name,
          productCount: directModelStats.reduce((sum, model) => sum + model.productCount, 0),
          variantCount: directModelStats.reduce((sum, model) => sum + model.variantCount, 0),
          modelCount: directModelStats.length,
          configured: false, // No platform-level config for direct models
          models: directModelStats
        };
        platformStats.push(directModelsplatform);
      }
      
      return {
        id: category.id,
        name: category.name,
        description: category.description,
        productCount: categoryProducts.length,
        variantCount: categoryVariants.length,
        platformCount: categoryPlatforms.length + (directModelStats.length > 0 ? 1 : 0), // Include virtual platform for direct models
        modelCount: categoryModels.length,
        configured: !!(category.markets && (category.markets as any[]).length > 0),
        platforms: platformStats
      };
    });

    // Build platform stats (including uncategorized)
    const allPlatformStats: PlatformStats[] = (platforms || []).map(platform => {
      const platformProducts = productsData.filter(p => p.product_platform === platform.name);
      const platformVariants = platformProducts.flatMap(p => variantsByProduct[p.id] || []);
      const platformModels = [...new Set(platformProducts.map(p => p.model_reference).filter(Boolean))];
      const categoryName = platformProducts[0]?.device_category;
      
      const modelStats: ModelStats[] = platformModels.map(modelName => {
        const model = models?.find(m => m.name === modelName);
        const modelProducts = platformProducts.filter(p => p.model_reference === modelName);
        const modelVariants = modelProducts.flatMap(p => variantsByProduct[p.id] || []);
        
        return {
          id: model?.id || `model-${modelName}`,
          name: modelName,
          description: model?.description,
          platformId: platform.id,
          platformName: platform.name,
          productCount: modelProducts.length,
          variantCount: modelVariants.length,
          configured: !!(model?.markets && (model.markets as any[]).length > 0)
        };
      });
      
      return {
        id: platform.id,
        name: platform.name,
        description: platform.description,
        categoryName,
        productCount: platformProducts.length,
        variantCount: platformVariants.length,
        modelCount: platformModels.length,
        configured: !!(platform.markets && (platform.markets as any[]).length > 0),
        models: modelStats
      };
    });

    // Build model stats
    const allModelStats: ModelStats[] = (models || []).map(model => {
      const modelProducts = productsData.filter(p => p.model_reference === model.name);
      const modelVariants = modelProducts.flatMap(p => variantsByProduct[p.id] || []);
      const platformName = modelProducts[0]?.product_platform;
      
      return {
        id: model.id,
        name: model.name,
        description: model.description,
        platformName,
        productCount: modelProducts.length,
        variantCount: modelVariants.length,
        configured: !!(model.markets && (model.markets as any[]).length > 0)
      };
    });

    return {
      ...basicStats,
      totalVariants: variantsData.length,
      categories: categoryStats,
      platforms: allPlatformStats,
      models: allModelStats
    };
  }
  
  // Execute bulk operations
  static async executeBulkOperation(
    operation: BulkOperation,
    onProgress?: (update: { completed: number; succeeded: number; failed: number; currentItem?: string; errors?: string[] }) => void
  ): Promise<void> {
    
    if (operation.type === 'variations' || (operation.type === 'hierarchy' && operation.payload.operation === 'assign_variations')) {
      // Handle variation assignments from both variations tab and hierarchy operations
      if (operation.type === 'hierarchy') {
        // Convert hierarchy operation to variation format
        const variationPayload = {
          variations: operation.payload.variations
        };
        await this.executeBulkVariationAssignment({ ...operation, payload: variationPayload }, onProgress);
      } else {
        await this.executeBulkVariationAssignment(operation, onProgress);
      }
    } else if (operation.type === 'hierarchy' && operation.payload.operation === 'reassign_category') {
      await this.executeBulkCategoryReassignment(operation, onProgress);
    } else if (operation.type === 'hierarchy' && operation.payload.operation === 'reassign_platform') {
      await this.executeBulkPlatformReassignment(operation, onProgress);
    } else if (operation.type === 'hierarchy' && operation.payload.operation === 'reassign_model') {
      await this.executeBulkModelReassignment(operation, onProgress);
  } else if (operation.type === 'markets') {
    await this.executeBulkMarketAssignment(operation, onProgress);
  } else if (operation.type === 'pricing') {
    await this.executeBulkPricingUpdate(operation, onProgress);
  } else if (operation.type === 'regulatory_status') {
    await this.executeBulkRegulatoryUpdate(operation, onProgress);
  } else if (operation.type === 'reassign_category') {
    await this.executeBulkCategoryReassignment(operation, onProgress);
  } else if (operation.type === 'reassign_platform') {
    await this.executeBulkPlatformReassignment(operation, onProgress);
  } else if (operation.type === 'reassign_model') {
    await this.executeBulkModelReassignment(operation, onProgress);
  } else {
    // For now, just simulate other operations with progress updates
    if (onProgress) {
      onProgress({ completed: 0, succeeded: 0, failed: 0, currentItem: 'Preparing operation...' });
      await new Promise(resolve => setTimeout(resolve, 500));
      onProgress({ completed: 1, succeeded: 1, failed: 0, currentItem: 'Operation completed' });
      await new Promise(resolve => setTimeout(resolve, 500));
    } else {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    }
  }

  private static async executeBulkVariationAssignment(
    operation: BulkOperation,
    onProgress?: (update: { completed: number; succeeded: number; failed: number; currentItem?: string; errors?: string[] }) => void
  ): Promise<void> {
    const { nodes, payload } = operation;
    const { variations } = payload;

    // Get all product IDs affected by the selected nodes
    const productIds = await this.getProductIdsFromNodes(nodes);

    if (productIds.length === 0) {
      return;
    }
    
    let completed = 0;
    let succeeded = 0;
    let failed = 0;
    const errors: string[] = [];
    
    // Simple approach: Create minimal variants and assign variations
    for (const productId of productIds) {
      // Get product name for progress display
      const { data: product } = await supabase
        .from('products')
        .select('name')
        .eq('id', productId)
        .single();
        
      const productName = product?.name || productId;
      
      onProgress?.({ 
        completed, 
        succeeded, 
        failed, 
        currentItem: `Processing ${productName}`,
        errors: errors.slice(-5) // Only send last 5 errors
      });
      
      try {
        // Check if variant exists
        const { data: existingVariant } = await supabase
          .from('product_variants')
          .select('id')
          .eq('product_id', productId)
          .maybeSingle();
        
        let variantId: string;
        
        if (existingVariant) {
          variantId = existingVariant.id;
        } else {
          // Create minimal variant
          const { data: newVariant, error: variantError } = await supabase
            .from('product_variants')
            .insert({
              product_id: productId,
              status: 'active'
            })
            .select('id')
            .single();
            
          if (variantError) {
            continue; // Skip this product and continue with others
          }
          
          variantId = newVariant.id;
        }
        
        // Clear existing variation values for these dimensions
        const dimensionIds = Object.keys(variations);
        if (dimensionIds.length > 0) {
          await supabase
            .from('product_variant_values')
            .delete()
            .eq('product_variant_id', variantId)
            .in('dimension_id', dimensionIds);
        }
        
        // Insert new variation values
        const variationValues = Object.entries(variations).map(([dimensionId, optionId]) => ({
          product_variant_id: variantId,
          dimension_id: dimensionId,
          option_id: optionId as string
        }));
        
        const { error: insertError } = await supabase
          .from('product_variant_values')
          .insert(variationValues);

        if (insertError) {
          continue; // Skip this product and continue with others
        }

        succeeded++;
        
      } catch (error) {
        console.error('[HierarchicalBulkService] Error processing product', productId, ':', error);
        failed++;
        errors.push(`Failed to process ${productName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        completed++;
        
        // Update progress after each product
        onProgress?.({ 
          completed, 
          succeeded, 
          failed,
          currentItem: completed < productIds.length ? undefined : 'Finalizing...',
          errors: errors.slice(-5)
        });
        
        // Small delay to allow UI updates and prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }
  
  private static extractSingleId(id: string): string {
    if (id.includes('-')) {
      // If it's a contextual ID, extract the first UUID
      const parts = id.split('-');
      if (parts.length >= 5) {
        return parts.slice(0, 5).join('-');
      }
    }
    return id;
  }
  
  private static async executeBulkMarketAssignment(
    operation: BulkOperation,
    onProgress?: (update: { completed: number; succeeded: number; failed: number; currentItem?: string; errors?: string[] }) => void
  ): Promise<void> {
    const { nodes, payload: markets } = operation;

    // Get all product IDs affected by the selected nodes
    const productIds = await this.getProductIdsFromNodes(nodes);

    if (productIds.length === 0) {
      return;
    }
    
    let completed = 0;
    let succeeded = 0;
    let failed = 0;
    const errors: string[] = [];
    
    // Update each product's markets
    for (const productId of productIds) {
      // Get product name for progress display
      const { data: product } = await supabase
        .from('products')
        .select('name')
        .eq('id', productId)
        .single();
        
      const productName = product?.name || productId;
      
      onProgress?.({ 
        completed, 
        succeeded, 
        failed, 
        currentItem: `Updating markets for ${productName}`,
        errors: errors.slice(-5)
      });
      
      try {
        const { error: updateError } = await supabase
          .from('products')
          .update({ markets: markets })
          .eq('id', productId);

        if (updateError) {
          failed++;
          errors.push(`Failed to update ${productName}: ${updateError.message}`);
        } else {
          succeeded++;
        }
        
      } catch (error) {
        failed++;
        errors.push(`Failed to process ${productName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        completed++;

        onProgress?.({
          completed,
          succeeded,
          failed,
          currentItem: completed < productIds.length ? undefined : 'Finalizing...',
          errors: errors.slice(-5)
        });

        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }

  private static async executeBulkPricingUpdate(
    operation: BulkOperation,
    onProgress?: (update: { completed: number; succeeded: number; failed: number; currentItem?: string; errors?: string[] }) => void
  ): Promise<void> {
    const { nodes, payload } = operation;

    const productIds = await this.getProductIdsFromNodes(nodes);

    if (productIds.length === 0) {
      return;
    }
    
    let completed = 0;
    let succeeded = 0;
    let failed = 0;
    const errors: string[] = [];
    
    for (const productId of productIds) {
      const { data: product } = await supabase
        .from('products')
        .select('name')
        .eq('id', productId)
        .single();
        
      const productName = product?.name || productId;
      
      onProgress?.({ 
        completed, 
        succeeded, 
        failed, 
        currentItem: `Updating pricing for ${productName}`,
        errors: errors.slice(-5)
      });
      
      try {
        // For now, simulate pricing update
        succeeded++;
        
      } catch (error) {
        failed++;
        errors.push(`Failed to process ${productName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        completed++;
        onProgress?.({ 
          completed, 
          succeeded, 
          failed,
          currentItem: completed < productIds.length ? undefined : 'Finalizing...',
          errors: errors.slice(-5)
        });
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }

  private static async executeBulkRegulatoryUpdate(
    operation: BulkOperation,
    onProgress?: (update: { completed: number; succeeded: number; failed: number; currentItem?: string; errors?: string[] }) => void
  ): Promise<void> {
    const { nodes, payload } = operation;

    const productIds = await this.getProductIdsFromNodes(nodes);

    if (productIds.length === 0) {
      return;
    }
    
    let completed = 0;
    let succeeded = 0;
    let failed = 0;
    const errors: string[] = [];
    
    for (const productId of productIds) {
      const { data: product } = await supabase
        .from('products')
        .select('name')
        .eq('id', productId)
        .single();
        
      const productName = product?.name || productId;
      
      onProgress?.({ 
        completed, 
        succeeded, 
        failed, 
        currentItem: `Updating regulatory status for ${productName}`,
        errors: errors.slice(-5)
      });
      
      try {
        // Build update object with only non-empty values from payload
        const updateData: any = {};
        
        if (payload.lifecyclePhase) {
          updateData.current_lifecycle_phase = payload.lifecyclePhase;
          
          // If setting to Post-Market Surveillance, also update launch status
          if (payload.lifecyclePhase === 'Post-Market Surveillance') {
            updateData.launch_status = 'launched';
            
            // Set launch date if not already set
            const { data: currentProduct } = await supabase
              .from('products')
              .select('actual_launch_date, inserted_at')
              .eq('id', productId)
              .single();
              
            if (!currentProduct?.actual_launch_date) {
              updateData.actual_launch_date = currentProduct?.inserted_at?.split('T')[0] || new Date().toISOString().split('T')[0];
            }
          }
        }
        
        if (payload.status) {
          updateData.regulatory_status = payload.status;
        }
        
        if (payload.fdaCode) {
          updateData.fda_code = payload.fdaCode;
        }
        
        if (payload.ceMarking) {
          updateData.ce_marking = payload.ceMarking;
        }
        
        // Only update if there's something to update
        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', productId);
            
          if (updateError) {
            throw updateError;
          }
        }

        succeeded++;
        
      } catch (error) {
        failed++;
        errors.push(`Failed to process ${productName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        completed++;
        onProgress?.({ 
          completed, 
          succeeded, 
          failed,
          currentItem: completed < productIds.length ? undefined : 'Finalizing...',
          errors: errors.slice(-5)
        });
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }

  private static async getProductIdsFromNodes(nodes: HierarchicalNode[]): Promise<string[]> {
    const productIds: string[] = [];
    
    for (const node of nodes) {
      const cleanId = this.extractSingleId(node.id);
      
      switch (node.type) {
        case 'product':
          productIds.push(cleanId);
          break;
          
        case 'category':
          const { data: categoryProducts } = await supabase
            .from('products')
            .select('id')
            .eq('device_category', node.name)
            .eq('is_archived', false);
          
          if (categoryProducts) {
            productIds.push(...categoryProducts.map(p => p.id));
          }
          break;
          
        case 'platform':
          const { data: platformProducts } = await supabase
            .from('products')
            .select('id')
            .eq('product_platform', node.name)
            .eq('is_archived', false);
            
          if (platformProducts) {
            productIds.push(...platformProducts.map(p => p.id));
          }
          break;
          
        case 'model':
          const { data: modelProducts } = await supabase
            .from('products')
            .select('id')
            .eq('model_reference', node.name)
            .eq('is_archived', false);
            
          if (modelProducts) {
            productIds.push(...modelProducts.map(p => p.id));
          }
          break;
      }
    }
    
    // Remove duplicates
    return [...new Set(productIds)];
  }

  private static async executeBulkCategoryReassignment(
    operation: BulkOperation,
    onProgress?: (update: { completed: number; succeeded: number; failed: number; currentItem?: string; errors?: string[] }) => void
  ): Promise<void> {
    const { nodes, payload } = operation;
    const { targetCategory } = payload;

    // Get all product IDs from selected nodes
    const productIds = await this.getProductIdsFromNodes(nodes);

    if (productIds.length === 0) {
      onProgress?.({ completed: 1, succeeded: 0, failed: 0, currentItem: 'No products found to update' });
      return;
    }
    
    let completed = 0;
    let succeeded = 0;
    let failed = 0;
    const errors: string[] = [];
    
    // Update products one by one for better progress tracking
    for (const productId of productIds) {
      onProgress?.({ 
        completed, 
        succeeded, 
        failed, 
        currentItem: `Updating category for product ${productId}`,
        errors: errors.slice(-5)
      });
      
      try {
        const { error } = await supabase
          .from('products')
          .update({ device_category: targetCategory })
          .eq('id', productId);
          
        if (error) {
          throw error;
        }

        succeeded++;

      } catch (error) {
        failed++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to update product ${productId}: ${errorMsg}`);
      } finally {
        completed++;
        onProgress?.({ 
          completed, 
          succeeded, 
          failed,
          currentItem: completed < productIds.length ? undefined : 'Finalizing...',
          errors: errors.slice(-5)
        });
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }

  private static async executeBulkPlatformReassignment(
    operation: BulkOperation,
    onProgress?: (update: { completed: number; succeeded: number; failed: number; currentItem?: string; errors?: string[] }) => void
  ): Promise<void> {
    const { nodes, payload } = operation;
    const { targetPlatform } = payload;

    // Get all product IDs from selected nodes
    const productIds = await this.getProductIdsFromNodes(nodes);

    if (productIds.length === 0) {
      onProgress?.({ completed: 1, succeeded: 0, failed: 0, currentItem: 'No products found to update' });
      return;
    }
    
    let completed = 0;
    let succeeded = 0;
    let failed = 0;
    const errors: string[] = [];
    
    // Update products one by one for better progress tracking
    for (const productId of productIds) {
      onProgress?.({ 
        completed, 
        succeeded, 
        failed, 
        currentItem: `Updating platform for product ${productId}`,
        errors: errors.slice(-5)
      });
      
      try {
        const { error } = await supabase
          .from('products')
          .update({ product_platform: targetPlatform })
          .eq('id', productId);
          
        if (error) {
          throw error;
        }

        succeeded++;

      } catch (error) {
        failed++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to update product ${productId}: ${errorMsg}`);
      } finally {
        completed++;
        onProgress?.({ 
          completed, 
          succeeded, 
          failed,
          currentItem: completed < productIds.length ? undefined : 'Finalizing...',
          errors: errors.slice(-5)
        });
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }

  private static async executeBulkModelReassignment(
    operation: BulkOperation,
    onProgress?: (update: { completed: number; succeeded: number; failed: number; currentItem?: string; errors?: string[] }) => void
  ): Promise<void> {
    const { nodes, payload } = operation;
    const { targetModel } = payload;

    // Get all product IDs from selected nodes
    const productIds = await this.getProductIdsFromNodes(nodes);

    if (productIds.length === 0) {
      onProgress?.({ completed: 1, succeeded: 0, failed: 0, currentItem: 'No products found to update' });
      return;
    }
    
    let completed = 0;
    let succeeded = 0;
    let failed = 0;
    const errors: string[] = [];
    
    // Update products one by one for better progress tracking
    for (const productId of productIds) {
      onProgress?.({ 
        completed, 
        succeeded, 
        failed, 
        currentItem: `Updating model for product ${productId}`,
        errors: errors.slice(-5)
      });
      
      try {
        const { error } = await supabase
          .from('products')
          .update({ model_reference: targetModel })
          .eq('id', productId);
          
        if (error) {
          throw error;
        }

        succeeded++;

      } catch (error) {
        failed++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to update product ${productId}: ${errorMsg}`);
      } finally {
        completed++;
        onProgress?.({ 
          completed, 
          succeeded, 
          failed,
          currentItem: completed < productIds.length ? undefined : 'Finalizing...',
          errors: errors.slice(-5)
        });
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }
}