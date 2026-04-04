import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Market Sizing Hook
export function useMarketSizing(productId: string, companyId: string) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['market-sizing', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_market_sizing')
        .select('*')
        .eq('product_id', productId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  const upsertMutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const { data: existing } = await supabase
        .from('product_market_sizing')
        .select('id')
        .eq('product_id', productId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from('product_market_sizing').update(values).eq('product_id', productId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('product_market_sizing').insert({ 
          ...values, 
          product_id: productId,
          company_id: companyId 
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-sizing', productId] });
      toast.success('Market sizing saved');
    },
    onError: () => toast.error('Failed to save market sizing'),
  });

  return { data, isLoading, error, upsert: upsertMutation.mutate, isSaving: upsertMutation.isPending };
}

// Reimbursement Strategy Hook
export function useReimbursementStrategy(productId: string, companyId: string) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['reimbursement-strategy', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_reimbursement_strategy')
        .select('*')
        .eq('product_id', productId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  const upsertMutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const { data: existing } = await supabase
        .from('product_reimbursement_strategy')
        .select('id')
        .eq('product_id', productId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from('product_reimbursement_strategy').update(values).eq('product_id', productId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('product_reimbursement_strategy').insert({ 
          ...values, 
          product_id: productId,
          company_id: companyId 
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reimbursement-strategy', productId] });
      toast.success('Reimbursement strategy saved');
    },
    onError: () => toast.error('Failed to save reimbursement strategy'),
  });

  return { data, isLoading, error, upsert: upsertMutation.mutate, isSaving: upsertMutation.isPending };
}

// Team Gaps Hook
export function useTeamGaps(productId: string, companyId: string) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['team-gaps', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_team_gaps')
        .select('*')
        .eq('product_id', productId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  const upsertMutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const { data: existing } = await supabase
        .from('product_team_gaps')
        .select('id')
        .eq('product_id', productId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from('product_team_gaps').update(values).eq('product_id', productId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('product_team_gaps').insert({ 
          ...values, 
          product_id: productId,
          company_id: companyId 
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-gaps', productId] });
      toast.success('Team gaps analysis saved');
    },
    onError: () => toast.error('Failed to save team gaps'),
  });

  return { data, isLoading, error, upsert: upsertMutation.mutate, isSaving: upsertMutation.isPending };
}

// Regulatory Timeline Hook
export function useRegulatoryTimeline(productId: string, companyId: string) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['regulatory-timeline', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_regulatory_timeline')
        .select('*')
        .eq('product_id', productId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  const upsertMutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const { data: existing } = await supabase
        .from('product_regulatory_timeline')
        .select('id')
        .eq('product_id', productId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from('product_regulatory_timeline').update(values).eq('product_id', productId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('product_regulatory_timeline').insert({ 
          ...values, 
          product_id: productId,
          company_id: companyId 
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regulatory-timeline', productId] });
      toast.success('Regulatory timeline saved');
    },
    onError: () => toast.error('Failed to save regulatory timeline'),
  });

  return { data, isLoading, error, upsert: upsertMutation.mutate, isSaving: upsertMutation.isPending };
}

// Clinical Evidence Plan Hook
export function useClinicalEvidencePlan(productId: string, companyId: string) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['clinical-evidence-plan', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_clinical_evidence_plan')
        .select('*')
        .eq('product_id', productId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  const upsertMutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const { data: existing } = await supabase
        .from('product_clinical_evidence_plan')
        .select('id')
        .eq('product_id', productId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from('product_clinical_evidence_plan').update(values).eq('product_id', productId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('product_clinical_evidence_plan').insert({ 
          ...values, 
          product_id: productId,
          company_id: companyId 
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-evidence-plan', productId] });
      toast.success('Clinical evidence plan saved');
    },
    onError: () => toast.error('Failed to save clinical evidence plan'),
  });

  return { data, isLoading, error, upsert: upsertMutation.mutate, isSaving: upsertMutation.isPending };
}

// Readiness Gates Hook
export function useReadinessGates(productId: string, companyId: string) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['readiness-gates', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_readiness_gates')
        .select('*')
        .eq('product_id', productId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  const upsertMutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const { data: existing } = await supabase
        .from('product_readiness_gates')
        .select('id')
        .eq('product_id', productId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from('product_readiness_gates').update(values).eq('product_id', productId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('product_readiness_gates').insert({ 
          ...values, 
          product_id: productId,
          company_id: companyId 
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readiness-gates', productId] });
      toast.success('Readiness gates saved');
    },
    onError: () => toast.error('Failed to save readiness gates'),
  });

  return { data, isLoading, error, upsert: upsertMutation.mutate, isSaving: upsertMutation.isPending };
}
