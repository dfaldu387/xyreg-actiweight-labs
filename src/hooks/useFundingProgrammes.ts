import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FundingProgramme {
  id: string;
  name: string;
  region: string;
  programme_code: string | null;
  description: string | null;
  funding_body: string | null;
  typical_budget_range: string | null;
  trl_range: string | null;
  deadline_info: string | null;
  eligibility_criteria: EligibilityCriterion[];
  checklist_items: WorkspaceItem[];
  url: string | null;
  is_builtin: boolean;
  is_active: boolean;
}

export interface EligibilityCriterion {
  id: string;
  question: string;
  category: string;
}

export interface WorkspaceItem {
  id: string;
  title: string;
  type: string;
  required: boolean;
}

export interface FundingApplication {
  id: string;
  company_id: string;
  programme_id: string;
  status: string;
  eligibility_score: number;
  checklist_responses: Record<string, { answer: 'yes' | 'no' | 'partial' | 'unknown'; notes: string }>;
  notes: string | null;
  target_call: string | null;
  submission_deadline: string | null;
  requested_amount: number | null;
  workspace_items: { id: string; status: string; notes?: string }[];
  created_at: string;
  updated_at: string;
}

export function useFundingProgrammes() {
  return useQuery({
    queryKey: ['funding-programmes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funding_programmes')
        .select('*')
        .eq('is_active', true)
        .order('region', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return (data || []).map(p => ({
        ...p,
        eligibility_criteria: (p.eligibility_criteria || []) as unknown as EligibilityCriterion[],
        checklist_items: (p.checklist_items || []) as unknown as WorkspaceItem[],
      })) as FundingProgramme[];
    },
  });
}

export function useFundingApplications(companyId: string | undefined) {
  return useQuery({
    queryKey: ['funding-applications', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_funding_applications')
        .select('*')
        .eq('company_id', companyId!);
      if (error) throw error;
      return (data || []).map(a => ({
        ...a,
        checklist_responses: (a.checklist_responses || {}) as Record<string, any>,
        workspace_items: (a.workspace_items || []) as any[],
      })) as FundingApplication[];
    },
  });
}

export function useStartFundingApplication(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (programmeId: string) => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('company_funding_applications')
        .insert({
          company_id: companyId,
          programme_id: programmeId,
          status: 'exploring',
          created_by: user.user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['funding-applications', companyId] });
      toast.success('Application started');
    },
    onError: (e: any) => toast.error(e.message || 'Failed to start application'),
  });
}

export function useUpdateFundingApplication(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FundingApplication> & { id: string }) => {
      const { error } = await supabase
        .from('company_funding_applications')
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['funding-applications', companyId] });
    },
    onError: (e: any) => toast.error(e.message || 'Failed to update'),
  });
}
