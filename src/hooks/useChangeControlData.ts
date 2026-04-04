import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  ChangeControlRequest, 
  CCRStateTransition,
  CreateCCRInput, 
  UpdateCCRInput,
  CCRStatus,
  CCRWithRelations
} from '@/types/changeControl';
import { Json } from '@/integrations/supabase/types';

// Helper to convert Json[] to string[]
function jsonToStringArray(json: Json | null): string[] {
  if (!json) return [];
  if (Array.isArray(json)) {
    return json.filter((item): item is string => typeof item === 'string');
  }
  return [];
}

// Helper to map database row to CCR type
function mapRowToCCR(row: any): ChangeControlRequest {
  return {
    ...row,
    affected_documents: jsonToStringArray(row.affected_documents),
    affected_requirements: jsonToStringArray(row.affected_requirements),
    affected_specifications: jsonToStringArray(row.affected_specifications),
  };
}

// Fetch CCRs by company
export function useCCRsByCompany(companyId: string | undefined) {
  return useQuery({
    queryKey: ['ccrs', 'company', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from('change_control_requests')
        .select(`
          *,
          owner:profiles!change_control_requests_owner_id_fkey(id, first_name, last_name),
          product:products!change_control_requests_product_id_fkey(id, name)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(row => ({
        ...mapRowToCCR(row),
        owner: row.owner ? {
          id: (row.owner as any).id,
          full_name: `${(row.owner as any).first_name || ''} ${(row.owner as any).last_name || ''}`.trim() || 'Unknown',
        } : null,
        product: row.product,
      })) as CCRWithRelations[];
    },
    enabled: !!companyId,
  });
}

// Fetch CCRs by product
export function useCCRsByProduct(productId: string | undefined) {
  return useQuery({
    queryKey: ['ccrs', 'product', productId],
    queryFn: async () => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .from('change_control_requests')
        .select(`
          *,
          owner:profiles!change_control_requests_owner_id_fkey(id, first_name, last_name)
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(row => {
        const ccr = mapRowToCCR(row);
        const owner = row.owner ? { id: row.owner.id, full_name: `${row.owner.first_name || ''} ${row.owner.last_name || ''}`.trim() } : null;
        return { ...ccr, owner } as CCRWithRelations;
      });
    },
    enabled: !!productId,
  });
}

// Fetch CCRs linked to a specific CAPA
export function useCCRsByCAPA(capaId: string | undefined) {
  return useQuery({
    queryKey: ['ccrs', 'capa', capaId],
    queryFn: async () => {
      if (!capaId) return [];
      
      const { data, error } = await supabase
        .from('change_control_requests')
        .select('*')
        .eq('source_capa_id', capaId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapRowToCCR) as ChangeControlRequest[];
    },
    enabled: !!capaId,
  });
}

// Fetch single CCR by ID
export function useCCRById(ccrId: string | undefined) {
  return useQuery({
    queryKey: ['ccr', ccrId],
    queryFn: async () => {
      if (!ccrId) return null;
      
      const { data, error } = await supabase
        .from('change_control_requests')
        .select(`
          *,
          owner:profiles!change_control_requests_owner_id_fkey(id, first_name, last_name),
          source_capa:capa_records!change_control_requests_source_capa_id_fkey(id, capa_id, problem_description),
          product:products!change_control_requests_product_id_fkey(id, name),
          company:companies!change_control_requests_company_id_fkey(id, name)
        `)
        .eq('id', ccrId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      return {
        ...mapRowToCCR(data),
        owner: data.owner ? {
          id: (data.owner as any).id,
          full_name: `${(data.owner as any).first_name || ''} ${(data.owner as any).last_name || ''}`.trim() || 'Unknown',
        } : null,
        source_capa: data.source_capa,
        product: data.product,
        company: data.company,
      } as CCRWithRelations;
    },
    enabled: !!ccrId,
  });
}

// Create CCR
export function useCreateCCR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCCRInput) => {
      const { data, error } = await supabase
        .from('change_control_requests')
        .insert({
          company_id: input.company_id,
          product_id: input.product_id || null,
          target_object_id: input.target_object_id || null,
          target_object_type: input.target_object_type || null,
          source_type: input.source_type,
          source_capa_id: input.source_capa_id || null,
          source_reference: input.source_reference || null,
          change_type: input.change_type,
          title: input.title,
          description: input.description,
          justification: input.justification || null,
          risk_impact: input.risk_impact || 'low',
          regulatory_impact: input.regulatory_impact || false,
          owner_id: input.owner_id || null,
          target_implementation_date: input.target_implementation_date || null,
          created_by: (await supabase.auth.getUser()).data.user?.id || '',
          ccr_id: '', // Will be auto-generated by trigger
        } as any)
        .select()
        .single();

      if (error) throw error;
      return mapRowToCCR(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ccrs'] });
      toast({
        title: 'Change Control Request Created',
        description: `CCR ${data.ccr_id} has been created successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating CCR',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Update CCR
export function useUpdateCCR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateCCRInput) => {
      const { id, ...updates } = input;
      
      const { data, error } = await supabase
        .from('change_control_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapRowToCCR(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ccrs'] });
      queryClient.invalidateQueries({ queryKey: ['ccr'] });
      toast({
        title: 'CCR Updated',
        description: 'Change Control Request has been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating CCR',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Transition CCR State
export function useTransitionCCRState() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ccrId,
      fromStatus,
      toStatus,
      userId,
      reason,
    }: {
      ccrId: string;
      fromStatus: CCRStatus | null;
      toStatus: CCRStatus;
      userId: string;
      reason?: string;
    }) => {
      // Update the CCR status
      const { error: updateError } = await supabase
        .from('change_control_requests')
        .update({ status: toStatus })
        .eq('id', ccrId);

      if (updateError) throw updateError;

      // Record the transition
      const { error: transitionError } = await supabase
        .from('change_control_state_transitions')
        .insert({
          ccr_id: ccrId,
          from_status: fromStatus,
          to_status: toStatus,
          transitioned_by: userId,
          transition_reason: reason || null,
        });

      if (transitionError) throw transitionError;

      // If CCR approved, activate any linked BOM revision
      if (toStatus === 'approved') {
        const { data: linkedRevisions } = await supabase
          .from('bom_revisions')
          .select('id, product_id')
          .eq('ccr_id', ccrId)
          .eq('status', 'draft');

        if (linkedRevisions && linkedRevisions.length > 0) {
          const { BomService } = await import('@/services/bomService');
          for (const rev of linkedRevisions) {
            await BomService.activateRevision(rev.id, rev.product_id, userId);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ccrs'] });
      queryClient.invalidateQueries({ queryKey: ['ccr'] });
      toast({
        title: 'Status Updated',
        description: 'Change Control Request status has been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Fetch CCR State Transitions
export function useCCRTransitions(ccrId: string | undefined) {
  return useQuery({
    queryKey: ['ccr-transitions', ccrId],
    queryFn: async () => {
      if (!ccrId) return [];
      
      const { data, error } = await supabase
        .from('change_control_state_transitions')
        .select(`
          *,
          transitioner:profiles!change_control_state_transitions_transitioned_by_fkey(id, first_name, last_name)
        `)
        .eq('ccr_id', ccrId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(row => ({
        ...row,
        transitioner: row.transitioner ? {
          id: (row.transitioner as any).id,
          full_name: `${(row.transitioner as any).first_name || ''} ${(row.transitioner as any).last_name || ''}`.trim() || 'Unknown',
        } : null,
      })) as (CCRStateTransition & { transitioner: { id: string; full_name: string } | null })[];
    },
    enabled: !!ccrId,
  });
}

// Delete CCR
export function useDeleteCCR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ccrId: string) => {
      const { error } = await supabase
        .from('change_control_requests')
        .delete()
        .eq('id', ccrId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ccrs'] });
      toast({
        title: 'CCR Deleted',
        description: 'Change Control Request has been deleted.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting CCR',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
