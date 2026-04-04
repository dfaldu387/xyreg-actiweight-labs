
// CAPA (Corrective and Preventive Action) Type Definitions

// CAPA Status State Machine
export type CAPAStatus = 
  | 'draft'
  | 'triage' 
  | 'investigation'
  | 'planning'
  | 'implementation'
  | 'verification'
  | 'closed'
  | 'rejected';

// CAPA Type Classification
export type CAPAType = 'correction' | 'corrective' | 'preventive' | 'both';

// Source Types (Intake Engine)
export type CAPASourceType = 
  | 'complaint'
  | 'audit'
  | 'ncr'
  | 'pms_event'
  | 'defect'
  | 'internal'
  | 'supplier';

// RCA Methodology Options
export type RCAMethodology = '5_whys' | 'fishbone' | 'fta' | 'pareto' | 'other';

// Root Cause Categories
export type RootCauseCategory = 
  | 'process'
  | 'human_error'
  | 'material'
  | 'design'
  | 'equipment'
  | 'environment';

// VoE Result Options
export type VoEResult = 'pending' | 'pass' | 'fail';

// Action Status
export type CAPAActionStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'overdue'
  | 'cancelled';

// Action Type
export type CAPAActionType = 'correction' | 'corrective' | 'preventive';

// Evidence Type
export type CAPAEvidenceType = 'rca' | 'action_completion' | 'voe' | 'other';

import { RCAData, CombinedRCAData, ProblemComplexity } from './rcaData';

// Re-export ProblemComplexity for convenience
export type { ProblemComplexity } from './rcaData';

// Main CAPA Record Interface
export interface CAPARecord {
  id: string;
  capa_id: string; // Auto-generated: CAPA-2026-001
  
  // Ownership
  company_id: string;
  product_id: string | null;
  
  // Source Tracking (The Helix Link)
  source_type: CAPASourceType;
  source_id: string | null;
  source_device_id: string | null; // For device escalation - links to product
  source_node_id: string | null; // For device escalation - links to helix node
  
  // CAPA Classification
  capa_type: CAPAType;
  
  // Problem Definition
  problem_description: string;
  immediate_correction: string | null;
  
  // Risk Assessment
  severity: number | null; // 1-5
  probability: number | null; // 1-5
  
  // State Machine
  status: CAPAStatus;
  
  // Workflow Fields
  owner_id: string | null;
  quality_lead_id: string | null;
  technical_lead_id: string | null;
  
  // Investigation
  investigation_team: string[]; // User IDs
  problem_complexity: ProblemComplexity | null; // Problem classification for RCA guidance
  rca_methodology: RCAMethodology | null; // Legacy single methodology (backward compat)
  rca_methodologies: RCAMethodology[]; // Multiple methodologies support
  rca_recommendation_followed: boolean | null; // Did user follow AI recommendation?
  rca_override_reason: string | null; // Justification if recommendation not followed
  rca_data: RCAData | CombinedRCAData | null; // Structured RCA analysis data
  root_cause_summary: string | null;
  root_cause_category: RootCauseCategory | null;
  
  // Regulatory Impact (Helix Sync)
  requires_regulatory_update: boolean;
  regulatory_impact_description: string | null;
  affected_documents: string[]; // Document IDs
  affected_requirements: string[]; // Requirement IDs
  
  // Verification of Effectiveness (VoE)
  voe_plan: string | null;
  voe_success_criteria: string | null;
  voe_result: VoEResult | null;
  voe_evidence_ids: string[]; // Evidence file IDs
  voe_completion_date: string | null;
  voe_verified_by: string | null;
  
  // Closure
  closure_date: string | null;
  closed_by: string | null;
  closure_comments: string | null;
  
  // Approval tracking
  technical_approved: boolean;
  technical_approved_by: string | null;
  technical_approved_at: string | null;
  
  quality_approved: boolean;
  quality_approved_by: string | null;
  quality_approved_at: string | null;
  
  // Due Dates
  target_investigation_date: string | null;
  target_implementation_date: string | null;
  target_verification_date: string | null;
  target_closure_date: string | null;
  
  // Metadata
  created_by: string;
  created_at: string;
  updated_at: string;
}

// CAPA Action Interface
export interface CAPAAction {
  id: string;
  capa_id: string;
  action_type: CAPAActionType;
  description: string;
  assigned_to: string | null;
  due_date: string | null;
  completed_date: string | null;
  status: CAPAActionStatus;
  completion_evidence: string | null;
  created_at: string;
  updated_at: string;
}

// CAPA Evidence Interface
export interface CAPAEvidence {
  id: string;
  capa_id: string;
  evidence_type: CAPAEvidenceType;
  file_name: string;
  storage_path: string;
  description: string | null;
  uploaded_by: string | null;
  created_at: string;
}

// CAPA State Transition (Audit Trail)
export interface CAPAStateTransition {
  id: string;
  capa_id: string;
  from_status: CAPAStatus | null;
  to_status: CAPAStatus;
  transitioned_by: string;
  transition_reason: string | null;
  digital_signature: string | null; // 21 CFR Part 11 compliance
  created_at: string;
}

// Create CAPA Input
export interface CreateCAPAInput {
  company_id: string;
  product_id?: string | null;
  source_type: CAPASourceType;
  source_id?: string | null;
  capa_type: CAPAType;
  problem_description: string;
  immediate_correction?: string | null;
  severity?: number | null;
  probability?: number | null;
  owner_id?: string | null;
  quality_lead_id?: string | null;
  technical_lead_id?: string | null;
}

// Update CAPA Input
export interface UpdateCAPAInput {
  id: string;
  problem_description?: string;
  immediate_correction?: string | null;
  severity?: number | null;
  probability?: number | null;
  owner_id?: string | null;
  quality_lead_id?: string | null;
  technical_lead_id?: string | null;
  investigation_team?: string[];
  problem_complexity?: ProblemComplexity | null;
  rca_methodology?: RCAMethodology | null;
  rca_methodologies?: RCAMethodology[];
  rca_recommendation_followed?: boolean | null;
  rca_override_reason?: string | null;
  rca_data?: RCAData | CombinedRCAData | null;
  root_cause_summary?: string | null;
  root_cause_category?: RootCauseCategory | null;
  requires_regulatory_update?: boolean;
  regulatory_impact_description?: string | null;
  affected_documents?: string[];
  affected_requirements?: string[];
  voe_plan?: string | null;
  voe_success_criteria?: string | null;
  voe_result?: VoEResult | null;
  closure_comments?: string | null;
  target_investigation_date?: string | null;
  target_implementation_date?: string | null;
  target_verification_date?: string | null;
  target_closure_date?: string | null;
}

// CAPA with related data (for list views)
export interface CAPARecordWithRelations extends CAPARecord {
  owner?: { id: string; full_name: string } | null;
  quality_lead?: { id: string; full_name: string } | null;
  technical_lead?: { id: string; full_name: string } | null;
  actions?: CAPAAction[];
  evidence_count?: number;
  company?: { id: string; name: string } | null;
  product?: { id: string; name: string } | null;
}

// CAPA Analytics Interface
export interface CAPAAnalytics {
  total_capas: number;
  by_status: Record<CAPAStatus, number>;
  by_type: Record<CAPAType, number>;
  by_source: Record<CAPASourceType, number>;
  open_count: number;
  overdue_count: number;
  average_closure_time_days: number;
  aging_data: Array<{
    capa_id: string;
    days_open: number;
    status: CAPAStatus;
  }>;
  trending_data: Array<{
    date: string;
    opened: number;
    closed: number;
  }>;
  risk_distribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

// State Machine Gate Rules
export interface CAPAGateRule {
  from: CAPAStatus | CAPAStatus[];
  to: CAPAStatus;
  required_fields?: (keyof CAPARecord)[];
  required_approvals?: ('technical' | 'quality')[];
  validation_message: string;
}

// CAPA Gate Rules Configuration
export const CAPA_GATE_RULES: CAPAGateRule[] = [
  {
    from: 'draft',
    to: 'triage',
    required_fields: ['problem_description', 'source_type'],
    validation_message: 'Problem description and source must be defined before triage'
  },
  {
    from: 'triage',
    to: 'investigation',
    required_fields: ['severity', 'probability'],
    validation_message: 'Risk assessment (severity and probability) must be complete'
  },
  {
    from: 'triage',
    to: 'closed',
    validation_message: 'Can only close from triage if marked as correction-only'
  },
  {
    from: 'investigation',
    to: 'planning',
    required_fields: ['root_cause_summary', 'rca_methodology'],
    required_approvals: ['technical'],
    validation_message: 'RCA must be complete with technical lead approval'
  },
  {
    from: 'planning',
    to: 'implementation',
    required_approvals: ['quality'],
    validation_message: 'Actions must be defined with quality lead approval'
  },
  {
    from: 'implementation',
    to: 'verification',
    validation_message: 'All actions must be marked complete before verification'
  },
  {
    from: 'verification',
    to: 'closed',
    required_fields: ['voe_result'],
    required_approvals: ['quality'],
    validation_message: 'VoE must pass with quality lead signature'
  }
];

// Utility: Calculate Risk Level
export function calculateRiskLevel(severity: number | null, probability: number | null): 'critical' | 'high' | 'medium' | 'low' | null {
  if (severity === null || probability === null) return null;
  const score = severity * probability;
  if (score >= 15) return 'critical';
  if (score >= 10) return 'high';
  if (score >= 5) return 'medium';
  return 'low';
}

// Utility: Get Risk Score
export function getRiskScore(severity: number | null, probability: number | null): number | null {
  if (severity === null || probability === null) return null;
  return severity * probability;
}

// CAPA Status Display Labels
export const CAPA_STATUS_LABELS: Record<CAPAStatus, string> = {
  draft: 'Draft',
  triage: 'Triage',
  investigation: 'Investigation',
  planning: 'Planning',
  implementation: 'Implementation',
  verification: 'Verification',
  closed: 'Closed',
  rejected: 'Rejected'
};

// CAPA Status Colors (for UI)
export const CAPA_STATUS_COLORS: Record<CAPAStatus, string> = {
  draft: 'gray',
  triage: 'yellow',
  investigation: 'blue',
  planning: 'purple',
  implementation: 'orange',
  verification: 'cyan',
  closed: 'green',
  rejected: 'red'
};

// CAPA Source Labels
export const CAPA_SOURCE_LABELS: Record<CAPASourceType, string> = {
  complaint: 'Customer Complaint',
  audit: 'Audit Finding',
  ncr: 'Non-Conformance Report',
  pms_event: 'PMS Event',
  defect: 'V&V Defect',
  internal: 'Internal Observation',
  supplier: 'Supplier Issue'
};

// RCA Methodology Labels
export const RCA_METHODOLOGY_LABELS: Record<RCAMethodology, string> = {
  '5_whys': '5 Whys Analysis',
  fishbone: 'Fishbone (Ishikawa) Diagram',
  fta: 'Fault Tree Analysis',
  pareto: 'Pareto Analysis',
  other: 'Other Method'
};

// State Machine Gates - defines valid transitions
export const CAPA_STATE_GATES: Record<CAPAStatus, CAPAStatus[]> = {
  draft: ['triage'],
  triage: ['investigation', 'closed', 'rejected'],
  investigation: ['planning', 'triage'],
  planning: ['implementation', 'investigation'],
  implementation: ['verification', 'planning'],
  verification: ['closed', 'implementation'],
  closed: [],
  rejected: []
};
