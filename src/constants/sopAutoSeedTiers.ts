/**
 * SOP Auto-Seed Tier Classification
 *
 * Three-tier division of the 51 Xyreg SOPs based on how much company- or
 * device-specific tailoring they require:
 *
 *   Tier A — Universal QMS Boilerplate (auto-create at company onboarding).
 *            Pure ISO 13485 / 21 CFR 820 framework process docs.
 *   Tier B — Pathway-Conditional (auto-create only when applicable framework
 *            is enabled — e.g. EU MDR, manufacturing in scope).
 *   Tier C — Device-Specific (require human authoring per product/process —
 *            never auto-seeded).
 *
 * See `mem://features/sop/tiered-auto-seed-classification` for full rules.
 */

export type SopTrigger =
  | 'always'
  | 'manufacturing'
  | 'eu_mdr'
  | 'eu_mdr_class_iia_plus'
  | 'eu_clinical'
  | 'physical_product';

export interface TierBSop {
  sop: string;
  trigger: SopTrigger;
  reason: string;
}

export interface TierASop {
  sop: string;
  /** Why this SOP qualifies as universal QMS boilerplate. */
  reason: string;
}

/**
 * Tier A — 27 SOPs auto-created when a company is provisioned.
 * Content is identical across companies except for `[Company Name]`
 * substitution handled by `sopPersonalizationPipeline`.
 *
 * Each entry carries a short justification surfaced in Document Control
 * so admins can see at a glance why the SOP was pre-populated.
 */
export const TIER_A_AUTO_SEED: readonly TierASop[] = [
  { sop: 'SOP-001', reason: 'QMS skeleton — ISO 13485 §4 framework, identical for every company' },
  { sop: 'SOP-002', reason: 'Pure document control process — no device specifics' },
  { sop: 'SOP-003', reason: 'Standard ISO 13485 §5.6 management review process' },
  { sop: 'SOP-004', reason: 'Generic HR/training framework (§6.2)' },
  { sop: 'SOP-005', reason: 'Generic design & development planning framework (§7.3.2)' },
  { sop: 'SOP-006', reason: 'Process-only — defines how design inputs are captured, not what they are' },
  { sop: 'SOP-007', reason: 'Process-only — defines how design outputs are captured' },
  { sop: 'SOP-008', reason: 'Process-only — generic design review procedure' },
  { sop: 'SOP-009', reason: 'Generic design V&V framework (§7.3.6–7.3.7) — applies to all medical devices' },
  { sop: 'SOP-011', reason: 'Process-only — generic design change control' },
  { sop: 'SOP-012', reason: 'Structure-only — DHF/Technical Documentation index template' },
  { sop: 'SOP-016', reason: 'Generic supplier evaluation & control workflow (§7.4)' },
  { sop: 'SOP-021', reason: 'Standard complaint handling workflow (§8.2.2)' },
  { sop: 'SOP-022', reason: 'Standard PMS framework, identical across QMS' },
  { sop: 'SOP-023', reason: 'Generic infrastructure & work environment procedure (§6.3–6.4)' },
  { sop: 'SOP-024', reason: 'Generic equipment maintenance & calibration process' },
  { sop: 'SOP-025', reason: 'Generic monitoring & measurement equipment control (§7.6)' },
  { sop: 'SOP-028', reason: 'Standard CAPA framework, identical across QMS' },
  { sop: 'SOP-030', reason: 'Generic purchasing controls (§7.4.1)' },
  { sop: 'SOP-031', reason: 'Generic configuration management procedure' },
  { sop: 'SOP-032', reason: 'Standard nonconforming product control (§8.3)' },
  { sop: 'SOP-033', reason: 'Generic product preservation & storage process' },
  { sop: 'SOP-034', reason: 'Process framework — how submissions are managed, not their content' },
  { sop: 'SOP-035', reason: 'Process framework — Technical File / Design Dossier management' },
  { sop: 'SOP-037', reason: 'Standard Field Safety Corrective Action process' },
  { sop: 'SOP-038', reason: 'Standard vigilance reporting workflow' },
  { sop: 'SOP-042', reason: 'Generic trend analysis & signal detection process' },
  { sop: 'SOP-050', reason: 'Standard ISO 13485 §8.2.4 internal audit process' },
] as const;

/**
 * Tier B — Pathway-conditional. Surfaced via the "Seed Tier B" button in
 * Document Control once the relevant regulatory framework is enabled.
 */
export const TIER_B_CONDITIONAL: readonly TierBSop[] = [
  { sop: 'SOP-010', trigger: 'manufacturing', reason: 'Design Transfer requires manufacturing scope' },
  { sop: 'SOP-013', trigger: 'eu_mdr', reason: 'GSPR — EU MDR Annex I' },
  { sop: 'SOP-014', trigger: 'eu_clinical', reason: 'Clinical Evaluation — EU MDR clinical pathway' },
  { sop: 'SOP-015', trigger: 'always', reason: 'Risk Management ISO 14971 applies to all devices' },
  { sop: 'SOP-017', trigger: 'manufacturing', reason: 'Production & Service Provision — manufacturing in scope' },
  { sop: 'SOP-018', trigger: 'manufacturing', reason: 'Process Validation — manufacturing in scope' },
  { sop: 'SOP-019', trigger: 'always', reason: 'Identification, Traceability, UDI' },
  { sop: 'SOP-020', trigger: 'physical_product', reason: 'Labeling & Packaging — physical product' },
  { sop: 'SOP-036', trigger: 'eu_mdr', reason: 'Classification & Conformity Assessment — EU/UK/CH pathway' },
  { sop: 'SOP-043', trigger: 'manufacturing', reason: 'Incoming Inspection — manufacturing in scope' },
  { sop: 'SOP-044', trigger: 'eu_mdr_class_iia_plus', reason: 'PSUR — EU MDR Class IIa+' },
  { sop: 'SOP-045', trigger: 'always', reason: 'UDI Management' },
  { sop: 'SOP-046', trigger: 'eu_mdr_class_iia_plus', reason: 'Notified Body Interactions — EU MDR Class IIa+ / IVDR' },
  { sop: 'SOP-048', trigger: 'eu_clinical', reason: 'PMCF — EU MDR clinical pathway' },
  { sop: 'SOP-051', trigger: 'manufacturing', reason: 'Batch Record / DHR — manufacturing in scope' },
] as const;

/**
 * Tier C — Device-specific, never auto-seeded. Must be created on demand
 * in Document Studio with real product/process detail.
 */
export const TIER_C_MANUAL: readonly string[] = [
  'SOP-026', // Usability Engineering (IEC 62366-1, product-specific)
  'SOP-027', // Software Development Lifecycle (IEC 62304 tailoring)
  'SOP-029', // Software Validation (tools/systems must be listed)
  'SOP-039', // Sterilization Process Control (method-specific)
  'SOP-040', // Biocompatibility Assessment (materials-specific)
  'SOP-041', // Cleanroom Operations (facility-specific)
  'SOP-047', // Clinical Investigation (study-specific)
  'SOP-049', // Software as Medical Device (SaMD, architecture-specific)
] as const;

export type SopTier = 'A' | 'B' | 'C';

/**
 * Parse a SOP identifier (e.g. "SOP-002") from a free-form document name like
 * "SOP-002 Document Control" or "sop 002 — Document Control". Returns the
 * canonical "SOP-NNN" form, or null if no match is found.
 */
export function parseSopNumber(name: string | null | undefined): string | null {
  if (!name) return null;
  // Tolerate an optional 1–3 letter functional sub-prefix between "SOP" and
  // the numeric id, so sub-prefixed/translated forms like "SOP-QA-002",
  // "SOP-QA-002-NO", or "SOP DE 011" all resolve to the canonical
  // "SOP-NNN" key. See `mem://features/documents/numbering/functional-sub-prefixes`.
  const match = name.match(/SOP[-_\s]*(?:[A-Za-z]{1,3}[-_\s]+)?(\d{1,3})/i);
  if (!match) return null;
  const padded = match[1].padStart(3, '0');
  return `SOP-${padded}`;
}

/**
 * Strip a leading SOP identifier from a document name so we can compare the
 * remaining title across views. Examples:
 *   "SOP-DE-005 Design and Development Planning" -> "Design and Development Planning"
 *   "SOP-005 Design and Development Planning"    -> "Design and Development Planning"
 *   "Quality Management System"                  -> "Quality Management System"
 */
export function stripSopPrefix(name: string | null | undefined): string {
  if (!name) return '';
  return name
    .replace(/^\s*SOP[-_\s]*(?:[A-Za-z]{1,3}[-_\s]*)?\d{1,3}[\s\-\u2014:.]*/i, '')
    .trim();
}

/**
 * Canonical sort key shared by the Template Library and the Company Documents
 * list so both views produce the same order. SOPs come first, ordered by
 * their numeric id (SOP-005 before SOP-011), then non-SOP documents
 * alphabetically by title.
 */
export function getSopSortKey(name: string | null | undefined): {
  bucket: 0 | 1;
  numeric: number;
  title: string;
} {
  const sopKey = parseSopNumber(name);
  const title = stripSopPrefix(name).toLocaleLowerCase();
  if (sopKey) {
    return { bucket: 0, numeric: parseInt(sopKey.replace('SOP-', ''), 10), title };
  }
  return { bucket: 1, numeric: 0, title };
}

/**
 * Comparator built on `getSopSortKey`. Use with `Array#sort` to produce the
 * canonical SOP-then-title order across Templates and Documents views.
 */
export function compareSopDocuments(
  a: string | null | undefined,
  b: string | null | undefined,
): number {
  const ka = getSopSortKey(a);
  const kb = getSopSortKey(b);
  if (ka.bucket !== kb.bucket) return ka.bucket - kb.bucket;
  if (ka.bucket === 0 && ka.numeric !== kb.numeric) return ka.numeric - kb.numeric;
  return ka.title.localeCompare(kb.title, undefined, { sensitivity: 'base' });
}


const TIER_A_SET = new Set(TIER_A_AUTO_SEED.map((s) => s.sop));
const TIER_B_SET = new Set(TIER_B_CONDITIONAL.map((s) => s.sop));
const TIER_C_SET = new Set(TIER_C_MANUAL);

/**
 * Resolve which tier a SOP belongs to. Accepts either the canonical
 * "SOP-NNN" identifier or a full document name; returns null for documents
 * that aren't part of the 51-SOP Xyreg library.
 */
export function getSopTier(
  input: string | null | undefined,
  fallback?: string | null | undefined,
): SopTier | null {
  const sop = parseSopNumber(input) || parseSopNumber(fallback);
  if (!sop) return null;
  if (TIER_A_SET.has(sop)) return 'A';
  if (TIER_B_SET.has(sop)) return 'B';
  if (TIER_C_SET.has(sop)) return 'C';
  return null;
}

/**
 * Map of canonical SOP key (e.g. "SOP-001") → functional sub-prefix code
 * (QA / DE / RM / CL / RA / MF / SC) per Xyreg numbering convention
 * `TYPE-SUBPREFIX-NUMBER` (e.g. "SOP-QA-001"). Display layer only — internal
 * keys remain the legacy two-part `SOP-NNN` form to avoid breaking ~160
 * existing references across training, gap analysis, seeder idempotency, etc.
 * See `mem://features/documents/numbering/functional-sub-prefixes`.
 */
export const SOP_FUNCTIONAL_SUBPREFIX: Readonly<Record<string, string>> = {
  // QA — Quality Assurance
  'SOP-001': 'QA', 'SOP-002': 'QA', 'SOP-003': 'QA', 'SOP-004': 'QA',
  'SOP-021': 'QA', 'SOP-022': 'QA', 'SOP-023': 'QA', 'SOP-024': 'QA',
  'SOP-025': 'QA', 'SOP-028': 'QA', 'SOP-031': 'QA', 'SOP-032': 'QA',
  'SOP-033': 'QA', 'SOP-042': 'QA', 'SOP-050': 'QA',
  // DE — Design / Engineering
  'SOP-005': 'DE', 'SOP-006': 'DE', 'SOP-007': 'DE', 'SOP-008': 'DE',
  'SOP-009': 'DE', 'SOP-011': 'DE', 'SOP-012': 'DE', 'SOP-019': 'DE',
  'SOP-026': 'DE', 'SOP-027': 'DE', 'SOP-029': 'DE', 'SOP-045': 'DE',
  'SOP-049': 'DE',
  // RM — Risk Management
  'SOP-015': 'RM',
  // CL — Clinical
  'SOP-014': 'CL', 'SOP-047': 'CL', 'SOP-048': 'CL',
  // RA — Regulatory Affairs
  'SOP-013': 'RA', 'SOP-034': 'RA', 'SOP-035': 'RA', 'SOP-036': 'RA',
  'SOP-037': 'RA', 'SOP-038': 'RA', 'SOP-044': 'RA', 'SOP-046': 'RA',
  // MF — Manufacturing
  'SOP-010': 'MF', 'SOP-017': 'MF', 'SOP-018': 'MF', 'SOP-020': 'MF',
  'SOP-039': 'MF', 'SOP-040': 'MF', 'SOP-041': 'MF', 'SOP-051': 'MF',
  // SC — Supply Chain
  'SOP-016': 'SC', 'SOP-030': 'SC', 'SOP-043': 'SC',
};

/**
 * Convert a canonical SOP key (e.g. "SOP-016") into the three-part Xyreg
 * display form ("SOP-SC-016"). Falls back to the original input if the SOP
 * is unmapped (custom additions).
 */
export function formatSopDisplayId(sopKey: string): string {
  const sub = SOP_FUNCTIONAL_SUBPREFIX[sopKey];
  if (!sub) return sopKey;
  const num = sopKey.replace(/^SOP-/i, '');
  return `SOP-${sub}-${num}`;
}

/**
 * Return the QA/DE/RM/CL/RA/MF/SC functional sub-prefix for a template/document
 * name (or canonical SOP key). Returns null if the input is not an SOP or is
 * unmapped. Used by filter UIs to allow searching by sub-prefix code.
 */
export function getSopSubPrefix(name: string | null | undefined): string | null {
  const sopKey = parseSopNumber(name ?? '');
  if (!sopKey) return null;
  return SOP_FUNCTIONAL_SUBPREFIX[sopKey] ?? null;
}

/**
 * ISO 13485 clause grouping for SOPs. Used by Document Control breakdowns to
 * organise the Tier A / Tier B SOP lists under their governing standard
 * sections instead of a flat alphabetical grid. Display layer only.
 */
export const SOP_ISO_CLAUSE: Readonly<Record<string, string>> = {
  // §4 QMS / Document Control
  'SOP-001': '§4 Quality Management System',
  'SOP-002': '§4.2 Document Control',
  // §5 Management Responsibility
  'SOP-003': '§5.6 Management Review',
  // §6 Resource Management
  'SOP-004': '§6.2 Human Resources & Training',
  'SOP-023': '§6.3–6.4 Infrastructure & Work Environment',
  'SOP-024': '§6.3–6.4 Infrastructure & Work Environment',
  // §7.3 Design & Development
  'SOP-005': '§7.3 Design & Development',
  'SOP-006': '§7.3 Design & Development',
  'SOP-007': '§7.3 Design & Development',
  'SOP-008': '§7.3 Design & Development',
  'SOP-009': '§7.3 Design & Development',
  'SOP-010': '§7.3 Design & Development',
  'SOP-011': '§7.3 Design & Development',
  'SOP-012': '§7.3 Design & Development',
  'SOP-019': '§7.5.8 Identification & Traceability (UDI)',
  'SOP-045': '§7.5.8 Identification & Traceability (UDI)',
  // §7.4 Purchasing / Supplier Control
  'SOP-016': '§7.4 Purchasing & Supplier Control',
  'SOP-030': '§7.4 Purchasing & Supplier Control',
  'SOP-043': '§7.4 Purchasing & Supplier Control',
  // §7.5 Production & Service Provision
  'SOP-017': '§7.5 Production & Service Provision',
  'SOP-018': '§7.5.6 Process Validation',
  'SOP-020': '§7.5.1 Labelling & Packaging',
  'SOP-031': '§7.5 Configuration / Preservation',
  'SOP-033': '§7.5 Configuration / Preservation',
  'SOP-051': '§7.5 DHR / Batch Records',
  // §7.6 Monitoring & Measuring Equipment
  'SOP-025': '§7.6 Monitoring & Measuring Equipment',
  // Regulatory submissions / Technical Documentation
  'SOP-013': 'Regulatory Submissions & Technical Documentation',
  'SOP-034': 'Regulatory Submissions & Technical Documentation',
  'SOP-035': 'Regulatory Submissions & Technical Documentation',
  'SOP-036': 'Regulatory Submissions & Technical Documentation',
  'SOP-046': 'Regulatory Submissions & Technical Documentation',
  // Clinical
  'SOP-014': 'Clinical Evaluation & Investigation',
  'SOP-047': 'Clinical Evaluation & Investigation',
  'SOP-048': 'Clinical Evaluation & Investigation',
  // ISO 14971 Risk Management
  'SOP-015': 'ISO 14971 Risk Management',
  // §8.2 Monitoring (PMS, complaints, FSCA, vigilance)
  'SOP-021': '§8.2 Monitoring — Complaints, PMS, Vigilance',
  'SOP-022': '§8.2 Monitoring — Complaints, PMS, Vigilance',
  'SOP-037': '§8.2 Monitoring — Complaints, PMS, Vigilance',
  'SOP-038': '§8.2 Monitoring — Complaints, PMS, Vigilance',
  'SOP-042': '§8.2 Monitoring — Complaints, PMS, Vigilance',
  'SOP-044': '§8.2 Monitoring — Complaints, PMS, Vigilance',
  // §8.2.4 Internal Audit
  'SOP-050': '§8.2.4 Internal Audit',
  // §8.3 / 8.5 Nonconforming Product / CAPA
  'SOP-028': '§8.3 / 8.5 Nonconforming Product & CAPA',
  'SOP-032': '§8.3 / 8.5 Nonconforming Product & CAPA',
};

/** Stable ordering of clause headlines used by the breakdown renderer. */
export const SOP_ISO_CLAUSE_ORDER: readonly string[] = [
  '§4 Quality Management System',
  '§4.2 Document Control',
  '§5.6 Management Review',
  '§6.2 Human Resources & Training',
  '§6.3–6.4 Infrastructure & Work Environment',
  '§7.3 Design & Development',
  '§7.4 Purchasing & Supplier Control',
  '§7.5 Production & Service Provision',
  '§7.5.1 Labelling & Packaging',
  '§7.5 Configuration / Preservation',
  '§7.5 DHR / Batch Records',
  '§7.5.6 Process Validation',
  '§7.5.8 Identification & Traceability (UDI)',
  '§7.6 Monitoring & Measuring Equipment',
  'ISO 14971 Risk Management',
  'Regulatory Submissions & Technical Documentation',
  'Clinical Evaluation & Investigation',
  '§8.2 Monitoring — Complaints, PMS, Vigilance',
  '§8.2.4 Internal Audit',
  '§8.3 / 8.5 Nonconforming Product & CAPA',
];

export function getSopIsoClause(sopKey: string): string {
  return SOP_ISO_CLAUSE[sopKey] ?? 'Other / Cross-cutting';
}

/**
 * Rewrite a full document name (e.g. "SOP-016 Generic supplier evaluation…")
 * to use the three-part display ID ("SOP-SC-016 Generic supplier evaluation…").
 * Non-SOP names pass through untouched.
 */
export function formatSopDisplayName(name: string | null | undefined): string {
  if (!name) return '';
  const sopKey = parseSopNumber(name);
  if (!sopKey) return name;
  const displayId = formatSopDisplayId(sopKey);
  if (displayId === sopKey) return name;
  // Replace the leading SOP-NNN token (case-insensitive, allow separators).
  return name.replace(/SOP[-_\s]*\d{1,3}/i, displayId);
}

/**
 * Rewrite EVERY occurrence of a legacy two-part `SOP-NNN` token inside an
 * arbitrary block of text (or HTML) to its three-part display form
 * (`SOP-{SUB}-NNN`). Tokens that are already three-part are left untouched.
 *
 * Used by the SOP content service to upgrade hardcoded references in seeded
 * boilerplate (e.g. References, Records, Procedure sections) without having
 * to rewrite the underlying `sopFullContent` constants.
 */
export function rewriteAllSopTokens(text: string | null | undefined): string {
  if (!text) return '';
  // Match SOP-NNN but NOT SOP-XX-NNN (negative lookahead for "-LETTERS-").
  // Allow 1–3 digits to mirror parseSopNumber's tolerance.
  return text.replace(/\bSOP-(\d{1,3})\b/gi, (match, num) => {
    const key = `SOP-${String(num).padStart(3, '0')}`;
    const sub = SOP_FUNCTIONAL_SUBPREFIX[key];
    if (!sub) return match;
    return `SOP-${sub}-${String(num).padStart(3, '0')}`;
  });
}
