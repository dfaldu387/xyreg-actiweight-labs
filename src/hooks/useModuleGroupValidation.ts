import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ModuleGroupValidationRecord {
  id: string;
  company_id: string;
  release_id: string | null;
  module_group_id: string;
  release_version: string | null;

  iq_verdict: string | null;
  iq_reasoning: string | null;
  iq_evidence_notes: string | null;
  iq_evidence_doc_ids: string[] | null;
  iq_test_environment: Record<string, any>;
  iq_test_step_results: any[];
  iq_signatures: Record<string, any>;

  oq_verdict: string | null;
  oq_reasoning: string | null;
  oq_deviations_noted: string | null;
  oq_risk_accepted: boolean | null;
  oq_risk_rationale: string | null;
  oq_evidence_doc_ids: string[] | null;
  oq_test_environment: Record<string, any>;
  oq_test_step_results: any[];
  oq_signatures: Record<string, any>;

  pq_verdict: string | null;
  pq_reasoning: string | null;
  pq_evidence_notes: string | null;
  pq_evidence_doc_ids: string[] | null;
  pq_test_environment: Record<string, any>;
  pq_test_step_results: any[];
  pq_signatures: Record<string, any>;

  overall_verdict: string | null;
  overall_rationale: string | null;
  conditions: string | null;

  validated_by: string | null;
  validated_at: string | null;
  invalidated_by_core: boolean;
  invalidated_service: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch a single validation record for a module group (company + release + module)
 */
export function useModuleGroupValidation(
  companyId: string,
  releaseId: string | null,
  moduleGroupId: string
) {
  return useQuery({
    queryKey: ['module-group-validation', companyId, releaseId, moduleGroupId],
    queryFn: async () => {
      let query = (supabase as any)
        .from('module_group_validations')
        .select('*')
        .eq('company_id', companyId)
        .eq('module_group_id', moduleGroupId);

      if (releaseId) {
        query = query.eq('release_id', releaseId);
      } else {
        query = query.is('release_id', null);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data as ModuleGroupValidationRecord | null;
    },
    enabled: !!companyId && !!moduleGroupId,
  });
}

/**
 * Fetch all validation records for a company + release (for coverage dashboard)
 */
export function useAllModuleGroupValidations(
  companyId: string,
  releaseId: string | null
) {
  return useQuery({
    queryKey: ['module-group-validations-all', companyId, releaseId],
    queryFn: async () => {
      let query = (supabase as any)
        .from('module_group_validations')
        .select('module_group_id, overall_verdict, iq_verdict, oq_verdict, pq_verdict');

      query = query.eq('company_id', companyId);

      if (releaseId) {
        query = query.eq('release_id', releaseId);
      } else {
        query = query.is('release_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Pick<ModuleGroupValidationRecord, 'module_group_id' | 'overall_verdict' | 'iq_verdict' | 'oq_verdict' | 'pq_verdict'>[];
    },
    enabled: !!companyId,
  });
}

/**
 * Upsert (save) a validation record
 */
export function useSaveModuleGroupValidation(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      release_id: string | null;
      module_group_id: string;
      release_version: string | null;
      iq_rationale: any;
      oq_rationale: any;
      pq_rationale: any;
      overall_verdict: string;
      overall_rationale: string;
      conditions: string;
      iq_signatures?: any;
      oq_signatures?: any;
      pq_signatures?: any;
    }) => {
      const { data: user } = await supabase.auth.getUser();

      const row = {
        company_id: companyId,
        release_id: data.release_id,
        module_group_id: data.module_group_id,
        release_version: data.release_version,

        iq_verdict: data.iq_rationale?.verdict || '',
        iq_reasoning: data.iq_rationale?.reasoning || '',
        iq_evidence_notes: data.iq_rationale?.evidence_notes || '',
        iq_evidence_doc_ids: data.iq_rationale?.evidence_doc_ids || [],
        iq_test_environment: data.iq_rationale?.test_environment || {},
        iq_test_step_results: data.iq_rationale?.test_step_results || [],
        iq_signatures: data.iq_signatures || {},

        oq_verdict: data.oq_rationale?.verdict || '',
        oq_reasoning: data.oq_rationale?.reasoning || '',
        oq_deviations_noted: data.oq_rationale?.deviations_noted || '',
        oq_risk_accepted: data.oq_rationale?.risk_accepted ?? null,
        oq_risk_rationale: data.oq_rationale?.risk_rationale || '',
        oq_evidence_doc_ids: data.oq_rationale?.evidence_doc_ids || [],
        oq_test_environment: data.oq_rationale?.test_environment || {},
        oq_test_step_results: data.oq_rationale?.test_step_results || [],
        oq_signatures: data.oq_signatures || {},

        pq_verdict: data.pq_rationale?.verdict || '',
        pq_reasoning: data.pq_rationale?.reasoning || '',
        pq_evidence_notes: data.pq_rationale?.evidence_notes || '',
        pq_evidence_doc_ids: data.pq_rationale?.evidence_doc_ids || [],
        pq_test_environment: data.pq_rationale?.test_environment || {},
        pq_test_step_results: data.pq_rationale?.test_step_results || [],
        pq_signatures: data.pq_signatures || {},

        overall_verdict: data.overall_verdict || '',
        overall_rationale: data.overall_rationale || '',
        conditions: data.conditions || '',

        validated_by: user?.user?.id || null,
        validated_at: new Date().toISOString(),
      };

      // PostgreSQL UNIQUE constraint doesn't match NULLs, so we manually check-then-upsert
      let existingQuery = (supabase as any)
        .from('module_group_validations')
        .select('id')
        .eq('company_id', companyId)
        .eq('module_group_id', data.module_group_id);

      if (data.release_id) {
        existingQuery = existingQuery.eq('release_id', data.release_id);
      } else {
        existingQuery = existingQuery.is('release_id', null);
      }

      const { data: existing } = await existingQuery.maybeSingle();

      let result, error;
      if (existing?.id) {
        // UPDATE existing record
        ({ data: result, error } = await (supabase as any)
          .from('module_group_validations')
          .update(row)
          .eq('id', existing.id)
          .select()
          .single());
      } else {
        // INSERT new record
        ({ data: result, error } = await (supabase as any)
          .from('module_group_validations')
          .insert(row)
          .select()
          .single());
      }

      if (error) throw error;
      return result;
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['module-group-validation', companyId, variables.release_id, variables.module_group_id] });
      queryClient.invalidateQueries({ queryKey: ['module-group-validations-all', companyId, variables.release_id] });
    },
  });
}
