import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GTMChannel {
  id: string;
  name: string;
  enabled: boolean;
  details?: string;
}

export interface Territory {
  code: string;
  name: string;
  priority: number;
  rationale?: string;
  // Per-market sales process configuration
  buyerType?: string;
  procurementPath?: string;
  salesCycleWeeks?: number;
  budgetCycle?: string;
}

interface GTMStrategy {
  id: string;
  product_id: string;
  company_id: string;
  channels: GTMChannel[];
  territory_priority: Territory[];
  buyer_persona: string | null;
  budget_cycle: string | null;
  sales_cycle_weeks: number | null;
  customers_for_1m_arr: number | null;
  customers_for_5m_arr: number | null;
  notes: string | null;
}

export function useGTMStrategy(productId: string, companyId: string) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["gtm-strategy", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_gtm_strategy")
        .select("*")
        .eq("product_id", productId)
        .maybeSingle();
      if (error) throw error;
      
      if (data) {
        return {
          ...data,
          channels: (data.channels as GTMChannel[]) || [],
          territory_priority: (data.territory_priority as Territory[]) || [],
        } as GTMStrategy;
      }
      return null;
    },
    enabled: !!productId,
  });

  const mutation = useMutation({
    mutationFn: async (updates: Partial<GTMStrategy>) => {
      const payload = { ...updates, product_id: productId, company_id: companyId };

      // Use upsert to handle both insert and update in one operation
      // This avoids race conditions when rapid saves happen before query refetch
      const { error } = await supabase
        .from("product_gtm_strategy")
        .upsert(payload, { onConflict: 'product_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gtm-strategy", productId] });
      queryClient.invalidateQueries({ queryKey: ["funnel-gtm-strategy", productId] });
    },
  });

  return {
    data,
    isLoading,
    save: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}
