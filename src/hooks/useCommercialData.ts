import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CommercialDataItem {
  id: string;
  product_id: string;
  revenue_amount: number;
  cogs_amount: number;
  profit_margin_percentage: number;
  units_sold: number;
  period_start: string;
  period_end: string;
  currency_code: string;
}

interface ForecastData {
  id: string;
  company_id: string;
  forecast_month: string;
  scenario_type: 'worst_case' | 'likely_case' | 'best_case';
  total_revenue: number;
}

export function useCommercialData(companyId: string, selectedMonth?: Date) {
  return useQuery({
    queryKey: ['commercial-data', companyId, selectedMonth],
    queryFn: async () => {
      if (!companyId) throw new Error('Company ID is required');

      let query = supabase
        .from('product_revenues')
        .select(`
          *,
          products!inner (
            name,
            device_category,
            product_platform,
            company_id
          )
        `)
        .eq('products.company_id', companyId);

      if (selectedMonth) {
        const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
        const monthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
        
        query = query
          .gte('period_start', monthStart.toISOString())
          .lte('period_end', monthEnd.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching commercial data:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!companyId,
  });
}

export function useForecasts(companyId: string) {
  return useQuery({
    queryKey: ['forecasts', companyId],
    queryFn: async () => {
      if (!companyId) throw new Error('Company ID is required');

      const { data, error } = await supabase
        .from('commercial_forecasts')
        .select('*')
        .eq('company_id', companyId)
        .order('forecast_month');

      if (error) {
        console.error('Error fetching forecasts:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!companyId,
  });
}

export function useForecastFactors(companyId: string) {
  return useQuery({
    queryKey: ['forecast-factors', companyId],
    queryFn: async () => {
      if (!companyId) throw new Error('Company ID is required');

      const { data, error } = await supabase
        .from('forecast_factors')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('impact_weight', { ascending: false });

      if (error) {
        console.error('Error fetching forecast factors:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!companyId,
  });
}

export function useUpdateCommercialData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      revenue_amount, 
      cogs_amount, 
      units_sold 
    }: { 
      id: string; 
      revenue_amount: number; 
      cogs_amount: number; 
      units_sold: number; 
    }) => {
      const profit_margin_percentage = revenue_amount > 0 
        ? ((revenue_amount - cogs_amount) / revenue_amount) * 100 
        : 0;

      const { data, error } = await supabase
        .from('product_revenues')
        .update({
          revenue_amount,
          cogs_amount,
          profit_margin_percentage,
          units_sold,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select();

      if (error) {
        console.error('Error updating commercial data:', error);
        throw error;
      }

      return data[0];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['commercial-data'] });
    },
  });
}

export function useCreateCommercialData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      product_id,
      variant_id,
      revenue_amount, 
      cogs_amount, 
      units_sold,
      period_start,
      period_end,
      currency_code = 'EUR',
      units_forecast,
      volume_seasonality_factor = 1.0,
      market_penetration_percentage,
      market_code,
    }: { 
      product_id: string;
      variant_id?: string | null;
      revenue_amount: number; 
      cogs_amount: number; 
      units_sold: number; 
      period_start: string;
      period_end: string;
      currency_code?: string;
      units_forecast?: number;
      volume_seasonality_factor?: number;
      market_penetration_percentage?: number;
      market_code?: string;
    }) => {
      const profit_margin_percentage = revenue_amount > 0 
        ? ((revenue_amount - cogs_amount) / revenue_amount) * 100 
        : 0;

      const { data, error } = await supabase
        .from('product_revenues')
        .insert({
          product_id,
          variant_id: variant_id || null,
          revenue_amount,
          cogs_amount,
          profit_margin_percentage,
          units_sold,
          period_start,
          period_end,
          currency_code,
          units_forecast,
          volume_seasonality_factor,
          market_penetration_percentage,
          market_code: market_code || 'EU', // Use provided market or default
        })
        .select();

      if (error) {
        console.error('Error creating commercial data:', error);
        throw error;
      }

      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commercial-data'] });
    },
  });
}

export function useUpdateForecast() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      companyId,
      forecastMonth,
      scenarioType,
      totalRevenue,
    }: {
      companyId: string;
      forecastMonth: string;
      scenarioType: 'worst_case' | 'likely_case' | 'best_case';
      totalRevenue: number;
    }) => {
      const { data, error } = await supabase
        .from('commercial_forecasts')
        .upsert({
          company_id: companyId,
          forecast_month: forecastMonth,
          scenario_type: scenarioType,
          total_revenue: totalRevenue,
        })
        .select();

      if (error) {
        console.error('Error updating forecast:', error);
        throw error;
      }

      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forecasts'] });
    },
  });
}