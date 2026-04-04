import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SmartRevenueEngine, SmartRevenueCalculation, ProductForecastData } from "@/services/smartRevenueEngine";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function useSmartRevenueCalculations(
  companyId: string,
  startMonth: Date,
  endMonth: Date
) {
  return useQuery({
    queryKey: ['smart-revenue-calculations', companyId, startMonth.toISOString(), endMonth.toISOString()],
    queryFn: () => SmartRevenueEngine.getCachedCalculations(companyId, startMonth, endMonth),
    enabled: !!companyId,
  });
}

export function useCalculateSmartRevenue() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      companyId,
      mainProductForecasts,
      calculationMonths,
    }: {
      companyId: string;
      mainProductForecasts: ProductForecastData[];
      calculationMonths: Date[];
    }) => {
      return SmartRevenueEngine.calculateSmartRevenue(
        companyId,
        mainProductForecasts,
        calculationMonths
      );
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Smart Revenue Calculated",
        description: `Processed ${data.length} revenue calculations successfully`,
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: ['smart-revenue-calculations', variables.companyId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['commercial-forecasts', variables.companyId] 
      });
    },
    onError: (error) => {
      console.error('Failed to calculate smart revenue:', error);
      toast({
        title: "Calculation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateMultipliers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      relationshipId,
      newInitialMultiplier,
      newRecurringMultiplier,
      changeReason,
    }: {
      relationshipId: string;
      newInitialMultiplier: number;
      newRecurringMultiplier: number;
      changeReason?: string;
    }) => {
      return SmartRevenueEngine.updateMultipliers(
        relationshipId,
        newInitialMultiplier,
        newRecurringMultiplier,
        changeReason
      );
    },
    onSuccess: () => {
      toast({
        title: "Multipliers Updated",
        description: "Revenue multipliers updated successfully. Calculations will be refreshed.",
      });
      
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['product-accessory-relationships'] });
      queryClient.invalidateQueries({ queryKey: ['smart-revenue-calculations'] });
      queryClient.invalidateQueries({ queryKey: ['commercial-forecasts'] });
    },
    onError: (error) => {
      console.error('Failed to update multipliers:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    },
  });
}

export function useProductRelationshipsSmart(companyId: string) {
  return useQuery({
    queryKey: ['product-relationships-smart', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_accessory_relationships')
        .select(`
          *,
          main_product:products!main_product_id(id, name, model_reference, device_category),
          accessory_product:products!accessory_product_id(id, name, model_reference, device_category)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });
}

export function useSmartRevenueInsights(companyId: string, productId?: string) {
  return useQuery({
    queryKey: ['smart-revenue-insights', companyId, productId],
    queryFn: async () => {
      // Get smart revenue calculations and generate insights
      const now = new Date();
      const startMonth = new Date(now.getFullYear(), now.getMonth() - 12, 1);
      const endMonth = new Date(now.getFullYear(), now.getMonth() + 12, 1);

      const calculations = await SmartRevenueEngine.getCachedCalculations(
        companyId,
        startMonth,
        endMonth
      );

      // Filter by product if specified
      const filteredCalculations = productId
        ? calculations.filter(calc => 
            calc.mainProductId === productId || calc.accessoryProductId === productId
          )
        : calculations;

      // Generate insights
      const totalAttributedRevenue = filteredCalculations.reduce(
        (sum, calc) => sum + calc.totalAttributedRevenue,
        0
      );

      const topMainProducts = filteredCalculations.reduce((acc, calc) => {
        const key = calc.mainProductId;
        acc[key] = (acc[key] || 0) + calc.totalAttributedRevenue;
        return acc;
      }, {} as Record<string, number>);

      const topAccessoryProducts = filteredCalculations.reduce((acc, calc) => {
        const key = calc.accessoryProductId;
        acc[key] = (acc[key] || 0) + calc.totalAttributedRevenue;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalAttributedRevenue,
        calculationsCount: filteredCalculations.length,
        topMainProducts: Object.entries(topMainProducts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5),
        topAccessoryProducts: Object.entries(topAccessoryProducts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5),
        monthlyTrends: filteredCalculations.reduce((acc, calc) => {
          const monthKey = calc.calculationMonth.toISOString().substring(0, 7);
          acc[monthKey] = (acc[monthKey] || 0) + calc.totalAttributedRevenue;
          return acc;
        }, {} as Record<string, number>),
      };
    },
    enabled: !!companyId,
  });
}