import { supabase } from "@/integrations/supabase/client";
import { BundleRNPVAnalysis, BundleProductRNPVInput, BundleProductInputData } from "@/types/bundleRNPV";

export class BundleRNPVPersistenceService {
  /**
   * Save a complete bundle rNPV analysis with all product inputs
   */
  async saveBundleAnalysis(
    bundleId: string,
    scenarioName: string,
    currency: string,
    totalBundleNPV: number,
    productInputs: Array<BundleProductInputData & { productNPV: number }>
  ): Promise<string | null> {
    try {
      // First, create or update the bundle analysis record
      const { data: analysisData, error: analysisError } = await supabase
        .from('bundle_rnpv_analyses' as any)
        .upsert({
          bundle_id: bundleId,
          scenario_name: scenarioName,
          total_bundle_rnpv: totalBundleNPV,
          currency: currency,
          calculation_date: new Date().toISOString(),
        }, {
          onConflict: 'bundle_id,scenario_name'
        })
        .select()
        .single() as any;

      if (analysisError) throw analysisError;

      const analysisId = analysisData.id;

      // Delete existing product inputs for this analysis
      await supabase
        .from('bundle_product_rnpv_inputs' as any)
        .delete()
        .eq('bundle_analysis_id', analysisId);

      // Insert new product inputs
      const productInputRecords = productInputs.map(input => ({
        bundle_analysis_id: analysisId,
        product_id: input.productId,
        sibling_group_id: input.siblingGroupId,
        market_code: input.marketCode,
        market_launch_date: input.marketLaunchDate?.toISOString(),
        forecast_duration: input.forecastDuration,
        development_phase_months: input.developmentPhaseMonths,
        monthly_sales_forecast: input.monthlySalesForecast,
        annual_sales_forecast_change: input.annualSalesForecastChange,
        initial_unit_price: input.initialUnitPrice,
        annual_unit_price_change: input.annualUnitPriceChange,
        initial_variable_cost: input.initialVariableCost,
        annual_variable_cost_change: input.annualVariableCostChange,
        allocated_monthly_fixed_costs: input.allocatedMonthlyFixedCosts,
        annual_fixed_cost_change: input.annualFixedCostChange,
        rnd_work_costs: input.rndWorkCosts,
        rnd_work_costs_spread: input.rndWorkCostsSpread,
        rnd_material_machine_costs: input.rndMaterialMachineCosts,
        rnd_material_machine_spread: input.rndMaterialMachineSpread,
        rnd_startup_production_costs: input.rndStartupProductionCosts,
        rnd_startup_production_spread: input.rndStartupProductionSpread,
        rnd_patent_costs: input.rndPatentCosts,
        rnd_patent_spread: input.rndPatentSpread,
        total_marketing_budget: input.totalMarketingBudget,
        marketing_spread_months: input.marketingSpreadMonths,
        royalty_rate: input.royaltyRate,
        discount_rate: input.discountRate,
        patent_expiry: input.patentExpiry,
        post_patent_decline_rate: input.postPatentDeclineRate,
        cannibalized_revenue: input.cannibalizedRevenue,
        affected_products: input.affectedProducts,
        product_npv: input.productNPV,
      }));

      const { error: inputsError } = await supabase
        .from('bundle_product_rnpv_inputs' as any)
        .insert(productInputRecords);

      if (inputsError) throw inputsError;

      console.log(`Bundle rNPV analysis saved for bundle ${bundleId}, scenario ${scenarioName}`);
      return analysisId;
    } catch (error) {
      console.error('Error saving bundle rNPV analysis:', error);
      return null;
    }
  }

  /**
   * Load a bundle rNPV analysis by bundle ID and scenario name
   */
  async loadBundleAnalysis(bundleId: string, scenarioName: string = 'Base Case'): Promise<{
    analysis: BundleRNPVAnalysis;
    productInputs: BundleProductRNPVInput[];
  } | null> {
    try {
      const { data: analysis, error: analysisError } = await supabase
        .from('bundle_rnpv_analyses' as any)
        .select('*')
        .eq('bundle_id', bundleId)
        .eq('scenario_name', scenarioName)
        .single() as any;

      if (analysisError) {
        if (analysisError.code === 'PGRST116') return null;
        throw analysisError;
      }

      const { data: productInputs, error: inputsError } = await supabase
        .from('bundle_product_rnpv_inputs' as any)
        .select('*')
        .eq('bundle_analysis_id', analysis.id) as any;

      if (inputsError) throw inputsError;

      return {
        analysis: analysis as BundleRNPVAnalysis,
        productInputs: (productInputs || []) as BundleProductRNPVInput[],
      };
    } catch (error) {
      console.error('Error loading bundle rNPV analysis:', error);
      return null;
    }
  }

  /**
   * Get all scenarios for a bundle
   */
  async getBundleScenarios(bundleId: string): Promise<BundleRNPVAnalysis[]> {
    try {
      const { data, error } = await supabase
        .from('bundle_rnpv_analyses' as any)
        .select('*')
        .eq('bundle_id', bundleId)
        .order('created_at', { ascending: false }) as any;

      if (error) throw error;
      return (data || []) as BundleRNPVAnalysis[];
    } catch (error) {
      console.error('Error loading bundle scenarios:', error);
      return [];
    }
  }

  /**
   * Delete a scenario
   */
  async deleteScenario(analysisId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('bundle_rnpv_analyses' as any)
        .delete()
        .eq('id', analysisId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting scenario:', error);
      return false;
    }
  }
}
