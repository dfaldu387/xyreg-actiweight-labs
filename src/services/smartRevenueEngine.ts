import { supabase } from "@/integrations/supabase/client";
import { AffectedProduct } from "@/types/affectedProducts";

export interface SmartRevenueCalculation {
  mainProductId: string;
  accessoryProductId: string;
  calculationMonth: Date;
  mainProductForecastUnits: number;
  initialAccessoryRevenue: number;
  recurringAccessoryRevenue: number;
  totalAttributedRevenue: number;
  metadata: {
    initialMultiplier: number;
    recurringMultiplier: number;
    lifecycleMonth: number;
    seasonalityFactor: number;
  };
}

export interface ProductForecastData {
  productId: string;
  monthlyForecast: {
    [monthKey: string]: number; // units forecast for each month
  };
  unitPrice: number;
}

export class SmartRevenueEngine {
  /**
   * Calculate revenue attribution for all products based on main product forecasts and multipliers
   */
  static async calculateSmartRevenue(
    companyId: string,
    mainProductForecasts: ProductForecastData[],
    calculationMonths: Date[]
  ): Promise<SmartRevenueCalculation[]> {
    try {
      // Get all product relationships with multipliers
      const { data: relationships, error } = await supabase
        .from('product_accessory_relationships')
        .select(`
          *,
          main_product:products!main_product_id(id, name, model_reference),
          accessory_product:products!accessory_product_id(id, name, model_reference)
        `)
        .eq('company_id', companyId);

      if (error) throw error;

      const calculations: SmartRevenueCalculation[] = [];

      // For each relationship, calculate revenue for each month
      for (const relationship of relationships || []) {
        const mainProductForecast = mainProductForecasts.find(
          f => f.productId === relationship.main_product_id
        );

        if (!mainProductForecast) continue;

        for (const month of calculationMonths) {
          const monthKey = month.toISOString().substring(0, 7); // YYYY-MM format
          const mainProductUnits = mainProductForecast.monthlyForecast[monthKey] || 0;

          if (mainProductUnits === 0) continue;

          const calculation = this.calculateMonthlyRevenue(
            relationship,
            mainProductUnits,
            month,
            mainProductForecast.unitPrice
          );

          calculations.push(calculation);
        }
      }

      // Save calculations to database for caching
      await this.saveCalculations(companyId, calculations);

      return calculations;
    } catch (error) {
      console.error('Error calculating smart revenue:', error);
      throw error;
    }
  }

  /**
   * Calculate revenue for a specific month and relationship
   */
  private static calculateMonthlyRevenue(
    relationship: any,
    mainProductUnits: number,
    calculationMonth: Date,
    accessoryUnitPrice: number
  ): SmartRevenueCalculation {
    const initialMultiplier = relationship.initial_multiplier || 1.0;
    const recurringMultiplier = relationship.recurring_multiplier || 0.0;
    const lifecycleDurationMonths = relationship.lifecycle_duration_months || 12;
    const seasonalityFactors = relationship.seasonality_factors || {};

    // Get seasonality factor for the current month (1.0 if not specified)
    const monthNumber = calculationMonth.getMonth() + 1;
    const seasonalityFactor = seasonalityFactors[monthNumber.toString()] || 1.0;

    // Calculate initial accessory revenue (sold with main product)
    const initialAccessoryUnits = mainProductUnits * initialMultiplier * seasonalityFactor;
    const initialAccessoryRevenue = initialAccessoryUnits * accessoryUnitPrice;

    // Calculate recurring accessory revenue based on installed base
    // This would need historical data to calculate properly - for now using simplified logic
    const recurringAccessoryUnits = mainProductUnits * recurringMultiplier * seasonalityFactor;
    const recurringAccessoryRevenue = recurringAccessoryUnits * accessoryUnitPrice;

    const totalAttributedRevenue = initialAccessoryRevenue + recurringAccessoryRevenue;

    return {
      mainProductId: relationship.main_product_id,
      accessoryProductId: relationship.accessory_product_id,
      calculationMonth,
      mainProductForecastUnits: mainProductUnits,
      initialAccessoryRevenue,
      recurringAccessoryRevenue,
      totalAttributedRevenue,
      metadata: {
        initialMultiplier,
        recurringMultiplier,
        lifecycleMonth: 1, // This would be calculated based on product launch date
        seasonalityFactor,
      },
    };
  }

  /**
   * Save calculations to database for caching and audit trail
   */
  private static async saveCalculations(
    companyId: string,
    calculations: SmartRevenueCalculation[]
  ): Promise<void> {
    try {
      const calculationRecords = calculations.map(calc => ({
        company_id: companyId,
        main_product_id: calc.mainProductId,
        accessory_product_id: calc.accessoryProductId,
        calculation_month: calc.calculationMonth.toISOString().substring(0, 10), // YYYY-MM-DD
        main_product_forecast_units: calc.mainProductForecastUnits,
        initial_accessory_revenue: calc.initialAccessoryRevenue,
        recurring_accessory_revenue: calc.recurringAccessoryRevenue,
        total_attributed_revenue: calc.totalAttributedRevenue,
        calculation_metadata: calc.metadata,
      }));

      // Delete existing calculations for these months to avoid duplicates
      const monthsToDelete = [...new Set(calculations.map(c => 
        c.calculationMonth.toISOString().substring(0, 10)
      ))];

      await supabase
        .from('smart_revenue_calculations')
        .delete()
        .eq('company_id', companyId)
        .in('calculation_month', monthsToDelete);

      // Insert new calculations
      if (calculationRecords.length > 0) {
        const { error } = await supabase
          .from('smart_revenue_calculations')
          .insert(calculationRecords);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving smart revenue calculations:', error);
      throw error;
    }
  }

  /**
   * Get cached calculations for a company and date range
   */
  static async getCachedCalculations(
    companyId: string,
    startMonth: Date,
    endMonth: Date
  ): Promise<SmartRevenueCalculation[]> {
    try {
      const { data, error } = await supabase
        .from('smart_revenue_calculations')
        .select('*')
        .eq('company_id', companyId)
        .gte('calculation_month', startMonth.toISOString().substring(0, 10))
        .lte('calculation_month', endMonth.toISOString().substring(0, 10))
        .order('calculation_month');

      if (error) throw error;

      return (data || []).map(record => ({
        mainProductId: record.main_product_id,
        accessoryProductId: record.accessory_product_id,
        calculationMonth: new Date(record.calculation_month),
        mainProductForecastUnits: record.main_product_forecast_units,
        initialAccessoryRevenue: Number(record.initial_accessory_revenue),
        recurringAccessoryRevenue: Number(record.recurring_accessory_revenue),
        totalAttributedRevenue: Number(record.total_attributed_revenue),
        metadata: record.calculation_metadata as any,
      }));
    } catch (error) {
      console.error('Error fetching cached calculations:', error);
      throw error;
    }
  }

  /**
   * Update multipliers and recalculate affected revenue
   */
  static async updateMultipliers(
    relationshipId: string,
    newInitialMultiplier: number,
    newRecurringMultiplier: number,
    changeReason?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('product_accessory_relationships')
        .update({
          initial_multiplier: newInitialMultiplier,
          recurring_multiplier: newRecurringMultiplier,
        })
        .eq('id', relationshipId);

      if (error) throw error;

      // The trigger will automatically log the change to multiplier_history
      return true;
    } catch (error) {
      console.error('Error updating multipliers:', error);
      throw error;
    }
  }

  /**
   * Convert legacy affected products to smart relationships
   */
  static convertAffectedProductsToRelationships(
    affectedProducts: AffectedProduct[]
  ): Array<{
    initialMultiplier: number;
    recurringMultiplier: number;
    lifecycleDurationMonths: number;
  }> {
    return affectedProducts.map(product => {
      // Convert legacy cannibalization to smart multipliers
      const monthsToRoof = product.monthsToReachRoof || 12;
      const totalCannibalization = product.totalCannibalizationPercentage || 0;

      // Calculate recurring multiplier based on progressive cannibalization
      const recurringMultiplier = totalCannibalization / 100; // Convert percentage to decimal

      return {
        initialMultiplier: 1.0, // Default initial multiplier
        recurringMultiplier,
        lifecycleDurationMonths: monthsToRoof,
      };
    });
  }

  /**
   * Generate "What-if" scenario calculations
   */
  static async generateScenario(
    companyId: string,
    scenarioName: string,
    multiplierChanges: Array<{
      relationshipId: string;
      newInitialMultiplier?: number;
      newRecurringMultiplier?: number;
    }>,
    forecastChanges: Array<{
      productId: string;
      monthlyChanges: { [monthKey: string]: number };
    }>
  ): Promise<{
    scenarioName: string;
    calculations: SmartRevenueCalculation[];
    impactSummary: {
      totalRevenueChange: number;
      affectedProducts: number;
      highestImpactProduct: string;
    };
  }> {
    // This would implement scenario planning logic
    // For now, return a placeholder structure
    return {
      scenarioName,
      calculations: [],
      impactSummary: {
        totalRevenueChange: 0,
        affectedProducts: 0,
        highestImpactProduct: '',
      },
    };
  }
}