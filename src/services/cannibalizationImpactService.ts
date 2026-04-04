
import { supabase } from '@/integrations/supabase/client';
import { AffectedProduct } from '@/types/affectedProducts';

export interface CannibalizationImpact {
  impactingProductId: string;
  impactingProductName: string;
  affectedProductId: string;
  affectedProductName: string;
  marketCode: string;
  monthsToReachRoof: number;
  totalCannibalizationPercentage: number;
  estimatedMonthlyLoss: number;
  totalEstimatedLoss: number;
  npvAnalysisId: string;
  lastUpdated: Date;
}

export interface BidirectionalCannibalizationData {
  thisProductCannibalizes: CannibalizationImpact[];
  thisProductIsCannibalized: CannibalizationImpact[];
  netPortfolioImpact: number;
}

export class CannibalizationImpactService {
  /**
   * Get all cannibalization impacts for a specific product (both directions)
   */
  async getBidirectionalCannibalizationData(productId: string): Promise<BidirectionalCannibalizationData> {
    try {
      console.log(`[CannibalizationImpactService] Loading cannibalization data for product: ${productId}`);
      
      // Get impacts where this product is cannibalizing others
      const thisProductCannibalizes = await this.getProductCannibalizingOthers(productId);
      
      // Get impacts where this product is being cannibalized
      const thisProductIsCannibalized = await this.getProductBeingCannibalized(productId);
      
      // Calculate net portfolio impact
      const positiveImpact = thisProductCannibalizes.reduce((sum, impact) => sum + (impact.estimatedMonthlyLoss * 60), 0); // Assume 60 months
      const negativeImpact = thisProductIsCannibalized.reduce((sum, impact) => sum + impact.totalEstimatedLoss, 0);
      const netPortfolioImpact = positiveImpact - negativeImpact;
      
      console.log(`[CannibalizationImpactService] Found ${thisProductCannibalizes.length} products this cannibalizes, ${thisProductIsCannibalized.length} products cannibalizing this`);
      
      return {
        thisProductCannibalizes,
        thisProductIsCannibalized,
        netPortfolioImpact
      };
    } catch (error) {
      console.error('[CannibalizationImpactService] Error loading cannibalization data:', error);
      return {
        thisProductCannibalizes: [],
        thisProductIsCannibalized: [],
        netPortfolioImpact: 0
      };
    }
  }
  
  /**
   * Get products that this product is cannibalizing
   */
  private async getProductCannibalizingOthers(productId: string): Promise<CannibalizationImpact[]> {
    try {
      // Query NPV analyses where this product lists other products as affected
      const { data: npvAnalyses, error } = await supabase
        .from('product_npv_analyses')
        .select(`
          id,
          product_id,
          market_input_data,
          updated_at,
          products!inner(name)
        `)
        .eq('product_id', productId)
        .not('market_input_data', 'is', null);
      
      if (error) {
        console.error('[CannibalizationImpactService] Error querying NPV analyses:', error);
        return [];
      }
      
      const impacts: CannibalizationImpact[] = [];
      
      for (const analysis of npvAnalyses || []) {
        const marketInputData = analysis.market_input_data as Record<string, any>;
        
        // Process each market's affected products
        Object.entries(marketInputData).forEach(([marketCode, inputData]) => {
          const affectedProducts = inputData?.affectedProducts as AffectedProduct[] || [];
          
          affectedProducts.forEach(async (affectedProduct) => {
            // Get the affected product name
            const { data: productData } = await supabase
              .from('products')
              .select('name')
              .eq('id', affectedProduct.productId)
              .single();
            
            // Estimate monthly loss (simplified calculation)
            const estimatedMonthlyLoss = 10000 * (affectedProduct.totalCannibalizationPercentage / 100);
            
            impacts.push({
              impactingProductId: productId,
              impactingProductName: analysis.products?.name || 'Unknown',
              affectedProductId: affectedProduct.productId,
              affectedProductName: productData?.name || affectedProduct.productName,
              marketCode,
              monthsToReachRoof: affectedProduct.monthsToReachRoof,
              totalCannibalizationPercentage: affectedProduct.totalCannibalizationPercentage,
              estimatedMonthlyLoss,
              totalEstimatedLoss: estimatedMonthlyLoss * affectedProduct.monthsToReachRoof,
              npvAnalysisId: analysis.id,
              lastUpdated: new Date(analysis.updated_at)
            });
          });
        });
      }
      
      return impacts;
    } catch (error) {
      console.error('[CannibalizationImpactService] Error getting products cannibalized by this product:', error);
      return [];
    }
  }
  
  /**
   * Get products that are cannibalizing this product
   */
  private async getProductBeingCannibalized(productId: string): Promise<CannibalizationImpact[]> {
    try {
      // Query all NPV analyses to find where this product is listed as affected
      const { data: allNpvAnalyses, error } = await supabase
        .from('product_npv_analyses')
        .select(`
          id,
          product_id,
          market_input_data,
          updated_at,
          products!inner(name)
        `)
        .not('market_input_data', 'is', null);
      
      if (error) {
        console.error('[CannibalizationImpactService] Error querying all NPV analyses:', error);
        return [];
      }
      
      const impacts: CannibalizationImpact[] = [];
      
      for (const analysis of allNpvAnalyses || []) {
        // Skip analyses for the same product
        if (analysis.product_id === productId) continue;
        
        const marketInputData = analysis.market_input_data as Record<string, any>;
        
        // Check if this product is listed as affected in any market
        Object.entries(marketInputData).forEach(([marketCode, inputData]) => {
          const affectedProducts = inputData?.affectedProducts as AffectedProduct[] || [];
          
          const thisProductAffected = affectedProducts.find(
            (affected) => affected.productId === productId
          );
          
          if (thisProductAffected) {
            // Get current product name
            const estimatedMonthlyLoss = 10000 * (thisProductAffected.totalCannibalizationPercentage / 100);
            
            impacts.push({
              impactingProductId: analysis.product_id,
              impactingProductName: analysis.products?.name || 'Unknown',
              affectedProductId: productId,
              affectedProductName: thisProductAffected.productName,
              marketCode,
              monthsToReachRoof: thisProductAffected.monthsToReachRoof,
              totalCannibalizationPercentage: thisProductAffected.totalCannibalizationPercentage,
              estimatedMonthlyLoss,
              totalEstimatedLoss: estimatedMonthlyLoss * thisProductAffected.monthsToReachRoof,
              npvAnalysisId: analysis.id,
              lastUpdated: new Date(analysis.updated_at)
            });
          }
        });
      }
      
      return impacts;
    } catch (error) {
      console.error('[CannibalizationImpactService] Error getting products cannibalizing this product:', error);
      return [];
    }
  }
  
  /**
   * Update cannibalization impact when NPV analysis changes
   */
  async updateCannibalizationImpacts(productId: string, affectedProducts: AffectedProduct[]): Promise<void> {
    try {
      console.log(`[CannibalizationImpactService] Updating cannibalization impacts for product: ${productId}`);
      
      // In a real implementation, this would:
      // 1. Trigger recalculation of affected products' NPVs
      // 2. Send notifications to stakeholders
      // 3. Update portfolio-level metrics
      // 4. Log the changes for audit purposes
      
      for (const affectedProduct of affectedProducts) {
        console.log(`[CannibalizationImpactService] Product ${productId} affects ${affectedProduct.productName} by ${affectedProduct.totalCannibalizationPercentage}%`);
      }
      
    } catch (error) {
      console.error('[CannibalizationImpactService] Error updating cannibalization impacts:', error);
      throw error;
    }
  }
}
