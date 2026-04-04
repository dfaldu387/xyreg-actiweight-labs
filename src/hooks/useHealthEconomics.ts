import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MarketHeorData {
  heor_model_type: string | null;
  // Cost Savings
  cost_per_procedure_current: number | null;
  cost_per_procedure_new: number | null;
  cost_savings_per_procedure: number | null;
  procedure_volume_annual: number | null;
  cost_savings_annual: number | null;
  // QALY / ICER
  qaly_gain_estimate: number | null;
  icer_value: number | null;
  icer_currency: string | null;
  willingness_to_pay_threshold: number | null;
  // Budget Impact
  budget_impact_year1: number | null;
  budget_impact_year2: number | null;
  budget_impact_year3: number | null;
  budget_impact_notes: string | null;
  // ROI
  device_capital_cost: number | null;
  payback_period_months: number | null;
  roi_percent: number | null;
  // Evidence
  heor_assumptions: string | null;
}

export interface HeorByMarket {
  [market: string]: MarketHeorData;
}

export interface HealthEconomicsData {
  id?: string;
  // Legacy flat fields (kept for backward compatibility)
  heor_model_type: string | null;
  cost_per_procedure_current: number | null;
  cost_per_procedure_new: number | null;
  cost_savings_per_procedure: number | null;
  procedure_volume_annual: number | null;
  cost_savings_annual: number | null;
  qaly_gain_estimate: number | null;
  icer_value: number | null;
  icer_currency: string | null;
  willingness_to_pay_threshold: number | null;
  budget_impact_year1: number | null;
  budget_impact_year2: number | null;
  budget_impact_year3: number | null;
  budget_impact_notes: string | null;
  device_capital_cost: number | null;
  payback_period_months: number | null;
  roi_percent: number | null;
  heor_evidence_sources: any[] | null;
  heor_assumptions: string | null;
  heor_completed: boolean | null;
  // New per-market structure
  heor_by_market: HeorByMarket | null;
}

export function useHealthEconomics(productId: string, companyId: string) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["health-economics", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reimbursement_strategy")
        .select(`
          id,
          heor_model_type,
          cost_per_procedure_current,
          cost_per_procedure_new,
          cost_savings_per_procedure,
          procedure_volume_annual,
          cost_savings_annual,
          qaly_gain_estimate,
          icer_value,
          icer_currency,
          willingness_to_pay_threshold,
          budget_impact_year1,
          budget_impact_year2,
          budget_impact_year3,
          budget_impact_notes,
          device_capital_cost,
          payback_period_months,
          roi_percent,
          heor_evidence_sources,
          heor_assumptions,
          heor_completed,
          heor_by_market
        `)
        .eq("product_id", productId)
        .maybeSingle();
      if (error) throw error;
      return data as HealthEconomicsData | null;
    },
    enabled: !!productId,
  });

  const mutation = useMutation({
    mutationFn: async (values: Partial<HealthEconomicsData>) => {
      // Cast heor_by_market to Json type for Supabase compatibility
      const { heor_by_market, ...restValues } = values;
      const payload: Record<string, unknown> = { 
        ...restValues, 
        product_id: productId, 
        company_id: companyId,
        updated_at: new Date().toISOString()
      };
      
      // Add heor_by_market if provided (cast to unknown for Supabase Json type)
      if (heor_by_market !== undefined) {
        payload.heor_by_market = heor_by_market as unknown;
      }
      
      if (data?.id) {
        const { error } = await supabase
          .from("product_reimbursement_strategy")
          .update(payload as any)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("product_reimbursement_strategy")
          .insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-economics", productId] });
      queryClient.invalidateQueries({ queryKey: ["reimbursement-strategy", productId] });
      queryClient.invalidateQueries({ queryKey: ["funnel-reimbursement", productId] });
      queryClient.invalidateQueries({ queryKey: ["funnel-product", productId] });
      // toast.success("Health economics data saved");
    },
    onError: (error) => {
      console.error("Failed to save health economics:", error);
      toast.error("Failed to save health economics data");
    },
  });

  return { 
    data, 
    isLoading, 
    save: mutation.mutateAsync, 
    isSaving: mutation.isPending 
  };
}
