import { supabase } from "@/integrations/supabase/client";

export type GovernanceStatus = 'draft' | 'approved' | 'approved_with_conditions' | 'rejected' | 'modified';

export interface FieldGovernanceRecord {
  id: string;
  product_id: string;
  section_key: string;
  status: GovernanceStatus;
  design_review_id: string | null;
  verdict_comment: string | null;
  snapshot_hash: string | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all governance records for a product
 */
export async function fetchGovernanceStatuses(productId: string): Promise<FieldGovernanceRecord[]> {
  const { data, error } = await supabase
    .from('field_governance_status' as any)
    .select('*')
    .eq('product_id', productId);

  if (error) {
    console.error('Error fetching governance statuses:', error);
    return [];
  }

  return (data || []) as unknown as FieldGovernanceRecord[];
}

/**
 * Fetch governance record for a specific section
 */
export async function fetchSectionGovernance(
  productId: string,
  sectionKey: string
): Promise<FieldGovernanceRecord | null> {
  const { data, error } = await supabase
    .from('field_governance_status' as any)
    .select('*')
    .eq('product_id', productId)
    .eq('section_key', sectionKey)
    .maybeSingle();

  if (error) {
    console.error('Error fetching section governance:', error);
    return null;
  }

  return data as unknown as FieldGovernanceRecord | null;
}

/**
 * Upsert a governance record (used by DR finalization and status transitions)
 */
export async function upsertGovernanceStatus(
  productId: string,
  sectionKey: string,
  status: GovernanceStatus,
  options?: {
    design_review_id?: string;
    verdict_comment?: string;
    snapshot_hash?: string;
    approved_by?: string;
  }
): Promise<FieldGovernanceRecord | null> {
  const payload: Record<string, any> = {
    product_id: productId,
    section_key: sectionKey,
    status,
    updated_at: new Date().toISOString(),
  };

  if (options?.design_review_id !== undefined) payload.design_review_id = options.design_review_id;
  if (options?.verdict_comment !== undefined) payload.verdict_comment = options.verdict_comment;
  if (options?.snapshot_hash !== undefined) payload.snapshot_hash = options.snapshot_hash;

  if (status === 'approved' || status === 'approved_with_conditions') {
    payload.approved_at = new Date().toISOString();
    if (options?.approved_by) payload.approved_by = options.approved_by;
  }

  const { data, error } = await supabase
    .from('field_governance_status' as any)
    .upsert(payload, { onConflict: 'product_id,section_key' })
    .select()
    .single();

  if (error) {
    console.error('Error upserting governance status:', error);
    return null;
  }

  return data as unknown as FieldGovernanceRecord;
}

/**
 * Transition an approved section to "modified" (the Blue Shift)
 */
export async function markSectionModified(
  productId: string,
  sectionKey: string
): Promise<boolean> {
  const record = await fetchSectionGovernance(productId, sectionKey);
  if (!record || record.status === 'draft' || record.status === 'modified') {
    return false; // No governance record or already in a mutable state
  }

  const result = await upsertGovernanceStatus(productId, sectionKey, 'modified');
  return result !== null;
}
