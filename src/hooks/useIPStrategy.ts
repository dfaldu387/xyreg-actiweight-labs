import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCallback, useRef } from 'react';

export interface IPStrategyData {
  ip_strategy_summary: string | null;
  ip_protection_types: string[] | null;
  ip_ownership_status: string | null;
  ip_ownership_notes: string | null;
  fto_risk_level: string | null;
  fto_analysis_date: string | null;
  fto_notes: string | null;
  fto_certainty: string | null;
  fto_status: string | null;
  fto_mitigation_strategy: string | null;
  no_ip_applicable: boolean | null;
  is_software_project: boolean | null;
  samd_license_audit_completed: boolean | null;
  samd_gpl_code_present: boolean | null;
  samd_license_notes: string | null;
  ip_strategy_completed: boolean | null;
}

export function useIPStrategy(productId: string | undefined) {
  return useQuery({
    queryKey: ['ip-strategy', productId],
    queryFn: async () => {
      if (!productId) return null;
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          ip_strategy_summary,
          ip_protection_types,
          ip_ownership_status,
          ip_ownership_notes,
          fto_risk_level,
          fto_analysis_date,
          fto_notes,
          fto_certainty,
          fto_status,
          fto_mitigation_strategy,
          no_ip_applicable,
          is_software_project,
          samd_license_audit_completed,
          samd_gpl_code_present,
          samd_license_notes,
          ip_strategy_completed
        `)
        .eq('id', productId)
        .single();

      if (error) throw error;
      return data as IPStrategyData;
    },
    enabled: !!productId,
  });
}

export function useUpdateIPStrategy(productId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<IPStrategyData>) => {
      if (!productId) throw new Error('Product ID required');

      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-strategy', productId] });
      queryClient.invalidateQueries({ queryKey: ['funnel-product', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
    },
  });
}

// Auto-save hook with debounce
export function useAutoSaveIPStrategy(productId: string | undefined) {
  const updateMutation = useUpdateIPStrategy(productId);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedSave = useCallback((updates: Partial<IPStrategyData>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      updateMutation.mutate(updates);
    }, 500);
  }, [updateMutation]);

  return {
    save: debouncedSave,
    isSaving: updateMutation.isPending,
  };
}
