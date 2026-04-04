import { supabase } from '@/integrations/supabase/client';
import { RNPVScenario, RNPVCalculationResult } from './interfaces';

export class RNPVScenarioService {
  /**
   * Create a new rNPV scenario
   */
  static async createScenario(
    scenario: Omit<RNPVScenario, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<RNPVScenario> {
    const { data, error } = await supabase
      .from('rnpv_scenarios')
      .insert({
        product_id: scenario.productId,
        company_id: scenario.companyId,
        scenario_name: scenario.scenarioName,
        scenario_description: scenario.scenarioDescription,
        core_project_config: scenario.coreProjectConfig as any,
        active_markets: scenario.activeMarkets as any,
        loa_adjustments: scenario.loaAdjustments as any,
        is_baseline: scenario.isBaseline,
        created_by: scenario.createdBy
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create scenario: ${error.message}`);
    }

    return this.transformScenarioFromDatabase(data);
  }

  /**
   * Get all scenarios for a product
   */
  static async getScenarios(productId: string): Promise<RNPVScenario[]> {
    const { data, error } = await supabase
      .from('rnpv_scenarios')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch scenarios: ${error.message}`);
    }

    return data.map(this.transformScenarioFromDatabase);
  }

  /**
   * Get a specific scenario by ID
   */
  static async getScenario(scenarioId: string): Promise<RNPVScenario | null> {
    const { data, error } = await supabase
      .from('rnpv_scenarios')
      .select('*')
      .eq('id', scenarioId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch scenario: ${error.message}`);
    }

    return this.transformScenarioFromDatabase(data);
  }

  /**
   * Update a scenario
   */
  static async updateScenario(
    scenarioId: string,
    updates: Partial<RNPVScenario>
  ): Promise<RNPVScenario> {
    const updateData: any = {};

    if (updates.scenarioName) updateData.scenario_name = updates.scenarioName;
    if (updates.scenarioDescription) updateData.scenario_description = updates.scenarioDescription;
    if (updates.coreProjectConfig) updateData.core_project_config = updates.coreProjectConfig as any;
    if (updates.activeMarkets) updateData.active_markets = updates.activeMarkets as any;
    if (updates.loaAdjustments) updateData.loa_adjustments = updates.loaAdjustments as any;
    if (updates.isBaseline !== undefined) updateData.is_baseline = updates.isBaseline;

    const { data, error } = await supabase
      .from('rnpv_scenarios')
      .update(updateData)
      .eq('id', scenarioId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update scenario: ${error.message}`);
    }

    return this.transformScenarioFromDatabase(data);
  }

  /**
   * Delete a scenario
   */
  static async deleteScenario(scenarioId: string): Promise<void> {
    // First delete related calculations
    await this.deleteScenarioCalculations(scenarioId);

    const { error } = await supabase
      .from('rnpv_scenarios')
      .delete()
      .eq('id', scenarioId);

    if (error) {
      throw new Error(`Failed to delete scenario: ${error.message}`);
    }
  }

  /**
   * Get the baseline scenario for a product
   */
  static async getBaselineScenario(productId: string): Promise<RNPVScenario | null> {
    const { data, error } = await supabase
      .from('rnpv_scenarios')
      .select('*')
      .eq('product_id', productId)
      .eq('is_baseline', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch baseline scenario: ${error.message}`);
    }

    return this.transformScenarioFromDatabase(data);
  }

  /**
   * Set a scenario as baseline (and unset others)
   */
  static async setAsBaseline(scenarioId: string, productId: string): Promise<void> {
    // First, unset all other baselines for this product
    await supabase
      .from('rnpv_scenarios')
      .update({ is_baseline: false })
      .eq('product_id', productId);

    // Then set this scenario as baseline
    const { error } = await supabase
      .from('rnpv_scenarios')
      .update({ is_baseline: true })
      .eq('id', scenarioId);

    if (error) {
      throw new Error(`Failed to set baseline scenario: ${error.message}`);
    }
  }

  /**
   * Save calculation results for a scenario
   */
  static async saveCalculationResults(
    results: RNPVCalculationResult[]
  ): Promise<void> {
    const insertData = results.map(result => ({
      scenario_id: result.scenarioId,
      rnpv_product_id: result.productId,
      company_id: result.companyId,
      calculation_type: result.calculationType,
      market_code: result.marketCode,
      expected_cost_pv: result.expectedCostPV,
      expected_revenue_pv: result.expectedRevenuePV,
      rnpv_value: result.rnpvValue,
      cumulative_technical_loa: result.cumulativeTechnicalLoA,
      cumulative_commercial_loa: result.cumulativeCommercialLoA,
      phase_calculations: result.phaseCalculations as any,
      calculation_metadata: result.calculationMetadata as any,
      calculation_version: result.calculationVersion
    }));

    const { error } = await supabase
      .from('rnpv_calculations')
      .insert(insertData);

    if (error) {
      throw new Error(`Failed to save calculation results: ${error.message}`);
    }
  }

  /**
   * Get calculation results for a scenario
   */
  static async getCalculationResults(scenarioId: string): Promise<RNPVCalculationResult[]> {
    const { data, error } = await supabase
      .from('rnpv_calculations')
      .select('*')
      .eq('scenario_id', scenarioId)
      .order('calculated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch calculation results: ${error.message}`);
    }

    return data.map(this.transformCalculationFromDatabase);
  }

  /**
   * Delete calculation results for a scenario
   */
  static async deleteScenarioCalculations(scenarioId: string): Promise<void> {
    const { error } = await supabase
      .from('rnpv_calculations')
      .delete()
      .eq('scenario_id', scenarioId);

    if (error) {
      throw new Error(`Failed to delete calculation results: ${error.message}`);
    }
  }

  /**
   * Clone a scenario with a new name
   */
  static async cloneScenario(
    scenarioId: string,
    newName: string,
    newDescription?: string
  ): Promise<RNPVScenario> {
    const originalScenario = await this.getScenario(scenarioId);
    if (!originalScenario) {
      throw new Error('Original scenario not found');
    }

    const clonedScenario = {
      ...originalScenario,
      scenarioName: newName,
      scenarioDescription: newDescription || `Cloned from ${originalScenario.scenarioName}`,
      isBaseline: false, // Cloned scenarios are never baseline by default
      createdBy: originalScenario.createdBy // This should be updated to current user
    };

    delete (clonedScenario as any).id;
    delete (clonedScenario as any).createdAt;
    delete (clonedScenario as any).updatedAt;

    return this.createScenario(clonedScenario);
  }

  /**
   * Get latest calculation result summary for multiple scenarios
   */
  static async getScenarioSummaries(productId: string): Promise<Array<{
    scenario: RNPVScenario;
    latestCalculation?: RNPVCalculationResult;
  }>> {
    const scenarios = await this.getScenarios(productId);
    const summaries = [];

    for (const scenario of scenarios) {
      const calculations = await this.getCalculationResults(scenario.id);
      const portfolioCalculation = calculations.find(c => c.calculationType === 'total_portfolio');
      
      summaries.push({
        scenario,
        latestCalculation: portfolioCalculation
      });
    }

    return summaries;
  }

  /**
   * Transform database record to RNPVScenario interface
   */
  private static transformScenarioFromDatabase(data: any): RNPVScenario {
    return {
      id: data.id,
      productId: data.product_id,
      companyId: data.company_id,
      scenarioName: data.scenario_name,
      scenarioDescription: data.scenario_description,
      coreProjectConfig: data.core_project_config || {},
      activeMarkets: data.active_markets || [],
      loaAdjustments: data.loa_adjustments || {},
      isBaseline: data.is_baseline,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      createdBy: data.created_by
    };
  }

  /**
   * Transform database record to RNPVCalculationResult interface
   */
  private static transformCalculationFromDatabase(data: any): RNPVCalculationResult {
    return {
      id: data.id,
      scenarioId: data.scenario_id,
      productId: data.rnpv_product_id,
      companyId: data.company_id,
      calculationType: data.calculation_type,
      marketCode: data.market_code,
      expectedCostPV: parseFloat(data.expected_cost_pv),
      expectedRevenuePV: parseFloat(data.expected_revenue_pv),
      rnpvValue: parseFloat(data.rnpv_value),
      cumulativeTechnicalLoA: parseFloat(data.cumulative_technical_loa),
      cumulativeCommercialLoA: parseFloat(data.cumulative_commercial_loa),
      phaseCalculations: data.phase_calculations || [],
      calculationMetadata: data.calculation_metadata || {},
      calculatedAt: new Date(data.calculated_at),
      calculationVersion: data.calculation_version
    };
  }
}