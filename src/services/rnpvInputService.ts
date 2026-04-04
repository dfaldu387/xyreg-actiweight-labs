import { supabase } from "@/integrations/supabase/client";
import { AffectedProduct } from "@/types/affectedProducts";

export interface RNPVInputData {
  id?: string;
  productId: string;
  companyId: string;
  createdBy: string;
  
  // Market parameters
  targetMarkets: string[];
  totalAddressableMarket: number;
  expectedMarketShare: number;
  launchYear: number;
  productLifespan: number;
  
  // Revenue model
  averageSellingPrice: number;
  annualPriceChange: number;
  annualVolumeGrowth: number;
  
  // Cost structure
  unitCost: number;
  annualCostChange: number;
  fixedCosts: number;
  totalDevelopmentCosts: number;
  
  // Financial parameters
  discountRate: number;
  taxRate: number;
  
  // Risk factors are now calculated from phase-based LoA
  // Individual risk factors removed in favor of milestone-based risk assessment
  
  // Cannibalization settings
  cannibalizationEnabled: boolean;
  affectedProducts: AffectedProduct[];
  portfolioSynergies: number;
  
  // Metadata
  analysisName: string;
  description?: string;
}

export class RNPVInputService {
  /**
   * Load saved rNPV inputs for a product
   */
  static async loadInputs(productId: string): Promise<RNPVInputData | null> {
    try {
      const { data, error } = await supabase
        .from('product_rnpv_inputs')
        .select('*')
        .eq('product_id', productId)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error loading rNPV inputs:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      return {
        id: data.id,
        productId: data.product_id,
        companyId: data.company_id,
        createdBy: data.created_by,
        targetMarkets: Array.isArray(data.target_markets) ? data.target_markets as string[] : [],
        totalAddressableMarket: Number(data.total_addressable_market),
        expectedMarketShare: Number(data.expected_market_share),
        launchYear: data.launch_year,
        productLifespan: data.product_lifespan,
        averageSellingPrice: Number(data.average_selling_price),
        annualPriceChange: Number(data.annual_price_change),
        annualVolumeGrowth: Number(data.annual_volume_growth),
        unitCost: Number(data.unit_cost),
        annualCostChange: Number(data.annual_cost_change),
        fixedCosts: Number(data.fixed_costs),
        totalDevelopmentCosts: Number(data.total_development_costs || 0),
        discountRate: Number(data.discount_rate),
        taxRate: Number(data.tax_rate),
        cannibalizationEnabled: data.cannibalization_enabled,
        affectedProducts: Array.isArray(data.affected_products) ? data.affected_products as unknown as AffectedProduct[] : [],
        portfolioSynergies: Number(data.portfolio_synergies),
        analysisName: data.analysis_name,
        description: data.description
      };
    } catch (error) {
      console.error('Error in loadInputs:', error);
      return null;
    }
  }

  /**
   * Save rNPV inputs for a product
   */
  static async saveInputs(inputs: RNPVInputData): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('product_rnpv_inputs')
        .upsert({
          id: inputs.id,
          product_id: inputs.productId,
          company_id: inputs.companyId,
          created_by: inputs.createdBy,
          target_markets: inputs.targetMarkets,
          total_addressable_market: inputs.totalAddressableMarket,
          expected_market_share: inputs.expectedMarketShare,
          launch_year: inputs.launchYear,
          product_lifespan: inputs.productLifespan,
          average_selling_price: inputs.averageSellingPrice,
          annual_price_change: inputs.annualPriceChange,
          annual_volume_growth: inputs.annualVolumeGrowth,
          unit_cost: inputs.unitCost,
          annual_cost_change: inputs.annualCostChange,
          fixed_costs: inputs.fixedCosts,
          total_development_costs: inputs.totalDevelopmentCosts,
          discount_rate: inputs.discountRate,
          tax_rate: inputs.taxRate,
          cannibalization_enabled: inputs.cannibalizationEnabled,
          affected_products: inputs.affectedProducts,
          portfolio_synergies: inputs.portfolioSynergies,
          analysis_name: inputs.analysisName,
          description: inputs.description
        });

      if (error) {
        console.error('Error saving rNPV inputs:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in saveInputs:', error);
      return false;
    }
  }

  /**
   * Get default inputs for a new analysis
   * Now attempts to load real development costs from milestones
   */
  static async getDefaultInputs(
    productId: string, 
    companyId: string, 
    userId: string
  ): Promise<RNPVInputData> {
    let totalDevelopmentCosts = 0;

    try {
      // Try to load real development costs from milestones
      const { BudgetIntegrationService } = await import('./enhanced-rnpv/budgetIntegrationService');
      const summary = await BudgetIntegrationService.getProductPhaseBudgetSummary(productId);
      totalDevelopmentCosts = summary.totalBudget;
      
      console.log('[RNPVInputService] Loaded real development costs from milestones:', totalDevelopmentCosts);
    } catch (error) {
      console.warn('[RNPVInputService] Could not load real development costs, using $0:', error);
      totalDevelopmentCosts = 0;
    }

    return {
      productId,
      companyId,
      createdBy: userId,
      targetMarkets: ['US'],
      totalAddressableMarket: 1000000,
      expectedMarketShare: 5.0,
      launchYear: new Date().getFullYear() + 2,
      productLifespan: 10,
      averageSellingPrice: 1000,
      annualPriceChange: 2.0,
      annualVolumeGrowth: 10.0,
      unitCost: 600,
      annualCostChange: 3.0,
      fixedCosts: 500000,
      totalDevelopmentCosts, // Now uses real data from milestones
      discountRate: 10.0,
      taxRate: 25.0,
      cannibalizationEnabled: false,
      affectedProducts: [],
      portfolioSynergies: 0.0,
      analysisName: 'Default Analysis'
    };
  }

  /**
   * DEPRECATED: Synchronous version - use async getDefaultInputs instead
   */
  static getDefaultInputsSync(productId: string, companyId: string, userId: string): RNPVInputData {
    return {
      productId,
      companyId,
      createdBy: userId,
      targetMarkets: ['US'],
      totalAddressableMarket: 1000000,
      expectedMarketShare: 5.0,
      launchYear: new Date().getFullYear() + 2,
      productLifespan: 10,
      averageSellingPrice: 1000,
      annualPriceChange: 2.0,
      annualVolumeGrowth: 10.0,
      unitCost: 600,
      annualCostChange: 3.0,
      fixedCosts: 500000,
      totalDevelopmentCosts: 0, // Sync version cannot load real data
      discountRate: 10.0,
      taxRate: 25.0,
      cannibalizationEnabled: false,
      affectedProducts: [],
      portfolioSynergies: 0.0,
      analysisName: 'Default Analysis'
    };
  }
}