export type DesignReviewType = 'phase_end' | 'baseline' | 'ad_hoc' | 'post_market' | 'technical_file';
export type DesignReviewStatus = 'draft' | 'scoping' | 'in_review' | 'closing' | 'completed' | 'cancelled';
export type FindingSeverity = 'minor' | 'major';
export type FindingStatus = 'open' | 'in_progress' | 'closed' | 'deferred';
export type SignatureMeaning = 'approval' | 'review' | 'authorization';
export type SignerRole = 'engineering_lead' | 'quality_manager' | 'independent_reviewer';
export type ParticipantRole = 'chair' | 'reviewer' | 'independent_reviewer' | 'observer' | 'scribe';
export type ManifestObjectType = 'user_need' | 'system_requirement' | 'hazard' | 'test_case' | 'document' | 'software_requirement' | 'hardware_requirement';

export interface DesignReview {
  id: string;
  dr_id: string;
  company_id: string;
  product_id?: string | null;
  review_type: DesignReviewType;
  phase_name?: string | null;
  title: string;
  description?: string | null;
  status: DesignReviewStatus;
  baseline_label?: string | null;
  source_ccr_id?: string | null;
  owner_id: string;
  due_date?: string | null;
  completed_at?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface DesignReviewManifestItem {
  id: string;
  design_review_id: string;
  object_type: ManifestObjectType | string;
  object_id: string;
  object_display_id?: string | null;
  snapshot_data?: Record<string, any>;
  status: 'included' | 'baselined' | 'excluded';
  created_at: string;
}

export interface DesignReviewFinding {
  id: string;
  design_review_id: string;
  finding_id: string;
  object_type?: string | null;
  object_id?: string | null;
  severity: FindingSeverity;
  title: string;
  description: string;
  status: FindingStatus;
  assigned_to?: string | null;
  due_date?: string | null;
  resolution_notes?: string | null;
  closed_at?: string | null;
  closed_by?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DesignReviewSignature {
  id: string;
  design_review_id: string;
  signer_id: string;
  signer_role: SignerRole;
  signature_meaning: SignatureMeaning;
  is_independent: boolean;
  signed_at: string;
  signature_hash?: string | null;
  comments?: string | null;
}

export interface DesignReviewParticipant {
  id: string;
  design_review_id: string;
  user_id: string;
  role: ParticipantRole;
  attended: boolean;
  invited_at: string;
}

export const REVIEW_TYPE_LABELS: Record<DesignReviewType, string> = {
  phase_end: 'Phase-End Review',
  baseline: 'Baseline Review',
  ad_hoc: 'Ad-Hoc Review',
  post_market: 'Post-Market / Change Control',
  technical_file: 'Technical File Review',
};

export const STATUS_LABELS: Record<DesignReviewStatus, string> = {
  draft: 'Draft',
  scoping: 'Scoping',
  in_review: 'In Review',
  closing: 'Closing',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const SIGNER_ROLE_LABELS: Record<SignerRole, string> = {
  engineering_lead: 'Engineering Lead',
  quality_manager: 'Quality Manager',
  independent_reviewer: 'Independent Reviewer',
};

export const PARTICIPANT_ROLE_LABELS: Record<ParticipantRole, string> = {
  chair: 'Chair',
  reviewer: 'Reviewer',
  independent_reviewer: 'Independent Reviewer',
  observer: 'Observer',
  scribe: 'Scribe',
};

/** Format a baseline label for display: "BL-1" → "Baseline 1" */
export function formatBaselineLabel(label: string | null | undefined): string {
  if (!label) return '—';
  const match = label.match(/^BL-(\d+)$/i);
  return match ? `Baseline ${match[1]}` : label;
}

/** @deprecated Use PHASE_GATE_OPTIONS instead — baselines are now embedded in the phase selector */
export interface BaselineDefinition {
  id: string;
  label: string;
  subtitle: string;
  phase: string | null;
  focus: string;
  prerequisite: string;
}

export interface PhaseGateOption {
  /** Value stored in phase_name */
  phase: string;
  /** Display label shown in the dropdown */
  label: string;
  /** If this phase is a baseline gate, the BL-x ID; otherwise null */
  baselineId: string | null;
  /** Informational prerequisite hint shown below the dropdown */
  prerequisite: string | null;
}

/** @deprecated Use dynamic active phases from useCompanyActivePhases instead */
export const PHASE_GATE_OPTIONS: PhaseGateOption[] = [];

export interface TechnicalFileSection {
  /** e.g. "TF-0", "TF-7" */
  id: string;
  /** Section number for display */
  section: string;
  /** Display label */
  label: string;
  /** Focus area */
  focus: string;
  /** MDR/IVDR legal reference */
  legalReference: string;
  /** Tooltip description explaining what this section covers per MDR */
  description: string;
}

export const TECHNICAL_FILE_SECTIONS: TechnicalFileSection[] = [
  { id: 'TF-0', section: '0', label: 'Administrative', focus: 'Certificates, DoC, Basic UDI-DI', legalReference: 'MDR Art. 10 & 19', description: 'Administrative information including EU Declaration of Conformity, certificates issued by Notified Bodies, Basic UDI-DI registration, and general device identification data per MDR Article 10 and 19.' },
  { id: 'TF-1-6', section: '1–6', label: 'Design & Specifications', focus: 'Materials, Manufacturing, V&V', legalReference: 'Annex II', description: 'Device description and specifications (§1), information supplied by the manufacturer (§2), design and manufacturing information (§3), general safety and performance requirements (§4), benefit-risk analysis and risk management (§5), and product verification and validation (§6) per MDR Annex II.' },
  { id: 'TF-7', section: '7', label: 'Risk Management', focus: 'FMEA, Risk/Benefit Analysis', legalReference: 'Annex I & ISO 14971', description: 'Risk management documentation per MDR Annex I General Safety and Performance Requirements and ISO 14971, including hazard identification, risk estimation, risk evaluation, risk control measures, and overall residual risk evaluation.' },
  { id: 'TF-8', section: '8', label: 'Clinical', focus: 'CER, Literature Search', legalReference: 'Annex XIV', description: 'Clinical evaluation and investigation documentation per MDR Annex XIV, including the Clinical Evaluation Report (CER), literature search and appraisal, clinical investigation plans and reports, and PMCF evaluation.' },
  { id: 'TF-9', section: '9', label: 'Post-Market', focus: 'PMS Plan, PMCF Plan, PSUR', legalReference: 'Annex III', description: 'Post-market surveillance documentation per MDR Annex III, including the PMS Plan, Post-Market Clinical Follow-up (PMCF) Plan, Periodic Safety Update Report (PSUR), and trend reporting procedures.' },
];

/** @deprecated Use PHASE_GATE_OPTIONS instead */
export const BASELINE_DEFINITIONS: BaselineDefinition[] = [
  {
    id: 'BL-1',
    label: 'Baseline 1: Concept Review',
    subtitle: 'Identity Lock',
    phase: 'Concept & Planning',
    focus: 'Verifying the identity and business viability of the project.',
    prerequisite: 'Requires: All 26 Genesis Steps completed and signed off.',
  },
  {
    id: 'BL-2',
    label: 'Baseline 2: Design Freeze',
    subtitle: 'Input Lock',
    phase: 'Design Inputs',
    focus: 'Verifying the Design Inputs (UN→SYSR→SWR traceability + signed Risk Analysis).',
    prerequisite: 'Requires: Full requirement traceability + ISO 14971 risk analysis signed.',
  },
  {
    id: 'BL-3',
    label: 'Baseline 3: Validation Review',
    subtitle: 'Product Lock',
    phase: 'Verification & Validation',
    focus: 'Verifying Design Outputs and overall product effectiveness.',
    prerequisite: 'Requires: 100% V&V tests passed + Technical File complete.',
  },
];
