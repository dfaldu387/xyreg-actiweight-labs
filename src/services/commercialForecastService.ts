import { supabase } from "@/integrations/supabase/client";

interface AIForecastRequest {
  companyId: string;
  historicalData: any[];
  marketFactors: any[];
  forecastMonths: number;
}

interface AIForecastResponse {
  success: boolean;
  forecasts?: {
    month: string;
    worstCase: number;
    likelyCase: number;
    bestCase: number;
    confidence: number;
  }[];
  factors?: {
    name: string;
    description: string;
    impact: number;
    source: string;
  }[];
  error?: string;
}

export class CommercialForecastService {
  static async generateAIForecast(request: AIForecastRequest): Promise<AIForecastResponse> {
    try {
      console.log('[CommercialForecastService] Generating AI forecast for company:', request.companyId);

      // For now, generate mock forecasts based on historical trends
      // In production, this would call an AI service or edge function
      const forecasts = this.generateMockForecasts(request);
      const factors = this.generateMockFactors(request);

      // Save forecasts to database
      await this.saveForecasts(request.companyId, forecasts);
      await this.saveFactors(request.companyId, factors);

      return {
        success: true,
        forecasts,
        factors,
      };
    } catch (error) {
      console.error('[CommercialForecastService] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private static generateMockForecasts(request: AIForecastRequest) {
    const { historicalData, forecastMonths } = request;
    const baseRevenue = historicalData.length > 0 
      ? historicalData[historicalData.length - 1]?.revenue || 500000 
      : 500000;

    const forecasts = [];
    const currentDate = new Date();

    for (let i = 0; i < forecastMonths; i++) {
      const forecastDate = new Date(currentDate);
      forecastDate.setMonth(forecastDate.getMonth() + i + 1);
      
      // Simulate growth trend with some variability
      const growthFactor = 1 + (Math.random() * 0.2 - 0.1); // -10% to +10%
      const seasonalFactor = 1 + Math.sin((forecastDate.getMonth() / 12) * 2 * Math.PI) * 0.1; // Seasonal variation
      
      const baseAmount = baseRevenue * growthFactor * seasonalFactor;
      
      forecasts.push({
        month: forecastDate.toISOString().substring(0, 7), // YYYY-MM format
        worstCase: Math.round(baseAmount * 0.8),
        likelyCase: Math.round(baseAmount),
        bestCase: Math.round(baseAmount * 1.2),
        confidence: Math.random() * 20 + 80, // 80-100%
      });
    }

    return forecasts;
  }

  private static generateMockFactors(request: AIForecastRequest) {
    return [
      {
        name: 'Historical Performance',
        description: 'Analysis of past 12 months revenue trends',
        impact: 85,
        source: 'Historical Data Analysis',
      },
      {
        name: 'Market Growth',
        description: 'Industry growth rate and market expansion',
        impact: 70,
        source: 'Market Intelligence',
      },
      {
        name: 'Seasonality',
        description: 'Seasonal buying patterns and budget cycles',
        impact: 60,
        source: 'Seasonal Pattern Analysis',
      },
      {
        name: 'Competitive Landscape',
        description: 'Competitive positioning and market share',
        impact: 55,
        source: 'Competitive Intelligence',
      },
      {
        name: 'Product Pipeline',
        description: 'Upcoming device launches and innovations',
        impact: 75,
        source: 'Product Roadmap Analysis',
      },
    ];
  }

  private static async saveForecasts(companyId: string, forecasts: any[]) {
    const forecastData = forecasts.flatMap(forecast => [
      {
        company_id: companyId,
        forecast_month: forecast.month,
        scenario_type: 'worst_case' as const,
        total_revenue: forecast.worstCase,
      },
      {
        company_id: companyId,
        forecast_month: forecast.month,
        scenario_type: 'likely_case' as const,
        total_revenue: forecast.likelyCase,
      },
      {
        company_id: companyId,
        forecast_month: forecast.month,
        scenario_type: 'best_case' as const,
        total_revenue: forecast.bestCase,
      },
    ]);

    const { error } = await supabase
      .from('commercial_forecasts')
      .upsert(forecastData);

    if (error) {
      throw new Error(`Failed to save forecasts: ${error.message}`);
    }
  }

  private static async saveFactors(companyId: string, factors: any[]) {
    const factorData = factors.map(factor => ({
      company_id: companyId,
      factor_name: factor.name,
      factor_description: factor.description,
      impact_weight: factor.impact,
      data_source: factor.source,
      is_active: true,
    }));

    // Clear existing factors
    await supabase
      .from('forecast_factors')
      .delete()
      .eq('company_id', companyId);

    // Insert new factors
    const { error } = await supabase
      .from('forecast_factors')
      .insert(factorData);

    if (error) {
      throw new Error(`Failed to save factors: ${error.message}`);
    }
  }

  static async uploadCSVData(companyId: string, csvFile: File): Promise<{ success: boolean; message: string; recordsProcessed?: number }> {
    try {
      const text = await csvFile.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      // Validate headers
      const requiredHeaders = ['Product ID', 'Product Name', 'Platform', 'Category', 'Month', 'Actual Revenue (€)', 'Actual COGS (€)', 'Units Sold'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
      }

      const records = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < headers.length) continue;

        const record: any = {};
        headers.forEach((header, index) => {
          record[header] = values[index];
        });

        // Convert to database format
        const revenue = parseFloat(record['Actual Revenue (€)']) || 0;
        const cogs = parseFloat(record['Actual COGS (€)']) || 0;
        const units = parseInt(record['Units Sold']) || 0;
        const profitMargin = revenue > 0 ? ((revenue - cogs) / revenue) * 100 : 0;

        records.push({
          product_id: record['Product ID'],
          revenue_amount: revenue,
          cogs_amount: cogs,
          profit_margin_percentage: profitMargin,
          units_sold: units,
          currency_code: 'EUR',
          period_start: record['Month'] + '-01',
          period_end: record['Month'] + '-31',
        });
      }

      // Insert records into database
      const { error } = await supabase
        .from('product_revenues')
        .upsert(records);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        message: `Successfully processed ${records.length} records`,
        recordsProcessed: records.length,
      };
    } catch (error) {
      console.error('[CommercialForecastService] CSV upload error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

export const commercialForecastService = new CommercialForecastService();