/**
 * One-time (idempotent) backfill: hard-link every Work Instruction CI
 * to its parent SOP via `reference_document_ids`.
 *
 * Resolution rule for a WI document_number:
 *   - 3-part SOP key derived by replacing the leading `WI-` with `SOP-`
 *     and stripping the trailing `-<n>` child index.
 *   - Trailing language suffix (e.g. `-FI`) is preserved so a translated
 *     WI links to the matching translated SOP when one exists.
 *
 * Examples:
 *   WI-QA-001-2        -> SOP-QA-001
 *   WI-QA-002-1-FI     -> SOP-QA-002-FI (fallback: SOP-QA-002)
 *   WI-001-3 (legacy)  -> SOP-001
 */
import { supabase } from '@/integrations/supabase/client';

export interface BackfillResult {
  scanned: number;
  linked: number;
  alreadyLinked: number;
  unresolved: number;
  failed: number;
  unresolvedNumbers: string[];
}

function deriveParentSopNumbers(wiNumber: string): string[] {
  // 3-part with optional language suffix: WI-{SUB}-{NNN}-{n}[-{LANG}]
  const m3 = wiNumber.match(/^WI-([A-Z]+)-(\d{3})-\d+(?:-([A-Z]{2}))?$/);
  if (m3) {
    const [, sub, num, lang] = m3;
    const base = `SOP-${sub}-${num}`;
    return lang ? [`${base}-${lang}`, base] : [base];
  }
  // Legacy 2-part: WI-{NNN}-{n}
  const m2 = wiNumber.match(/^WI-(\d{3})-\d+$/);
  if (m2) return [`SOP-${m2[1]}`];
  return [];
}

export async function backfillWiParentSopLinksForCompany(
  companyId: string,
): Promise<BackfillResult> {
  const result: BackfillResult = {
    scanned: 0,
    linked: 0,
    alreadyLinked: 0,
    unresolved: 0,
    failed: 0,
    unresolvedNumbers: [],
  };
  if (!companyId) return result;

  const { data: wis, error } = await supabase
    .from('phase_assigned_document_template')
    .select('id, document_number, reference_document_ids')
    .eq('company_id', companyId)
    .eq('document_type', 'WI');
  if (error || !wis) {
    console.error('[backfillWiParentSopLinks] failed to load WIs', error);
    return result;
  }

  // Build a number -> id map of all SOP CIs for this company in one query.
  const { data: sops } = await supabase
    .from('phase_assigned_document_template')
    .select('id, document_number')
    .eq('company_id', companyId)
    .eq('document_type', 'SOP');
  const sopByNumber = new Map<string, string>();
  for (const s of (sops ?? []) as { id: string; document_number: string | null }[]) {
    if (s.document_number) sopByNumber.set(s.document_number, s.id);
  }

  for (const wi of wis as { id: string; document_number: string | null; reference_document_ids: string[] | null }[]) {
    result.scanned += 1;
    const num = wi.document_number ?? '';
    const candidates = deriveParentSopNumbers(num);
    const parentId = candidates.map((c) => sopByNumber.get(c)).find((v): v is string => Boolean(v));
    if (!parentId) {
      result.unresolved += 1;
      result.unresolvedNumbers.push(num);
      continue;
    }
    const current = Array.isArray(wi.reference_document_ids) ? wi.reference_document_ids : [];
    if (current.includes(parentId)) {
      result.alreadyLinked += 1;
      continue;
    }
    const { error: updErr } = await supabase
      .from('phase_assigned_document_template')
      .update({ reference_document_ids: [...current, parentId] } as never)
      .eq('id', wi.id);
    if (updErr) {
      result.failed += 1;
      console.warn('[backfillWiParentSopLinks] update failed', wi.id, updErr);
    } else {
      result.linked += 1;
    }
  }
  return result;
}