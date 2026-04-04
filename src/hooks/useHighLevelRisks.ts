import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { RiskCategory } from '@/constants/highLevelRiskOptions';

export interface HighLevelRisk {
  id: string;
  product_id: string;
  company_id: string;
  category: RiskCategory;
  risk_type: string;
  is_custom: boolean;
  description: string;
  likelihood: number;
  impact: number;
  risk_score: number;
  risk_level: string;
  mitigation: string | null;
  status: 'Open' | 'In Progress' | 'Mitigated';
  owner: string | null;
  due_date: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CreateHighLevelRiskInput {
  product_id: string;
  company_id: string;
  category: RiskCategory;
  risk_type: string;
  is_custom: boolean;
  description: string;
  likelihood: number;
  impact: number;
  mitigation?: string;
  status?: 'Open' | 'In Progress' | 'Mitigated';
  owner?: string;
  due_date?: string;
}

export interface UpdateHighLevelRiskInput {
  id: string;
  category?: RiskCategory;
  risk_type?: string;
  is_custom?: boolean;
  description?: string;
  likelihood?: number;
  impact?: number;
  mitigation?: string | null;
  status?: 'Open' | 'In Progress' | 'Mitigated';
  owner?: string | null;
  due_date?: string | null;
}

export function useHighLevelRisks(productId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['high-level-risks', productId];

  const { data: risks = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_high_level_risks')
        .select('*')
        .eq('product_id', productId)
        .order('category')
        .order('order_index');

      if (error) throw error;
      return data as HighLevelRisk[];
    },
    enabled: !!productId,
    staleTime: 30000,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateHighLevelRiskInput) => {
      // Get max order index for this category
      const { data: existing } = await supabase
        .from('product_high_level_risks')
        .select('order_index')
        .eq('product_id', input.product_id)
        .eq('category', input.category)
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrderIndex = existing && existing.length > 0 ? (existing[0].order_index + 1) : 0;

      const { data, error } = await supabase
        .from('product_high_level_risks')
        .insert({
          ...input,
          order_index: nextOrderIndex,
        })
        .select()
        .single();

      if (error) throw error;
      return data as HighLevelRisk;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      // Also invalidate the funnel query used by Genesis sidebar
      queryClient.invalidateQueries({ queryKey: ['funnel-high-level-risks', productId] });
      // Invalidate count query for border styling
      queryClient.invalidateQueries({ queryKey: ['high-level-risks', productId, 'count'] });
      toast.success('Risk added successfully');
    },
    onError: (error: any) => {
      console.error('Failed to create risk:', error);
      const message = error?.message || error?.details || 'Failed to add risk';
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (input: UpdateHighLevelRiskInput) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from('product_high_level_risks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as HighLevelRisk;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['funnel-high-level-risks', productId] });
      queryClient.invalidateQueries({ queryKey: ['high-level-risks', productId, 'count'] });
      toast.success('Risk updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update risk:', error);
      toast.error('Failed to update risk');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_high_level_risks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['funnel-high-level-risks', productId] });
      queryClient.invalidateQueries({ queryKey: ['high-level-risks', productId, 'count'] });
      toast.success('Risk deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete risk:', error);
      toast.error('Failed to delete risk');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'Open' | 'In Progress' | 'Mitigated' }) => {
      const { data, error } = await supabase
        .from('product_high_level_risks')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as HighLevelRisk;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['funnel-high-level-risks', productId] });
      queryClient.invalidateQueries({ queryKey: ['high-level-risks', productId, 'count'] });
      toast.success('Status updated');
    },
    onError: (error) => {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    },
  });

  // Group risks by category
  const risksByCategory = risks.reduce((acc, risk) => {
    if (!acc[risk.category]) {
      acc[risk.category] = [];
    }
    acc[risk.category].push(risk);
    return acc;
  }, {} as Record<RiskCategory, HighLevelRisk[]>);

  // Summary statistics
  const summary = {
    total: risks.length,
    mitigated: risks.filter(r => r.status === 'Mitigated').length,
    inProgress: risks.filter(r => r.status === 'In Progress').length,
    open: risks.filter(r => r.status === 'Open').length,
    critical: risks.filter(r => r.risk_level === 'Critical').length,
    high: risks.filter(r => r.risk_level === 'High').length,
  };

  return {
    risks,
    risksByCategory,
    summary,
    isLoading,
    error,
    createRisk: createMutation.mutate,
    updateRisk: updateMutation.mutate,
    deleteRisk: deleteMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
