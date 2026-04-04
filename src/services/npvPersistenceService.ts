import { supabase } from "@/integrations/supabase/client";
import { NPVCalculationResult } from "./npvCalculationService";
import { AffectedProduct } from "@/types/affectedProducts";

export interface MarketNPVInputData {
  marketLaunchDate?: Date;
  forecastDuration: number;
  developmentPhaseMonths: number;
  monthlySalesForecast: number;
  annualSalesForecastChange: number;
  initialUnitPrice: number;
  annualUnitPriceChange: number;
  initialVariableCost: number;
  annualVariableCostChange: number;
  allocatedMonthlyFixedCosts: number;
  annualFixedCostChange: number;
  // Granular R&D costs
  rndWorkCosts: number;
  rndWorkCostsSpread: number;
  rndMaterialMachineCosts: number;
  rndMaterialMachineSpread: number;
  rndStartupProductionCosts: number;
  rndStartupProductionSpread: number;
  rndPatentCosts: number;
  rndPatentSpread: number;
  totalMarketingBudget: number;
  marketingSpreadMonths: number;
  royaltyRate: number;
  discountRate: number;
  // Patent-related fields
  patentExpiry: number;
  postPatentDeclineRate: number;
  // NEW: Simple cannibalized revenue field
  cannibalizedRevenue: number;
  affectedProducts: AffectedProduct[];
  // Additional cost fields
  operationalCosts?: number;
  customerAcquisitionCost?: number;
}

export interface NPVAnalysisData {
  selectedCurrency: string;
  marketInputData: Record<string, MarketNPVInputData>;
  marketCalculations: Record<string, NPVCalculationResult>;
  totalPortfolioNPV: number;
  lastUpdated: Date;
}

export class NPVPersistenceService {
  async saveMarketCalculation(
    productId: string,
    marketCode: string,
    inputData: MarketNPVInputData,
    calculationResult: NPVCalculationResult,
    scenarioName: string = 'Base Case'
  ): Promise<boolean> {
    try {
      // Fetch existing NPV analysis for this scenario
      let { data: existingAnalysis, error: fetchError } = await supabase
        .from('product_npv_analyses')
        .select('*')
        .eq('product_id', productId)
        .eq('scenario_name', scenarioName)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      let analysisData: NPVAnalysisData;

      if (existingAnalysis) {
        // Parse existing market input data and calculations with proper type assertion
        const existingMarketInputData = (existingAnalysis.market_input_data as unknown as Record<string, MarketNPVInputData>) || {};
        const existingMarketCalculations = (existingAnalysis.market_calculations as unknown as Record<string, NPVCalculationResult>) || {};
        
        // Update existing analysis
        analysisData = {
          selectedCurrency: existingAnalysis.selected_currency,
          marketInputData: {
            ...existingMarketInputData,
            [marketCode]: inputData,
          },
          marketCalculations: {
            ...existingMarketCalculations,
            [marketCode]: calculationResult,
          },
          totalPortfolioNPV: 0, // Recalculate this on the client side
          lastUpdated: new Date(),
        };
        
        const { error: updateError } = await supabase
          .from('product_npv_analyses')
          .update({ 
            market_input_data: analysisData.marketInputData as any,
            market_calculations: analysisData.marketCalculations as any,
            total_portfolio_npv: analysisData.totalPortfolioNPV,
            scenario_name: scenarioName,
            last_calculated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('product_id', productId)
          .eq('scenario_name', scenarioName);

        if (updateError) {
          throw updateError;
        }
        console.log(`NPV analysis updated for product ${productId}`);
      } else {
        // Create new analysis
        analysisData = {
          selectedCurrency: 'USD', // Default currency
          marketInputData: { [marketCode]: inputData },
          marketCalculations: { [marketCode]: calculationResult },
          totalPortfolioNPV: 0,
          lastUpdated: new Date(),
        };

        const { error: insertError } = await supabase
          .from('product_npv_analyses')
          .insert({ 
            product_id: productId, 
            selected_currency: analysisData.selectedCurrency,
            market_input_data: analysisData.marketInputData as any,
            market_calculations: analysisData.marketCalculations as any,
            total_portfolio_npv: analysisData.totalPortfolioNPV,
            scenario_name: scenarioName,
            last_calculated_at: new Date().toISOString()
          });

        if (insertError) {
          throw insertError;
        }
        console.log(`NPV analysis created for product ${productId}`);
      }

      return true;
    } catch (error) {
      console.error('Error saving NPV analysis:', error);
      return false;
    }
  }

  async loadNPVAnalysis(productId: string, scenarioName: string = 'Base Case'): Promise<NPVAnalysisData | null> {
    try {
      const { data, error } = await supabase
        .from('product_npv_analyses')
        .select('*')
        .eq('product_id', productId)
        .eq('scenario_name', scenarioName)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') {
          // No data found, which is acceptable
          return null;
        }
        throw error;
      }

      if (data) {
        // console.log(`NPV analysis loaded for product ${productId}`);
        return {
          selectedCurrency: data.selected_currency,
          marketInputData: (data.market_input_data as unknown as Record<string, MarketNPVInputData>) || {},
          marketCalculations: (data.market_calculations as unknown as Record<string, NPVCalculationResult>) || {},
          totalPortfolioNPV: data.total_portfolio_npv || 0,
          lastUpdated: new Date(data.last_calculated_at || data.updated_at)
        } as NPVAnalysisData;
      }

      return null;
    } catch (error) {
      console.error('Error loading NPV analysis:', error);
      return null;
    }
  }
}
