import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";
import { toast } from "sonner";
import type { EndgameType } from "@/lib/constants/endgameChecklists";

export interface Acquirer {
  id: string;
  name: string;
  type: 'strategic' | 'private_equity' | 'other';
  rationale: string;
  acquisition_history?: string;
}

export interface ComparableTransaction {
  id: string;
  target_company: string;
  acquirer: string;
  date: string;
  deal_value?: string;
  multiple_type?: 'revenue' | 'ebitda';
  multiple_value?: number;
}

export interface EndgameChecklistState {
  [itemId: string]: boolean;
}

export interface ExitStrategyData {
  id?: string;
  product_id: string;
  company_id: string;
  potential_acquirers: Acquirer[];
  comparable_transactions: ComparableTransaction[];
  strategic_rationale: string | null;
  exit_timeline_years: number | null;
  preferred_exit_type: string | null;
  // New Strategic Horizon fields
  selected_endgame: EndgameType | null;
  endgame_checklist: EndgameChecklistState;
  endgame_metrics_focus: string | null;
  licensing_terms: Record<string, unknown>;
  ipo_readiness: Record<string, unknown>;
}

interface DbExitStrategy {
  id: string;
  product_id: string;
  company_id: string;
  potential_acquirers: unknown;
  comparable_transactions: unknown;
  strategic_rationale: string | null;
  exit_timeline_years: number | null;
  preferred_exit_type: string | null;
  selected_endgame: string | null;
  endgame_checklist: unknown;
  endgame_metrics_focus: string | null;
  licensing_terms: unknown;
  ipo_readiness: unknown;
  created_at: string;
  updated_at: string;
}

export function useExitStrategy(productId: string | undefined) {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ['exit-strategy', productId],
    queryFn: async (): Promise<ExitStrategyData | null> => {
      if (!productId) return null;

      const { data, error } = await supabase
        .from('product_exit_strategy' as any)
        .select('*')
        .eq('product_id', productId)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) return null;

      const dbData = data as unknown as DbExitStrategy;

      return {
        id: dbData.id,
        product_id: dbData.product_id,
        company_id: dbData.company_id,
        potential_acquirers: (dbData.potential_acquirers as Acquirer[]) || [],
        comparable_transactions: (dbData.comparable_transactions as ComparableTransaction[]) || [],
        strategic_rationale: dbData.strategic_rationale,
        exit_timeline_years: dbData.exit_timeline_years,
        preferred_exit_type: dbData.preferred_exit_type,
        selected_endgame: dbData.selected_endgame as EndgameType | null,
        endgame_checklist: (dbData.endgame_checklist as EndgameChecklistState) || {},
        endgame_metrics_focus: dbData.endgame_metrics_focus,
        licensing_terms: (dbData.licensing_terms as Record<string, unknown>) || {},
        ipo_readiness: (dbData.ipo_readiness as Record<string, unknown>) || {},
      };
    },
    enabled: !!productId,
  });
}

export function useSaveExitStrategy(productId: string | undefined) {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: async (data: Partial<ExitStrategyData>) => {
      if (!productId || !companyId) {
        throw new Error('Product ID and Company ID are required');
      }

      const payload = {
        product_id: productId,
        company_id: companyId,
        potential_acquirers: data.potential_acquirers || [],
        comparable_transactions: data.comparable_transactions || [],
        strategic_rationale: data.strategic_rationale || null,
        exit_timeline_years: data.exit_timeline_years || null,
        preferred_exit_type: data.preferred_exit_type || null,
        selected_endgame: data.selected_endgame || null,
        endgame_checklist: data.endgame_checklist || {},
        endgame_metrics_focus: data.endgame_metrics_focus || null,
        licensing_terms: data.licensing_terms || {},
        ipo_readiness: data.ipo_readiness || {},
      };

      const { data: result, error } = await supabase
        .from('product_exit_strategy' as any)
        .upsert(payload, { 
          onConflict: 'product_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exit-strategy', productId] });
      queryClient.invalidateQueries({ queryKey: ['funnel-exit-strategy', productId] });
      toast.success('Strategic horizon saved');
    },
    onError: (error) => {
      console.error('Error saving strategic horizon:', error);
      toast.error('Failed to save strategic horizon');
    },
  });
}
