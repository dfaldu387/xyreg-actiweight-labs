import { supabase } from "@/integrations/supabase/client";
import { NPVCalculationResult } from "./npvCalculationService";

export interface VarianceAnalysisData {
  productId: string;
  marketCode: string;
  month: string;
  npvPrediction: number;
  forecastValue: number;
  actualValue: number;
  varianceNPVToActual: number;
  varianceForecastToActual: number;
  varianceNPVToForecast: number;
  variancePercentageNPVToActual: number;
  variancePercentageForecastToActual: number;
  variancePercentageNPVToForecast: number;
  confidenceLevel: number;
}

export interface VarianceMetrics {
  totalVarianceNPV: number;
  totalVarianceForecast: number;
  averageAccuracyNPV: number;
  averageAccuracyForecast: number;
  trendDirection: 'improving' | 'declining' | 'stable';
  riskLevel: 'low' | 'medium' | 'high';
}

export interface VarianceSummary {
  companyId: string;
  month: string;
  metrics: VarianceMetrics;
  productVariances: VarianceAnalysisData[];
  alerts: VarianceAlert[];
}

export interface VarianceAlert {
  type: 'high_variance' | 'consistent_overestimate' | 'consistent_underestimate' | 'accuracy_decline';
  productId: string;
  marketCode: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  threshold: number;
  actualValue: number;
}

export class VarianceAnalysisService {
  /**
   * Calculate variance analysis between NPV predictions, forecasts, and actual results
   */
  async calculateVarianceAnalysis(
    companyId: string,
    targetMonth: string
  ): Promise<VarianceSummary | null> {
    try {
      

      // Fetch NPV data for all products
      const { data: npvData, error: npvError } = await supabase
        .from('product_npv_analyses')
        .select(`
          product_id,
          market_calculations,
          products!inner(company_id, name)
        `)
        .eq('products.company_id', companyId);

      if (npvError) throw npvError;

      // Fetch forecast data for the target month
      const { data: forecastData, error: forecastError } = await supabase
        .from('commercial_forecasts')
        .select('*')
        .eq('company_id', companyId)
        .eq('forecast_month', targetMonth);

      if (forecastError) throw forecastError;

      // Fetch actual commercial data for the target month
      const { data: actualData, error: actualError } = await supabase
        .from('product_revenues')
        .select(`
          *,
          products!inner(company_id, name)
        `)
        .eq('products.company_id', companyId)
        .gte('period_start', `${targetMonth}-01`)
        .lt('period_start', this.getNextMonth(targetMonth));

      if (actualError) throw actualError;

      // Process variance calculations
      const productVariances = this.processVarianceCalculations(
        npvData || [],
        forecastData || [],
        actualData || [],
        targetMonth
      );

      // Calculate summary metrics
      const metrics = this.calculateSummaryMetrics(productVariances);

      // Generate alerts
      const alerts = this.generateVarianceAlerts(productVariances);

      return {
        companyId,
        month: targetMonth,
        metrics,
        productVariances,
        alerts
      };

    } catch (error) {
      console.error('Error calculating variance analysis:', error);
      return null;
    }
  }

  /**
   * Process variance calculations for all products
   */
  private processVarianceCalculations(
    npvData: any[],
    forecastData: any[],
    actualData: any[],
    targetMonth: string
  ): VarianceAnalysisData[] {
    const variances: VarianceAnalysisData[] = [];

    // Group actual data by product
    const actualByProduct = actualData.reduce((acc, item) => {
      const key = item.product_id;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    // Group forecast data by scenario type
    const forecastsByScenario = forecastData.reduce((acc, item) => {
      if (!acc[item.scenario_type]) acc[item.scenario_type] = [];
      acc[item.scenario_type].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    // Process each product with NPV data
    npvData.forEach(npvItem => {
      const productId = npvItem.product_id;
      const marketCalculations = npvItem.market_calculations as Record<string, NPVCalculationResult>;

      // Process each market in the NPV analysis
      Object.entries(marketCalculations || {}).forEach(([marketCode, npvResult]) => {
        const actualRevenue = this.getActualRevenueForMonth(
          actualByProduct[productId] || [],
          targetMonth
        );

        const forecastValue = this.getForecastValueForMonth(
          forecastsByScenario['likely_case'] || [],
          targetMonth
        );

        // Extract NPV prediction for the specific month (simplified)
        const npvPrediction = this.extractNPVPredictionForMonth(npvResult, targetMonth);

        if (actualRevenue > 0 || forecastValue > 0 || npvPrediction > 0) {
          const variance = this.calculateVarianceMetricsForProduct(
            npvPrediction,
            forecastValue,
            actualRevenue
          );

          variances.push({
            productId,
            marketCode,
            month: targetMonth,
            npvPrediction,
            forecastValue,
            actualValue: actualRevenue,
            ...variance,
            confidenceLevel: this.calculateConfidenceLevel(variance.variancePercentageNPVToActual)
          });
        }
      });
    });

    return variances;
  }

  /**
   * Calculate variance metrics for a single product
   */
  private calculateVarianceMetricsForProduct(
    npvPrediction: number,
    forecastValue: number,
    actualValue: number
  ) {
    const varianceNPVToActual = npvPrediction - actualValue;
    const varianceForecastToActual = forecastValue - actualValue;
    const varianceNPVToForecast = npvPrediction - forecastValue;

    const variancePercentageNPVToActual = actualValue > 0 ? 
      (varianceNPVToActual / actualValue) * 100 : 0;
    const variancePercentageForecastToActual = actualValue > 0 ? 
      (varianceForecastToActual / actualValue) * 100 : 0;
    const variancePercentageNPVToForecast = forecastValue > 0 ? 
      (varianceNPVToForecast / forecastValue) * 100 : 0;

    return {
      varianceNPVToActual,
      varianceForecastToActual,
      varianceNPVToForecast,
      variancePercentageNPVToActual,
      variancePercentageForecastToActual,
      variancePercentageNPVToForecast
    };
  }

  /**
   * Calculate summary metrics across all products
   */
  private calculateSummaryMetrics(variances: VarianceAnalysisData[]): VarianceMetrics {
    if (variances.length === 0) {
      return {
        totalVarianceNPV: 0,
        totalVarianceForecast: 0,
        averageAccuracyNPV: 0,
        averageAccuracyForecast: 0,
        trendDirection: 'stable',
        riskLevel: 'low'
      };
    }

    const totalVarianceNPV = variances.reduce((sum, v) => sum + Math.abs(v.varianceNPVToActual), 0);
    const totalVarianceForecast = variances.reduce((sum, v) => sum + Math.abs(v.varianceForecastToActual), 0);

    const avgAccuracyNPV = variances.reduce((sum, v) => 
      sum + (100 - Math.abs(v.variancePercentageNPVToActual)), 0) / variances.length;
    const avgAccuracyForecast = variances.reduce((sum, v) => 
      sum + (100 - Math.abs(v.variancePercentageForecastToActual)), 0) / variances.length;

    // Determine trend direction (simplified logic)
    const averageVariance = variances.reduce((sum, v) => 
      sum + Math.abs(v.variancePercentageNPVToActual), 0) / variances.length;

    const trendDirection: 'improving' | 'declining' | 'stable' = 
      averageVariance < 10 ? 'improving' : averageVariance > 25 ? 'declining' : 'stable';

    const riskLevel: 'low' | 'medium' | 'high' = 
      averageVariance < 15 ? 'low' : averageVariance > 30 ? 'high' : 'medium';

    return {
      totalVarianceNPV,
      totalVarianceForecast,
      averageAccuracyNPV: avgAccuracyNPV,
      averageAccuracyForecast: avgAccuracyForecast,
      trendDirection,
      riskLevel
    };
  }

  /**
   * Generate alerts based on variance patterns
   */
  private generateVarianceAlerts(variances: VarianceAnalysisData[]): VarianceAlert[] {
    const alerts: VarianceAlert[] = [];

    variances.forEach(variance => {
      // High variance alert
      if (Math.abs(variance.variancePercentageNPVToActual) > 30) {
        alerts.push({
          type: 'high_variance',
          productId: variance.productId,
          marketCode: variance.marketCode,
          message: `High variance detected: ${Math.abs(variance.variancePercentageNPVToActual).toFixed(1)}% difference between NPV prediction and actual results`,
          severity: Math.abs(variance.variancePercentageNPVToActual) > 50 ? 'high' : 'medium',
          threshold: 30,
          actualValue: variance.actualValue
        });
      }

      // Consistent overestimate
      if (variance.varianceNPVToActual > 0 && variance.variancePercentageNPVToActual > 20) {
        alerts.push({
          type: 'consistent_overestimate',
          productId: variance.productId,
          marketCode: variance.marketCode,
          message: `NPV model consistently overestimates by ${variance.variancePercentageNPVToActual.toFixed(1)}%`,
          severity: 'medium',
          threshold: 20,
          actualValue: variance.actualValue
        });
      }

      // Consistent underestimate
      if (variance.varianceNPVToActual < 0 && Math.abs(variance.variancePercentageNPVToActual) > 20) {
        alerts.push({
          type: 'consistent_underestimate',
          productId: variance.productId,
          marketCode: variance.marketCode,
          message: `NPV model consistently underestimates by ${Math.abs(variance.variancePercentageNPVToActual).toFixed(1)}%`,
          severity: 'medium',
          threshold: 20,
          actualValue: variance.actualValue
        });
      }
    });

    return alerts;
  }

  // Helper methods
  private getNextMonth(month: string): string {
    const date = new Date(month + '-01');
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().substring(0, 7);
  }

  private getActualRevenueForMonth(actualData: any[], month: string): number {
    const monthData = actualData.find(item => 
      item.period_start?.startsWith(month)
    );
    return monthData?.revenue_amount || 0;
  }

  private getForecastValueForMonth(forecastData: any[], month: string): number {
    const monthForecast = forecastData.find(item => 
      item.forecast_month === month
    );
    return monthForecast?.total_revenue || 0;
  }

  private extractNPVPredictionForMonth(npvResult: NPVCalculationResult, month: string): number {
    // Simplified extraction - in practice, you'd need to map months to NPV revenue projections
    // This is a placeholder that uses total revenue divided by forecast months
    return npvResult.totalRevenue / 60; // Assuming 60-month forecast
  }

  private calculateConfidenceLevel(variancePercentage: number): number {
    // Calculate confidence based on accuracy
    const accuracy = Math.max(0, 100 - Math.abs(variancePercentage));
    return Math.min(100, Math.max(0, accuracy));
  }

  /**
   * Save variance analysis results to database (placeholder implementation)
   */
  async saveVarianceAnalysis(varianceSummary: VarianceSummary): Promise<boolean> {
    try {
      // Placeholder: In a real implementation, you would create a variance_analyses table
      return true;
    } catch (error) {
      console.error('Error saving variance analysis:', error);
      return false;
    }
  }

  /**
   * Load historical variance analysis data (placeholder implementation)
   */
  async loadVarianceHistory(companyId: string, months: number = 12): Promise<VarianceSummary[]> {
    try {
      // Placeholder: Generate mock historical data for demonstration
      const history: VarianceSummary[] = [];
      
      for (let i = 1; i <= months; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStr = date.toISOString().substring(0, 7);
        
        // Generate mock variance summary for each month
        history.push({
          companyId,
          month: monthStr,
          metrics: {
            totalVarianceNPV: Math.random() * 100000,
            totalVarianceForecast: Math.random() * 80000,
            averageAccuracyNPV: 70 + Math.random() * 25, // 70-95%
            averageAccuracyForecast: 75 + Math.random() * 20, // 75-95%
            trendDirection: ['improving', 'declining', 'stable'][Math.floor(Math.random() * 3)] as any,
            riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any
          },
          productVariances: [],
          alerts: []
        });
      }
      
      return history;
    } catch (error) {
      console.error('Error loading variance history:', error);
      return [];
    }
  }
}

export const varianceAnalysisService = new VarianceAnalysisService();