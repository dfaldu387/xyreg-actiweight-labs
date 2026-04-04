import { supabase } from "@/integrations/supabase/client";

export class PlatformModelSyncService {
  /**
   * Syncs platforms and models from product data to dedicated tables
   */
  static async syncFromProducts(companyId: string) {
    try {
      console.log('Starting sync for company:', companyId);
      
      // Fetch all products for the company
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('product_platform, model_reference')
        .eq('company_id', companyId)
        .eq('is_archived', false);

      if (productsError) {
        throw productsError;
      }

      if (!products || products.length === 0) {
        console.log('No products found for company');
        return { platformsCreated: 0, modelsCreated: 0 };
      }

      // Extract unique platforms and models
      const uniquePlatforms = new Set<string>();
      const uniqueModels = new Set<string>();

      products.forEach(product => {
        if (product.product_platform) {
          uniquePlatforms.add(product.product_platform);
        }
        if (product.model_reference) {
          uniqueModels.add(product.model_reference);
        }
      });

      console.log('Found platforms:', Array.from(uniquePlatforms));
      console.log('Found models:', Array.from(uniqueModels));

      // Sync platforms
      let platformsCreated = 0;
      for (const platformName of uniquePlatforms) {
        // Check if platform already exists first
        const { data: existingPlatform } = await supabase
          .from('company_platforms')
          .select('id')
          .eq('company_id', companyId)
          .eq('name', platformName)
          .single();

        if (!existingPlatform) {
          const { error: platformError } = await supabase
            .from('company_platforms')
            .insert({
              company_id: companyId,
              name: platformName,
              description: `Platform automatically created from product data`,
              markets: []
            });

          if (platformError) {
            console.error('Error creating platform:', platformError);
          } else {
            platformsCreated++;
          }
        }
      }

      // Sync models
      let modelsCreated = 0;
      for (const modelName of uniqueModels) {
        // Check if model already exists first
        const { data: existingModel } = await supabase
          .from('company_product_models')
          .select('id')
          .eq('company_id', companyId)
          .eq('name', modelName)
          .single();

        if (!existingModel) {
          const { error: modelError } = await supabase
            .from('company_product_models')
            .insert({
              company_id: companyId,
              name: modelName,
              description: `Model automatically created from product data`,
              markets: []
            });

          if (modelError) {
            console.error('Error creating model:', modelError);
          } else {
            modelsCreated++;
          }
        }
      }

      console.log(`Sync completed: ${platformsCreated} platforms, ${modelsCreated} models`);
      return { platformsCreated, modelsCreated };

    } catch (error) {
      console.error('Error syncing platforms and models:', error);
      throw error;
    }
  }

  /**
   * Gets platform and model stats from product data
   */
  static async getPlatformModelStats(companyId: string) {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('product_platform, model_reference')
        .eq('company_id', companyId)
        .eq('is_archived', false);

      if (error) throw error;

      const platformCounts: { [key: string]: number } = {};
      const modelCounts: { [key: string]: number } = {};

      products?.forEach(product => {
        if (product.product_platform) {
          platformCounts[product.product_platform] = (platformCounts[product.product_platform] || 0) + 1;
        }
        if (product.model_reference) {
          modelCounts[product.model_reference] = (modelCounts[product.model_reference] || 0) + 1;
        }
      });

      return { platformCounts, modelCounts };
    } catch (error) {
      console.error('Error getting platform/model stats:', error);
      throw error;
    }
  }
}