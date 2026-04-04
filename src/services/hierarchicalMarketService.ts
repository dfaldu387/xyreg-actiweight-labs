import { supabase } from "@/integrations/supabase/client";
import { EnhancedProductMarket } from "@/utils/enhancedMarketRiskClassMapping";

export interface MarketInheritanceChain {
  companyMarkets: EnhancedProductMarket[];
  categoryMarkets: EnhancedProductMarket[];
  platformMarkets: EnhancedProductMarket[];
  modelMarkets: EnhancedProductMarket[];
  productMarkets: EnhancedProductMarket[];
  effectiveMarkets: EnhancedProductMarket[];
  inheritanceSource: 'company' | 'category' | 'platform' | 'model' | 'individual';
  inheritancePath: string[];
}

export interface HierarchicalMarketData {
  companyId: string;
  categoryId?: string;
  platformName?: string;
  modelName?: string;
  productId?: string;
}

export class HierarchicalMarketService {
  
  // Get markets for company level
  static async getCompanyMarkets(companyId: string): Promise<EnhancedProductMarket[]> {
    // console.log('[HierarchicalMarketService.getCompanyMarkets] Fetching for company:', companyId);
    const { data, error } = await supabase
      .from('companies')
      .select('default_markets, name')
      .eq('id', companyId)
      .single();
    
    if (error) {
      console.error('[HierarchicalMarketService.getCompanyMarkets] Error:', error);
      throw error;
    }
    
    // console.log('[HierarchicalMarketService.getCompanyMarkets] Found company:', data?.name);
    // console.log('[HierarchicalMarketService.getCompanyMarkets] Markets:', data?.default_markets);
    return (data?.default_markets as EnhancedProductMarket[]) || [];
  }

  // Set markets for company level
  static async setCompanyMarkets(companyId: string, markets: EnhancedProductMarket[]): Promise<void> {
    // console.log('[HierarchicalMarketService.setCompanyMarkets] Setting markets for company:', companyId);
    // console.log('[HierarchicalMarketService.setCompanyMarkets] Markets payload:', markets);
    // console.log('[HierarchicalMarketService.setCompanyMarkets] Markets JSON:', JSON.stringify(markets, null, 2));
    
    const { error } = await supabase
      .from('companies')
      .update({ default_markets: markets })
      .eq('id', companyId);
    
    if (error) {
      console.error('[HierarchicalMarketService.setCompanyMarkets] Database error:', error);
      throw error;
    }
    
    // console.log('[HierarchicalMarketService.setCompanyMarkets] Successfully updated company markets');
  }

  // Get markets for category level
  static async getCategoryMarkets(categoryId: string): Promise<EnhancedProductMarket[]> {
    const { data, error } = await supabase
      .from('company_device_categories')
      .select('markets')
      .eq('id', categoryId)
      .single();
    
    if (error) throw error;
    return (data?.markets as EnhancedProductMarket[]) || [];
  }

  // Set markets for category level
  static async setCategoryMarkets(categoryId: string, markets: EnhancedProductMarket[]): Promise<void> {
    const { error } = await supabase
      .from('company_device_categories')
      .update({ markets })
      .eq('id', categoryId);
    
    if (error) throw error;
  }

  // Get markets for platform level
  static async getPlatformMarkets(platformId: string): Promise<EnhancedProductMarket[]> {
    const { data, error } = await supabase
      .from('company_platforms')
      .select('markets')
      .eq('id', platformId)
      .single();
    
    if (error) throw error;
    return (data?.markets as EnhancedProductMarket[]) || [];
  }

  // Set markets for platform level
  static async setPlatformMarkets(platformId: string, markets: EnhancedProductMarket[]): Promise<void> {
    const { error } = await supabase
      .from('company_platforms')
      .update({ markets })
      .eq('id', platformId);
    
    if (error) throw error;
  }

  // Get markets for model level
  static async getModelMarkets(modelId: string): Promise<EnhancedProductMarket[]> {
    const { data, error } = await supabase
      .from('company_product_models')
      .select('markets')
      .eq('id', modelId)
      .single();
    
    if (error) throw error;
    return (data?.markets as EnhancedProductMarket[]) || [];
  }

  // Set markets for model level
  static async setModelMarkets(modelId: string, markets: EnhancedProductMarket[]): Promise<void> {
    const { error } = await supabase
      .from('company_product_models')
      .update({ markets })
      .eq('id', modelId);
    
    if (error) throw error;
  }

  // Resolve effective markets for a product using inheritance chain
  static async resolveEffectiveMarkets(productId: string): Promise<MarketInheritanceChain> {
    // Get product details to build inheritance chain
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        id, 
        company_id, 
        device_category, 
        product_platform, 
        model_reference, 
        markets
      `)
      .eq('id', productId)
      .single();

    if (productError) throw productError;

    const inheritanceChain: MarketInheritanceChain = {
      companyMarkets: [],
      categoryMarkets: [],
      platformMarkets: [],
      modelMarkets: [],
      productMarkets: (product.markets as EnhancedProductMarket[]) || [],
      effectiveMarkets: [],
      inheritanceSource: 'individual',
      inheritancePath: []
    };

    // Get company markets
    inheritanceChain.companyMarkets = await this.getCompanyMarkets(product.company_id);

    // Get category markets if category exists
    if (product.device_category) {
      const { data: category } = await supabase
        .from('company_device_categories')
        .select('id, markets')
        .eq('company_id', product.company_id)
        .eq('name', product.device_category)
        .single();
      
      if (category?.markets) {
        inheritanceChain.categoryMarkets = category.markets as EnhancedProductMarket[];
      }
    }

    // Get platform markets if platform exists
    if (product.product_platform) {
      const { data: platform } = await supabase
        .from('company_platforms')
        .select('id, markets')
        .eq('company_id', product.company_id)
        .eq('name', product.product_platform)
        .single();
      
      if (platform?.markets) {
        inheritanceChain.platformMarkets = platform.markets as EnhancedProductMarket[];
      }
    }

    // Get model markets if model exists
    if (product.model_reference) {
      const { data: model } = await supabase
        .from('company_product_models')
        .select('id, markets')
        .eq('company_id', product.company_id)
        .eq('name', product.model_reference)
        .single();
      
      if (model?.markets) {
        inheritanceChain.modelMarkets = model.markets as EnhancedProductMarket[];
      }
    }

    // Determine effective markets using inheritance hierarchy
    inheritanceChain.effectiveMarkets = this.calculateEffectiveMarkets(inheritanceChain);
    
    return inheritanceChain;
  }

  // Calculate effective markets based on inheritance hierarchy
  private static calculateEffectiveMarkets(chain: MarketInheritanceChain): EnhancedProductMarket[] {
    // Priority: individual > model > platform > category > company
    
    if (chain.productMarkets && chain.productMarkets.length > 0) {
      chain.inheritanceSource = 'individual';
      chain.inheritancePath = ['individual'];
      return chain.productMarkets;
    }

    if (chain.modelMarkets && chain.modelMarkets.length > 0) {
      chain.inheritanceSource = 'model';
      chain.inheritancePath = ['company', 'category', 'platform', 'model'];
      return chain.modelMarkets;
    }

    if (chain.platformMarkets && chain.platformMarkets.length > 0) {
      chain.inheritanceSource = 'platform';
      chain.inheritancePath = ['company', 'category', 'platform'];
      return chain.platformMarkets;
    }

    if (chain.categoryMarkets && chain.categoryMarkets.length > 0) {
      chain.inheritanceSource = 'category';
      chain.inheritancePath = ['company', 'category'];
      return chain.categoryMarkets;
    }

    if (chain.companyMarkets && chain.companyMarkets.length > 0) {
      chain.inheritanceSource = 'company';
      chain.inheritancePath = ['company'];
      return chain.companyMarkets;
    }

    // No markets defined anywhere
    chain.inheritanceSource = 'individual';
    chain.inheritancePath = [];
    return [];
  }

  // Get inheritance stats for company (used for display purposes)
  static async getInheritanceStats(companyId: string): Promise<{
    totalProducts: number;
    productsWithIndividualMarkets: number;
    productsInheritingFromCompany: number;
    productsInheritingFromCategory: number;
    productsInheritingFromPlatform: number;
    productsInheritingFromModel: number;
  }> {
    // console.log('[HierarchicalMarketService.getInheritanceStats] Fetching stats for company:', companyId);
    
    const { data: products, error } = await supabase
      .from('products')
      .select('id, markets, device_category, product_platform, model_reference')
      .eq('company_id', companyId)
      .eq('is_archived', false);

    if (error) {
      console.error('[HierarchicalMarketService.getInheritanceStats] Error:', error);
      throw error;
    }
    
    // console.log('[HierarchicalMarketService.getInheritanceStats] Found products:', products?.length || 0);

    const stats = {
      totalProducts: products?.length || 0,
      productsWithIndividualMarkets: 0,
      productsInheritingFromCompany: 0,
      productsInheritingFromCategory: 0,
      productsInheritingFromPlatform: 0,
      productsInheritingFromModel: 0
    };

    // Calculate inheritance stats by checking what each product would inherit from
    for (const product of products || []) {
      if (product.markets && (product.markets as any[]).length > 0) {
        stats.productsWithIndividualMarkets++;
      } else if (product.model_reference) {
        // Check if model has markets
        const { data: model } = await supabase
          .from('company_product_models')
          .select('markets')
          .eq('company_id', companyId)
          .eq('name', product.model_reference)
          .single();
        
        if (model?.markets && (model.markets as any[]).length > 0) {
          stats.productsInheritingFromModel++;
          continue;
        }
      }
      
      if (product.product_platform) {
        // Check if platform has markets
        const { data: platform } = await supabase
          .from('company_platforms')
          .select('markets')
          .eq('company_id', companyId)
          .eq('name', product.product_platform)
          .single();
        
        if (platform?.markets && (platform.markets as any[]).length > 0) {
          stats.productsInheritingFromPlatform++;
          continue;
        }
      }
      
      if (product.device_category) {
        // Check if category has markets
        const { data: category } = await supabase
          .from('company_device_categories')
          .select('markets')
          .eq('company_id', companyId)
          .eq('name', product.device_category)
          .single();
        
        if (category?.markets && (category.markets as any[]).length > 0) {
          stats.productsInheritingFromCategory++;
          continue;
        }
      }
      
      // Falls back to company level
      stats.productsInheritingFromCompany++;
    }

    return stats;
  }
}