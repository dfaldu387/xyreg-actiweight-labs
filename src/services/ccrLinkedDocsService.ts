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

/**
 * Extract document references from a CCR description string.
 * Matches:
 *   - SOP identifiers: SOP-001, SOP-QA-002, SOP-RA-034
 *   - Generic doc refs: WI-, FRM-, POL-, REC- followed by digits (with optional sub-prefix)
 * Returns the canonical uppercased tokens.
 */
export function extractReferencedDocTokens(description: string | null | undefined): string[] {
  if (!description) return [];
  const re = /\b(SOP|WI|FRM|POL|REC|DOC)[-_\s]*(?:[A-Za-z]{1,3}[-_\s]+)?(\d{1,4})\b/gi;
  const tokens = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(description)) !== null) {
    const prefix = m[1].toUpperCase();
    const num = m[2].padStart(3, '0');
    tokens.add(`${prefix}-${num}`);
  }
  return Array.from(tokens);
}

/**
 * Normalise a linked document's reference/number to the canonical token form
 * used by extractReferencedDocTokens.
 */
export function canonicaliseDocToken(value: string | null | undefined): string | null {
  if (!value) return null;
  const re = /\b(SOP|WI|FRM|POL|REC|DOC)[-_\s]*(?:[A-Za-z]{1,3}[-_\s]+)?(\d{1,4})\b/i;
  const m = value.match(re);
  if (!m) return null;
  return `${m[1].toUpperCase()}-${m[2].padStart(3, '0')}`;
}