import { supabase } from '@/integrations/supabase/client';
import { NoPhaseService } from './noPhaseService';
import { seedSingleSopForCompany } from './sopAutoSeedService';

/**
 * Map a reference prefix (the letters before the dash in e.g. "TEMP-005") to
 * the canonical document_type value used by the rest of the platform. Mirrors
 * the prefix vocabulary used elsewhere (Settings → Prefixes & Document
 * Numbering) so the auto-detected references stay in lockstep with the
 * existing document registry.
 */
export const REFERENCE_PREFIX_TO_TYPE: Record<string, string> = {
  SOP: 'SOP',
  TEMP: 'Template',
  TMPL: 'Template',
  FRM: 'Form',
  FORM: 'Form',
  POL: 'Policy',
  WI: 'Work Instruction',
  REF: 'Reference',
  CHK: 'Checklist',
};

export const REFERENCE_PREFIXES = Object.keys(REFERENCE_PREFIX_TO_TYPE);

/**
 * Extract the canonical SOP number from any refCode variant.
 *   "SOP-015"        -> "SOP-015"
 *   "SOP-RM-015"     -> "SOP-015"
 *   "sop-rm-015"     -> "SOP-015"
 * Returns null if the refCode does not encode an SOP number.
 */
export function extractCanonicalSopKey(refCode: string): string | null {
  if (!refCode) return null;
  const m = refCode.toUpperCase().match(/SOP(?:-[A-Z]{2,4})?-(\d{3,4})/);
  if (!m) return null;
  return `SOP-${m[1]}`;
}

export interface MatchingDefaultTemplate {
  id: string;
  name: string;
  document_type: string | null;
  description: string | null;
  template_category?: string | null;
}

/**
 * Look up a matching row in `default_document_templates` for a given refCode.
 * Tries (in order):
 *   1. Exact name match on the refCode
 *   2. SOP-number match (handles sub-prefix variants like SOP-RM-015 → SOP-015)
 */
export async function findDefaultTemplateForRefCode(
  refCode: string,
): Promise<MatchingDefaultTemplate | null> {
  const trimmed = refCode.trim();
  if (!trimmed) return null;

  // 1) Exact prefix match on the name (covers "SOP-RM-015 …" if the registry stores it that way).
  const { data: exact } = await supabase
    .from('default_document_templates')
    .select('id, name, document_type, description, template_category')
    .ilike('name', `${trimmed}%`)
    .limit(1);
  if (exact && exact.length > 0) return exact[0] as MatchingDefaultTemplate;

  // 2) Canonical SOP-number match.
  const sopKey = extractCanonicalSopKey(trimmed);
  if (sopKey) {
    const { data: bySop } = await supabase
      .from('default_document_templates')
      .select('id, name, document_type, description, template_category')
      .ilike('name', `${sopKey}%`)
      .limit(1);
    if (bySop && bySop.length > 0) return bySop[0] as MatchingDefaultTemplate;
  }

  return null;
}

/**
 * Seed a missing reference from a default template. For SOP refCodes this
 * delegates to `seedSingleSopForCompany`, reusing the canonical seeding
 * pipeline (CI + Studio draft + `[Company Name]` personalization) used at
 * company onboarding.
 *
 * Returns minimal identity info so the caller can flip the reference chip
 * from "missing" to "linked" without a reload.
 */
export async function seedReferenceDocumentFromTemplate(
  companyId: string,
  companyName: string,
  refCode: string,
): Promise<CreateReferenceDocumentResult | null> {
  const sopKey = extractCanonicalSopKey(refCode);
  if (!sopKey) return null;
  const result = await seedSingleSopForCompany(companyId, companyName, sopKey);
  // sopAutoSeedService returns a result without the inserted row id; re-query
  // the registry by sop number to obtain the CI / draft id we need to dispatch
  // the open-document event.
  const { data: row } = await supabase
    .from('phase_assigned_document_template')
    .select('id, name, document_reference, document_type')
    .eq('company_id', companyId)
    .ilike('name', `${sopKey}%`)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!row) return null;

  try {
    window.dispatchEvent(
      new CustomEvent('xyreg:reference-doc-created', {
        detail: { companyId, refCode, name: row.name, docId: row.id },
      }),
    );
  } catch { /* noop */ }

  return {
    id: row.id,
    name: row.name || refCode,
    document_reference: row.document_reference || refCode,
    document_type: row.document_type || 'SOP',
  };
}

export interface CreateReferenceDocumentInput {
  /** "SOP-008", "TEMP-005", … */
  refCode: string;
  /** Human title — e.g. "Design Plan Template". Falls back to refCode. */
  title?: string;
  /** Override the auto-inferred document type. */
  documentType?: string;
}

export interface CreateReferenceDocumentResult {
  id: string;
  name: string;
  document_reference: string;
  document_type: string;
}

/**
 * Insert a stub company-scoped document so that an auto-detected reference
 * (e.g. "SOP-008 Document Control") becomes resolvable. The row uses the
 * "No Phase" company phase as its parent — same convention used everywhere
 * else for company-level documents.
 *
 * Returns the inserted row's identity fields. Throws on insert failure.
 */
export async function createReferenceDocument(
  companyId: string,
  input: CreateReferenceDocumentInput,
): Promise<CreateReferenceDocumentResult> {
  if (!companyId) throw new Error('companyId is required');
  const refCode = input.refCode.trim();
  if (!refCode) throw new Error('refCode is required');

  const prefix = (refCode.split('-')[0] || '').toUpperCase();
  const documentType =
    input.documentType?.trim() || REFERENCE_PREFIX_TO_TYPE[prefix] || 'Document';

  // Compose the row name as "<refCode> <title>" so it lines up with how the
  // rest of the registry displays SOPs (e.g. "SOP-008 Document Control").
  const cleanTitle = (input.title || '').trim();
  const name = cleanTitle ? `${refCode} ${cleanTitle}` : refCode;

  // Resolve the company's "No Phase" id — required because phase_id is NOT NULL.
  const phaseId = await NoPhaseService.getNoPhaseId(companyId);
  if (!phaseId) {
    throw new Error('Could not resolve "No Phase" for this company');
  }

  const { data, error } = await supabase
    .from('phase_assigned_document_template')
    .insert({
      company_id: companyId,
      phase_id: phaseId,
      name,
      document_reference: refCode,
      document_number: refCode,
      document_type: documentType,
      document_scope: 'company_document' as const,
      status: 'Draft',
      is_excluded: false,
      product_id: null,
    })
    .select('id, name, document_reference, document_type')
    .single();

  if (error || !data) {
    throw error || new Error('Failed to create reference document');
  }

  // Notify any open editors so they can flip matching reference chips from
  // "missing" to "linked" without a full reload.
  try {
    window.dispatchEvent(
      new CustomEvent('xyreg:reference-doc-created', {
        detail: {
          companyId,
          refCode,
          name: data.name,
          docId: data.id,
        },
      }),
    );
  } catch {
    /* noop — non-browser env */
  }

  return {
    id: data.id,
    name: data.name || name,
    document_reference: data.document_reference || refCode,
    document_type: data.document_type || documentType,
  };
}