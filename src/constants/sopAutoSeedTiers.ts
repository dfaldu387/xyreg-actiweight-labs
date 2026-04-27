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
  { sop: 'SOP-009', trigger: 'always', reason: 'Design V&V applies to all medical devices' },
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
  const match = name.match(/SOP[-_\s]*(\d{1,3})/i);
  if (!match) return null;
  const padded = match[1].padStart(3, '0');
  return `SOP-${padded}`;
}

const TIER_A_SET = new Set(TIER_A_AUTO_SEED.map((s) => s.sop));
const TIER_B_SET = new Set(TIER_B_CONDITIONAL.map((s) => s.sop));
const TIER_C_SET = new Set(TIER_C_MANUAL);

/**
 * Resolve which tier a SOP belongs to. Accepts either the canonical
 * "SOP-NNN" identifier or a full document name; returns null for documents
 * that aren't part of the 51-SOP Xyreg library.
 */
export function getSopTier(input: string | null | undefined): SopTier | null {
  const sop = parseSopNumber(input);
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
