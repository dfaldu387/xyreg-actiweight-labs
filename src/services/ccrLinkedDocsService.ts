import { supabase } from '@/integrations/supabase/client';

export interface LinkedCCRDoc {
  id: string;
  name: string;
  document_reference: string | null;
  document_number: string | null;
  document_type: string | null;
  status: string | null;
  updated_at: string | null;
  document_scope: string | null;
}

/**
 * Fetch metadata for a list of Document CI ids referenced by a CCR
 * (stored in change_control_requests.affected_documents).
 */
export async function fetchLinkedDocs(ciIds: string[]): Promise<LinkedCCRDoc[]> {
  const ids = (ciIds || []).filter(Boolean);
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from('phase_assigned_document_template')
    .select('id, name, document_reference, document_number, document_type, status, updated_at, document_scope')
    .in('id', ids);
  if (error) {
    console.error('[ccrLinkedDocsService] fetchLinkedDocs error', error);
    return [];
  }
  // Preserve caller order
  const byId = new Map((data || []).map((d: any) => [d.id, d as LinkedCCRDoc]));
  return ids.map((id) => byId.get(id)).filter(Boolean) as LinkedCCRDoc[];
}

/**
 * Count CCRs whose affected_documents array contains the given CI id.
 */
export async function countCCRsReferencingDoc(ciId: string): Promise<number> {
  if (!ciId) return 0;
  const { count, error } = await supabase
    .from('change_control_requests')
    .select('id', { count: 'exact', head: true })
    .contains('affected_documents', [ciId]);
  if (error) {
    console.error('[ccrLinkedDocsService] countCCRsReferencingDoc error', error);
    return 0;
  }
  return count || 0;
}