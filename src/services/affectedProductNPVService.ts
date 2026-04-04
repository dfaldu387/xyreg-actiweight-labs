
import { AffectedProduct, calculateProgressiveCannibalization } from '@/types/affectedProducts';
import { NPVCalculationResult, calculateMarketNPV } from './npvCalculationService';

export interface AffectedProductNPVData {
  productId: string;
  productName: string;
  marketCode: string;
  npvResults: NPVCalculationResult;
  cannibalizationImpact: {
    monthlyLosses: number[];
    totalLoss: number;
    peakLossMonth: number;
  };
}

export class AffectedProductNPVService {
  /**
   * Creates automatic NPV analysis for a product affected by cannibalization
   */
  async createAffectedProductNPVAnalysis(
    newProductId: string,
    affectedProduct: AffectedProduct,
    marketCode: string,
    baselineMonthlyRevenue: number,
    forecastMonths: number = 60
  ): Promise<AffectedProductNPVData | null> {
    try {
      console.log(`Creating NPV analysis for affected product: ${affectedProduct.productName}`);
      
      // Generate baseline revenue pattern for the affected product
      const baselineRevenue: number[] = [];
      for (let month = 0; month < forecastMonths; month++) {
        // Assume existing product has declining revenue over time (natural decay)
        const monthlyBaseline = baselineMonthlyRevenue * Math.pow(0.995, month); // 0.5% monthly decline
        baselineRevenue.push(monthlyBaseline);
      }
      
      // Calculate cannibalization losses month by month
      const monthlyLosses: number[] = [];
      let totalLoss = 0;
      let peakLossMonth = 0;
      let peakLoss = 0;
      
      for (let month = 0; month < forecastMonths; month++) {
        const loss = calculateProgressiveCannibalization(
          affectedProduct,
          month + 1, // 1-based month
          baselineRevenue[month]
        );
        monthlyLosses.push(loss);
        totalLoss += loss;
        
        if (loss > peakLoss) {
          peakLoss = loss;
          peakLossMonth = month + 1;
        }
      }
      
      // Calculate the remaining revenue after cannibalization
      const adjustedRevenue = baselineRevenue.map((revenue, index) => 
        Math.max(0, revenue - monthlyLosses[index])
      );
      
      // Generate cost structure for the affected product (simplified)
      const costs = adjustedRevenue.map(revenue => revenue * 0.6); // Assume 60% cost ratio
      
      // Calculate NPV for the affected product with cannibalization impact
      const npvResults = calculateMarketNPV({
        revenue: adjustedRevenue,
        costs,
        discountRate: 10, // Default discount rate
        years: forecastMonths / 12,
        marketName: `${affectedProduct.productName} - ${marketCode}`,
        currency: 'USD', // Default currency
        rndCosts: {
          workCosts: 0,
          materialMachineCosts: 0,
          startupProductionCosts: 0,
          patentCosts: 0
        },
        rndTimingMonths: {
          workCostsSpread: 1,
          materialMachineSpread: 1,
          startupProductionSpread: 1,
          patentSpread: 1
        },
        developmentPhaseMonths: 0, // No development phase for existing products
        affectedProducts: [], // No nested cannibalization
        affectedProductsBaselineRevenue: {}
      });
      
      const result: AffectedProductNPVData = {
        productId: affectedProduct.productId,
        productName: affectedProduct.productName,
        marketCode,
        npvResults,
        cannibalizationImpact: {
          monthlyLosses,
          totalLoss,
          peakLossMonth
        }
      };
      
      console.log(`NPV analysis created for ${affectedProduct.productName}:
        - Total revenue loss: ${totalLoss.toFixed(2)}
        - Peak loss month: ${peakLossMonth}
        - Adjusted NPV: ${npvResults.npv.toFixed(2)}`);
      
      // In a real implementation, save this to the database
      await this.saveAffectedProductNPV(result);
      
      return result;
    } catch (error) {
      console.error('Error creating affected product NPV analysis:', error);
      return null;
    }
  }
  
  /**
   * Save affected product NPV analysis to the database
   */
  private async saveAffectedProductNPV(npvData: AffectedProductNPVData): Promise<void> {
    try {
      // In a real implementation, this would save to your database
      // For now, just log the action
      console.log(`Saving NPV analysis for affected product ${npvData.productName} to database`);
      
      // Example structure for database storage:
      const dbRecord = {
        product_id: npvData.productId,
        market_code: npvData.marketCode,
        analysis_type: 'cannibalization_impact',
        npv_results: npvData.npvResults,
        cannibalization_data: npvData.cannibalizationImpact,
        created_at: new Date(),
        analysis_status: 'automatic'
      };
      
      // This would be your actual database insert call
      // await supabase.from('product_npv_analyses').insert(dbRecord);
      
    } catch (error) {
      console.error('Error saving affected product NPV analysis:', error);
      throw error;
    }
  }
  
  /**
   * Update existing product NPV when it's affected by cannibalization
   */
  async updateProductForCannibalization(
    productId: string,
    marketCode: string,
    cannibalizationImpact: AffectedProduct
  ): Promise<void> {
    try {
      console.log(`Updating NPV for product ${productId} due to cannibalization from new product`);
      
      // In a real implementation:
      // 1. Load existing NPV analysis for the product
      // 2. Apply cannibalization impact to revenue projections
      // 3. Recalculate NPV
      // 4. Save updated analysis
      // 5. Create notifications/alerts for stakeholders
      
      console.log(`Cannibalization impact: ${cannibalizationImpact.totalCannibalizationPercentage}% over ${cannibalizationImpact.monthsToReachRoof} months`);
      
    } catch (error) {
      console.error('Error updating product for cannibalization:', error);
      throw error;
    }
  }
  
  /**
   * Get all NPV analyses affected by a specific product launch
   */
  async getAffectedProductAnalyses(newProductId: string): Promise<AffectedProductNPVData[]> {
    try {
      // In a real implementation, this would query the database
      // for all NPV analyses marked as affected by the new product
      
      console.log(`Loading affected product analyses for new product: ${newProductId}`);
      
      // Return empty array for now
      return [];
    } catch (error) {
      console.error('Error loading affected product analyses:', error);
      return [];
    }
  }
}
