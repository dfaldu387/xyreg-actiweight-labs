import { supabase } from "@/integrations/supabase/client";
import { SunburstNode } from "@/types/charts";
import { VariantFilters, MarketFilters } from "@/components/charts/VariantFilters";

// Extended SunburstNode to include productId for navigation
export interface EnhancedSunburstNode extends SunburstNode {
  productId?: string; // Add productId for leaf nodes
}

interface ProductData {
  id: string;
  name: string;
  device_category: string | null;
  basic_udi_di: string | null;
  model_reference: string | null;
  parent_product_id: string | null;
  markets?: any; // JSONB field for market data
}

interface VariantData {
  id: string;
  name?: string;
  product_id: string;
  product_variant_values: Array<{
    dimension_id: string;
    option_id: string;
    product_variation_dimensions: { id: string; name: string };
    product_variation_options: { id: string; name: string };
  }>;
}

export async function getPortfolioSunburstData(companyId: string, filters?: VariantFilters, marketFilters?: MarketFilters): Promise<EnhancedSunburstNode> {

  
  if (!companyId) {
    const error = new Error('Company ID is required for portfolio data');
    console.error('[PortfolioSunburstService] ❌', error.message);
    throw error;
  }

  try {
    // Step 1: Fetch all products for the company
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, device_category, basic_udi_di, model_reference, parent_product_id, markets')
      .eq('company_id', companyId)
      .eq('is_archived', false);

    console.timeEnd('[PortfolioSunburstService] Products Query');

    if (productsError) {
      console.error('[PortfolioSunburstService] ❌ Products query failed:', productsError);
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    if (!products || products.length === 0) {
      console.warn('[PortfolioSunburstService] ⚠️ No products found for company:', companyId);
      console.timeEnd('[PortfolioSunburstService] Total Processing Time');
      
      // Return empty but valid structure instead of throwing
      return {
        name: 'Portfolio',
        value: 0,
        children: []
      };
    }

    
    
    // Step 2: Fetch company categories for mapping
    
    console.time('[PortfolioSunburstService] Categories Query');
    
    const { data: categories, error: categoriesError } = await supabase
      .from('company_device_categories')
      .select('id, name')
      .eq('company_id', companyId);

    console.timeEnd('[PortfolioSunburstService] Categories Query');

    if (categoriesError) {
      console.warn('[PortfolioSunburstService] ⚠️ Categories query failed, continuing without mapping:', categoriesError);
    }

    

    // Step 3: Create comprehensive category mapping
    const categoryMap = new Map<string, string>();
    categories?.forEach(cat => {
      categoryMap.set(cat.id, cat.name);          // UUID -> Name
      categoryMap.set(cat.name, cat.name);        // Name -> Name (direct matches)
      categoryMap.set(cat.name.toLowerCase(), cat.name); // Case-insensitive
    });

    

    // Step 4: Transform and validate data
    
    
    const transformedProducts = products.map((product, index) => {
      // Resolve category name
      let resolvedCategory = "Uncategorized";
      if (product.device_category) {
        resolvedCategory = categoryMap.get(product.device_category) || 
                          categoryMap.get(product.device_category.toLowerCase()) ||
                          product.device_category;
      }

      return {
        ...product,
        device_category: resolvedCategory
      };
    });

    // Step 5: Fetch product variants - use the exact same query that works in the network logs
    
    console.time('[PortfolioSunburstService] Variants Query');
    
    const productIds = products.map(p => p.id);
    let variants: VariantData[] = [];
    
    try {
      const { data: variantData, error: variantError } = await supabase
        .from('product_variants')
        .select(`
          id,
          product_id,
          product_variant_values!inner(
            dimension_id,
            option_id,
            product_variation_dimensions!inner(id, name),
            product_variation_options!inner(id, name)
          )
        `)
        .eq('product_variant_values.product_variation_dimensions.company_id', companyId);

      if (variantError) {
        console.warn('[PortfolioSunburstService] ⚠️ Variants query failed:', variantError);
        variants = [];
      } else {
        variants = (variantData || []).map(v => ({
          ...v,
          product_variant_values: (v.product_variant_values || []).map((pv: any) => ({
            ...pv,
            product_variation_dimensions: Array.isArray(pv.product_variation_dimensions) 
              ? pv.product_variation_dimensions[0] 
              : pv.product_variation_dimensions,
            product_variation_options: Array.isArray(pv.product_variation_options) 
              ? pv.product_variation_options[0] 
              : pv.product_variation_options,
          }))
        })) as VariantData[];
      }
    } catch (error) {
      console.warn('[PortfolioSunburstService] ⚠️ Variants query failed with exception:', error);
      variants = [];
    }

    console.timeEnd('[PortfolioSunburstService] Variants Query');
    

    // Step 6: Apply market filters first, then variant filters
    let filteredProducts = transformedProducts;

    // Apply market filters if provided
    if (marketFilters && Object.keys(marketFilters).some(market => marketFilters[market])) {
      
      
      const selectedMarkets = Object.entries(marketFilters)
        .filter(([_, isSelected]) => isSelected)
        .map(([market, _]) => market.toUpperCase());
      
      
      
      const beforeCount = filteredProducts.length;
      
      filteredProducts = filteredProducts.filter(product => {
        if (!product.markets) {
            
          return false; // No markets defined, exclude from filtered results
        }
        
        // Handle both array and string formats for markets
        const productMarkets = Array.isArray(product.markets) ? product.markets : 
                              typeof product.markets === 'string' ? [product.markets] :
                              typeof product.markets === 'object' ? [product.markets] :
                              [];
        
        
        
        // Check if product has any of the selected markets
        const hasMatchingMarket = productMarkets.some((market: any) => {
          const marketCode = typeof market === 'string' ? market.toUpperCase() : 
                            (market?.code || market?.name || market?.market || '').toString().toUpperCase();
          const matches = selectedMarkets.includes(marketCode);
          
          return matches;
        });
        
        return hasMatchingMarket;
      });
      
      
    }

    // Apply variant filters if provided  
    let filteredVariants = variants;

    if (filters && Object.keys(filters).some(key => filters[key] && filters[key].length > 0)) {
      
      
      if (variants.length > 0) {
        // Filter variants based on the selected options
        filteredVariants = variants.filter(variant => {
          if (!variant.product_variant_values || variant.product_variant_values.length === 0) {
            return false; // Skip variants without values
          }
          
          // Check if variant matches ALL active filters
          return Object.entries(filters).every(([dimensionId, optionIds]) => {
            if (!optionIds || optionIds.length === 0) return true; // No filter for this dimension
            
            // Check if variant has any of the selected options for this dimension
            return variant.product_variant_values.some(vv => 
              vv && vv.dimension_id === dimensionId && optionIds.includes(vv.option_id)
            );
          });
        });
        
        
        
        // Filter products to only include those with matching variants
        if (filteredVariants.length > 0) {
          const variantProductIds = new Set(filteredVariants.map(v => v.product_id));
          filteredProducts = filteredProducts.filter(p => variantProductIds.has(p.id));
        } else {
          // No matching variants found, return empty result
          filteredProducts = [];
        }
      } else {
        console.warn('[PortfolioSunburstService] ⚠️ No variant data available for filtering - showing all products');
        // If no variant data, keep the products already filtered by market
      }
    }

    // Step 7: Build sunburst data
    console.time('[PortfolioSunburstService] Sunburst Construction');
    
    const sunburstData = transformToSunburstData(filteredProducts, filteredVariants);
    
    console.timeEnd('[PortfolioSunburstService] Sunburst Construction');
    console.timeEnd('[PortfolioSunburstService] Total Processing Time');

    // Validate final data
    const totalProducts = computePortfolioTotal(sunburstData);
    
    if (totalProducts === 0) {
      if ((filters && Object.keys(filters).length > 0) || (marketFilters && Object.values(marketFilters).some(Boolean))) {
        // If filters are applied and result is empty, return empty structure
        return {
          name: "Product Portfolio",
          children: []
        };
      } else {
        throw new Error('Data processing resulted in empty sunburst. Check data quality and category mappings.');
      }
    }

    return sunburstData;
    
  } catch (error) {
    console.timeEnd('[PortfolioSunburstService] Total Processing Time');
    console.error('[PortfolioSunburstService] 💥 Fatal error:', error);
    
    // Re-throw the error instead of masking it
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`Portfolio data processing failed: ${String(error)}`);
    }
  }
}

function transformToSunburstData(products: ProductData[], variants: VariantData[]): EnhancedSunburstNode {
  
  // Early return for empty data to prevent infinite loops
  if (products.length === 0) {
    return {
      name: "Product Portfolio",
      children: []
    };
  }
  
  // Create a map for quick variant lookup
  const variantsByProduct = variants.reduce((acc, variant) => {
    if (variant && variant.product_id) {
      if (!acc[variant.product_id]) {
        acc[variant.product_id] = [];
      }
      acc[variant.product_id].push(variant);
    }
    return acc;
  }, {} as Record<string, VariantData[]>);


  // Group products by hierarchy: Category -> Basic UDI-DI -> Model -> Variants
  const hierarchy: { [category: string]: { [basicUdiDi: string]: { [model: string]: ProductData[] } } } = {};

  
  products.forEach((product, index) => {
    if (!product || !product.id) {
      console.warn(`[PortfolioSunburstService] ⚠️ Skipping invalid product at index ${index}`);
      return;
    }
    
    const category = product.device_category || "Uncategorized";
    const basicUdiDi = product.basic_udi_di || "No Basic UDI-DI";
    const model = product.model_reference || product.name || "Unknown Model";

    // Initialize hierarchy structure
    if (!hierarchy[category]) {
      hierarchy[category] = {};
    }
    if (!hierarchy[category][basicUdiDi]) {
      hierarchy[category][basicUdiDi] = {};
    }
    if (!hierarchy[category][basicUdiDi][model]) {
      hierarchy[category][basicUdiDi][model] = [];
    }

    hierarchy[category][basicUdiDi][model].push(product);
  });

  // Build 4-level structure: Category -> Basic UDI-DI -> Model -> Individual Products
  const categories: EnhancedSunburstNode[] = Object.entries(hierarchy).map(([categoryName, basicUdiGroups]) => {
    const basicUdiNodes: EnhancedSunburstNode[] = Object.entries(basicUdiGroups).map(([basicUdiDiName, models]) => {
      const modelNodes: EnhancedSunburstNode[] = Object.entries(models).map(([modelName, products]) => {
        // Create individual product nodes
        const productNodes: EnhancedSunburstNode[] = products.map(product => {
          const productVariants = variantsByProduct[product.id] || [];
          // Use variant count if available, otherwise count as 1 product
          const productValue = productVariants.length > 0 ? productVariants.length : 1;
          
          return {
            name: product.name || 'Unnamed Product',
            value: productValue,
            productId: product.id // Include productId for navigation
          };
        });

        return {
          name: modelName,
          children: productNodes
        };
      });

      return {
        name: basicUdiDiName,
        children: modelNodes
      };
    });

    return {
      name: categoryName,
      children: basicUdiNodes
    };
  });

  const result = {
    name: "Product Portfolio",
    children: categories
  };

  
  return result;
}

// Helper function to compute total from any node
export function computePortfolioTotal(node: EnhancedSunburstNode | undefined | null): number {
  if (!node) return 0;
  if (node.value != null) return node.value;
  if (!node.children) return 0;
  return node.children.reduce((sum, c) => sum + computePortfolioTotal(c), 0);
}