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

export async function resolveCurrentCCRProfileId() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) {
    throw new Error('You must be signed in to perform this action.');
  }

  const { data: existingProfile, error: profileLookupError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileLookupError) throw profileLookupError;
  if (existingProfile?.id) return existingProfile.id;

  const { data: createdProfile, error: profileCreateError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        email: user.email ?? null,
        first_name: typeof user.user_metadata?.first_name === 'string' ? user.user_metadata.first_name : null,
        last_name: typeof user.user_metadata?.last_name === 'string' ? user.user_metadata.last_name : null,
      },
      { onConflict: 'id' }
    )
    .select('id')
    .single();

  if (profileCreateError) {
    throw new Error(`Unable to create the profile record required for this action: ${profileCreateError.message}`);
  }

  return createdProfile.id;
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
          owner:user_profiles!change_control_requests_owner_id_fkey(id, first_name, last_name),
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
          owner:user_profiles!change_control_requests_owner_id_fkey(id, first_name, last_name)
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

      // Step 1: fetch the row by id only. Decoupled from embedded joins so a
      // failing related table (RLS-restricted CAPA, missing product, etc.)
      // can't make the whole CCR appear "not found".
      const { data: row, error } = await supabase
        .from('change_control_requests')
        .select('*')
        .eq('id', ccrId)
        .maybeSingle();

      if (error) {
        console.error('[useCCRById] base row fetch failed', { ccrId, error });
        throw error;
      }
      if (!row) {
        console.warn('[useCCRById] no CCR row visible for id', ccrId);
        return null;
      }

      // Step 2: best-effort fetch each related entity. Failures here are
      // logged but don't poison the parent CCR.
      const [ownerRes, creatorRes, capaRes, productRes, companyRes] = await Promise.all([
        row.owner_id
          ? supabase
              .from('user_profiles')
              .select('id, first_name, last_name')
              .eq('id', row.owner_id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        row.created_by
          ? supabase
              .from('user_profiles')
              .select('id, first_name, last_name')
              .eq('id', row.created_by)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        row.source_capa_id
          ? supabase
              .from('capa_records')
              .select('id, capa_id, problem_description')
              .eq('id', row.source_capa_id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        row.product_id
          ? supabase
              .from('products')
              .select('id, name')
              .eq('id', row.product_id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        row.company_id
          ? supabase
              .from('companies')
              .select('id, name')
              .eq('id', row.company_id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (ownerRes.error) console.warn('[useCCRById] owner fetch failed', ownerRes.error);
      if (creatorRes.error) console.warn('[useCCRById] creator fetch failed', creatorRes.error);
      if (capaRes.error) console.warn('[useCCRById] source_capa fetch failed', capaRes.error);
      if (productRes.error) console.warn('[useCCRById] product fetch failed', productRes.error);
      if (companyRes.error) console.warn('[useCCRById] company fetch failed', companyRes.error);

      const buildName = (p: any | null) =>
        p
          ? `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown'
          : null;

      return {
        ...mapRowToCCR(row),
        owner: ownerRes.data
          ? {
              id: (ownerRes.data as any).id,
              full_name: buildName(ownerRes.data) ?? 'Unknown',
            }
          : null,
        creator: creatorRes.data
          ? {
              id: (creatorRes.data as any).id,
              full_name: buildName(creatorRes.data) ?? 'Unknown',
            }
          : null,
        source_capa: capaRes.data ?? null,
        product: productRes.data ?? null,
        company: companyRes.data ?? null,
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
      const createdBy = await resolveCurrentCCRProfileId();

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
          affected_documents: input.affected_documents && input.affected_documents.length > 0
            ? input.affected_documents
            : [],
          created_by: createdBy,
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
      // Any CCR row update fires the DB audit trigger, so the audit log
      // changes too. The state-transition list doesn't change here, but
      // invalidate it defensively in case a future code path updates the
      // status field directly via this hook.
      queryClient.invalidateQueries({ queryKey: ['ccr-audit-log'] });
      queryClient.invalidateQueries({ queryKey: ['ccr-transitions'] });
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
      // change_control_state_transitions.transitioned_by FKs public.profiles.
      // Some accounts only have a row in user_profiles (e.g. invited users),
      // so the INSERT below would 23503 if we don't ensure the profile row.
      // Ensure it BEFORE flipping status so we don't leave the CCR in a state
      // with no matching transition record.
      await resolveCurrentCCRProfileId();

      // Record the transition first. If this fails the status hasn't moved
      // yet, so the CCR's history stays consistent.
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

      // Now flip the status on the CCR row.
      const { error: updateError } = await supabase
        .from('change_control_requests')
        .update({ status: toStatus })
        .eq('id', ccrId);

      if (updateError) throw updateError;

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
      // The transition row is fresh and the CCR row's status changed —
      // refetch both the timeline and the audit log so the new entry shows
      // up immediately, no manual refresh needed.
      queryClient.invalidateQueries({ queryKey: ['ccr-transitions'] });
      queryClient.invalidateQueries({ queryKey: ['ccr-audit-log'] });
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
      const { data, error } = await supabase
        .from('change_control_requests')
        .delete()
        .eq('id', ccrId)
        .select('id');

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('No CCR was deleted. It may have been removed already or you may not have permission.');
      }
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ccrs'] });
      queryClient.invalidateQueries({ queryKey: ['ccr'] });
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
