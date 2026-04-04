import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCommercialData } from "./useCommercialData";

export interface EnhancedCommercialDataItem {
  id: string;
  product_id: string;
  revenue_amount: number;
  cogs_amount: number;
  profit_margin_percentage: number;
  units_sold: number;
  period_start: string;
  period_end: string;
  currency_code: string;
  // Enhanced fields
  units_forecast?: number;
  volume_seasonality_factor?: number;
  attributed_from_product_id?: string;
  attribution_type?: 'direct' | 'accessory' | 'bundle' | 'cross_sell';
  market_penetration_percentage?: number;
}

export interface RevenueAttribution {
  id: string;
  company_id: string;
  source_revenue_id: string;
  target_product_id: string;
  attribution_percentage: number;
  attribution_amount: number;
  attribution_type: 'accessory' | 'bundle' | 'cross_sell' | 'upsell';
  period_start: string;
  period_end: string;
  created_at: string;
}

// Enhanced hook that includes attribution data
export function useEnhancedCommercialData(companyId: string, selectedMonth?: Date) {
  const baseCommercialData = useCommercialData(companyId, selectedMonth);
  
  const attributionsQuery = useQuery({
    queryKey: ['revenue-attributions', companyId, selectedMonth?.toISOString()],
    queryFn: async () => {
      if (!companyId) throw new Error('Company ID is required');

      // For now, we'll return empty array until the types are updated
      // This query will work once the Supabase types are regenerated
      try {
        let query = supabase
          .from('revenue_attributions' as any)
          .select(`
            *,
            source_revenue:product_revenues!source_revenue_id(id, product_id, revenue_amount),
            target_product:products!target_product_id(id, name)
          `)
          .eq('company_id', companyId);

        if (selectedMonth) {
          const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
          const monthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
          
          query = query
            .gte('period_start', monthStart.toISOString().split('T')[0])
            .lte('period_end', monthEnd.toISOString().split('T')[0]);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching revenue attributions:', error);
          return [];
        }

        return [] as RevenueAttribution[];
      } catch (error) {
        console.warn('Revenue attributions table not available yet:', error);
        return [];
      }
    },
    enabled: !!companyId,
  });

  return {
    commercialData: baseCommercialData.data,
    attributions: attributionsQuery.data || [],
    loading: baseCommercialData.isLoading || attributionsQuery.isLoading,
    error: baseCommercialData.error || attributionsQuery.error,
  };
}

// Hook to get aggregated revenue data with attributions for a product
export function useProductRevenueWithAttributions(companyId: string, productId: string, selectedMonth?: Date) {
  return useQuery({
    queryKey: ['product-revenue-attributions', companyId, productId, selectedMonth?.toISOString()],
    queryFn: async () => {
      if (!companyId || !productId) throw new Error('Company ID and Product ID are required');

      // Get base revenue data
      let revenueQuery = supabase
        .from('product_revenues')
        .select('*')
        .eq('product_id', productId);

      if (selectedMonth) {
        const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
        const monthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
        
        revenueQuery = revenueQuery
          .gte('period_start', monthStart.toISOString())
          .lte('period_end', monthEnd.toISOString());
      }

      const { data: revenueData, error: revenueError } = await revenueQuery;

      if (revenueError) {
        console.error('Error fetching product revenue:', revenueError);
        throw revenueError;
      }

      // For now, return basic data until attribution tables are fully set up
      const mainProductRevenue = revenueData?.reduce((sum, rev) => sum + rev.revenue_amount, 0) || 0;

      return {
        revenueData: revenueData || [],
        attributionsReceived: [],
        attributionsGiven: [],
        totalAttributedRevenue: 0,
        mainProductRevenue,
        totalRevenue: mainProductRevenue,
      };
    },
    enabled: !!companyId && !!productId,
  });
}

// Enhanced mutation for creating commercial data with attribution support
export function useCreateEnhancedCommercialData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      product_id,
      revenue_amount, 
      cogs_amount, 
      units_sold,
      period_start,
      period_end,
      currency_code = 'EUR',
      units_forecast,
      volume_seasonality_factor = 1.0,
      market_penetration_percentage,
    }: { 
      product_id: string;
      revenue_amount: number; 
      cogs_amount: number; 
      units_sold: number; 
      period_start: string;
      period_end: string;
      currency_code?: string;
      units_forecast?: number;
      volume_seasonality_factor?: number;
      market_penetration_percentage?: number;
    }) => {
      const profit_margin_percentage = revenue_amount > 0 
        ? ((revenue_amount - cogs_amount) / revenue_amount) * 100 
        : 0;

      const { data, error } = await supabase
        .from('product_revenues')
        .insert({
          product_id,
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
          attribution_type: 'direct',
          market_code: 'EU', // Default market code - could be made configurable
        })
        .select();

      if (error) {
        console.error('Error creating enhanced commercial data:', error);
        throw error;
      }

      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commercial-data'] });
      queryClient.invalidateQueries({ queryKey: ['revenue-attributions'] });
    },
  });
}