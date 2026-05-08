import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CCRPerspective, CCRReviewerAssignment } from '@/types/changeControl';

const KEY = (ccrId: string) => ['ccr-reviewer-assignments', ccrId];

export function useCCRReviewerAssignments(ccrId: string | undefined) {
  return useQuery({
    queryKey: KEY(ccrId ?? ''),
    enabled: !!ccrId,
    queryFn: async (): Promise<CCRReviewerAssignment[]> => {
      const { data, error } = await (supabase as any)
        .from('ccr_reviewer_assignments')
        .select('*')
        .eq('ccr_id', ccrId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as CCRReviewerAssignment[];
    },
  });
}

export interface ReplaceCCRReviewersInput {
  ccr_id: string;
  reviewers: Array<{ user_id: string; perspectives: CCRPerspective[] }>;
  /** When resubmitting from rejected, clears prior approvals. */
  resetApprovals?: boolean;
}

export function useReplaceCCRReviewers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ReplaceCCRReviewersInput) => {
      // Fetch current rows
      const { data: existing, error: fetchErr } = await (supabase as any)
        .from('ccr_reviewer_assignments')
        .select('id, user_id, perspectives, approved_perspectives, approved_at, approved_by')
        .eq('ccr_id', input.ccr_id);
      if (fetchErr) throw fetchErr;

      const existingByUser = new Map<string, any>(
        (existing ?? []).map((r: any) => [r.user_id, r]),
      );
      const wantedUserIds = new Set(input.reviewers.map((r) => r.user_id));

      // Delete rows for users no longer assigned
      const toDelete = (existing ?? [])
        .filter((r: any) => !wantedUserIds.has(r.user_id))
        .map((r: any) => r.id);
      if (toDelete.length > 0) {
        const { error } = await (supabase as any)
          .from('ccr_reviewer_assignments')
          .delete()
          .in('id', toDelete);
        if (error) throw error;
      }

      // Upsert each row
      for (const r of input.reviewers) {
        const cur = existingByUser.get(r.user_id);
        const reset = !!input.resetApprovals;
        if (cur) {
          // Keep approved_perspectives that still exist in the new perspectives,
          // unless resetting.
          const keepApproved = reset
            ? []
            : (cur.approved_perspectives ?? []).filter((p: string) =>
                r.perspectives.includes(p as CCRPerspective),
              );
          const update: any = {
            perspectives: r.perspectives,
            approved_perspectives: keepApproved,
          };
          if (reset || keepApproved.length === 0) {
            update.approved_at = null;
            update.approved_by = null;
          }
          const { error } = await (supabase as any)
            .from('ccr_reviewer_assignments')
            .update(update)
            .eq('id', cur.id);
          if (error) throw error;
        } else {
          const { error } = await (supabase as any)
            .from('ccr_reviewer_assignments')
            .insert({
              ccr_id: input.ccr_id,
              user_id: r.user_id,
              perspectives: r.perspectives,
              approved_perspectives: [],
            });
          if (error) throw error;
        }
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: KEY(vars.ccr_id) });
    },
  });
}

export interface ApprovePerspectivesInput {
  assignment_id: string;
  ccr_id: string;
  user_id: string;
  perspectives: CCRPerspective[]; // perspectives being approved (added to approved_perspectives)
}

export function useApproveCCRPerspectives() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ApprovePerspectivesInput) => {
      const { data: row, error: fetchErr } = await (supabase as any)
        .from('ccr_reviewer_assignments')
        .select('approved_perspectives')
        .eq('id', input.assignment_id)
        .single();
      if (fetchErr) throw fetchErr;
      const merged = Array.from(
        new Set([...(row?.approved_perspectives ?? []), ...input.perspectives]),
      );
      const { error } = await (supabase as any)
        .from('ccr_reviewer_assignments')
        .update({
          approved_perspectives: merged,
          approved_at: new Date().toISOString(),
          approved_by: input.user_id,
        })
        .eq('id', input.assignment_id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: KEY(vars.ccr_id) });
    },
  });
}

/** A CCR is fully approved when every assignment row has approved every one of its perspectives. */
export function isCCRFullyApproved(assignments: CCRReviewerAssignment[]): boolean {
  if (assignments.length === 0) return false;
  return assignments.every((a) => {
    if (!a.approved_at) return false;
    return a.perspectives.every((p) => a.approved_perspectives.includes(p));
  });
}

/** Pending perspectives for a given user across all assignments on this CCR. */
export function pendingPerspectivesForUser(
  assignments: CCRReviewerAssignment[],
  userId: string,
): { assignment: CCRReviewerAssignment; pending: CCRPerspective[] } | null {
  const a = assignments.find((x) => x.user_id === userId);
  if (!a) return null;
  const pending = a.perspectives.filter((p) => !a.approved_perspectives.includes(p));
  if (pending.length === 0) return null;
  return { assignment: a, pending };
}