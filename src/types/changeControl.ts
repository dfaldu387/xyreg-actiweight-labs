// Change Control Request (CCR) Type Definitions

// CCR Status State Machine
export type CCRStatus = 
  | 'draft'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'implemented'
  | 'verified'
  | 'closed';

// CCR Source Types
export type CCRSourceType = 
  | 'capa'
  | 'design_review'
  | 'regulatory'
  | 'audit'
  | 'pms_event'
  | 'other';

// Change Type Classification
export type ChangeType = 
  | 'design'
  | 'process'
  | 'document'
  | 'supplier'
  | 'software'
  | 'labeling';

// Risk Impact Level
export type RiskImpact = 'none' | 'low' | 'medium' | 'high';

// Main Change Control Request Interface
export interface ChangeControlRequest {
  id: string;
  ccr_id: string; // Auto-generated: CCR-2026-0001
  
  // Ownership
  company_id: string;
  product_id: string | null;
  
  // Target Object (for baseline change requests)
  target_object_id: string | null;
  target_object_type: string | null;
  
  // Source Linking
  source_type: CCRSourceType;
  source_capa_id: string | null;
  source_reference: string | null;
  
  // Change Details
  change_type: ChangeType;
  title: string;
  description: string;
  justification: string | null;
  
  // Impact Assessment
  risk_impact: RiskImpact;
  regulatory_impact: boolean;
  regulatory_impact_description: string | null;
  cost_impact: number | null;
  
  // Affected Items
  affected_documents: string[];
  affected_requirements: string[];
  affected_specifications: string[];
  
  // Workflow
  status: CCRStatus;
  owner_id: string | null;
  
  // Approval Tracking
  technical_approved: boolean;
  technical_approved_by: string | null;
  technical_approved_at: string | null;
  
  quality_approved: boolean;
  quality_approved_by: string | null;
  quality_approved_at: string | null;
  
  regulatory_approved: boolean;
  regulatory_approved_by: string | null;
  regulatory_approved_at: string | null;

  // Reviewer Assignments (chosen at submit-for-review time)
  technical_reviewer_id: string | null;
  quality_reviewer_id: string | null;
  regulatory_reviewer_id: string | null;
  
  // Implementation Tracking
  implementation_plan: string | null;
  implementation_notes: string | null;
  verification_plan: string | null;
  verification_evidence: string | null;
  
  // Dates
  target_implementation_date: string | null;
  implemented_date: string | null;
  implemented_by: string | null;
  verified_date: string | null;
  verified_by: string | null;
  closed_date: string | null;
  closed_by: string | null;
  
  // Metadata
  created_by: string;
  created_at: string;
  updated_at: string;
}

// CCR State Transition (Audit Trail)
export interface CCRStateTransition {
  id: string;
  ccr_id: string;
  from_status: CCRStatus | null;
  to_status: CCRStatus;
  transitioned_by: string;
  transition_reason: string | null;
  digital_signature: string | null;
  created_at: string;
}

// Create CCR Input
export interface CreateCCRInput {
  company_id: string;
  product_id?: string | null;
  target_object_id?: string | null;
  target_object_type?: string | null;
  source_type: CCRSourceType;
  source_capa_id?: string | null;
  source_reference?: string | null;
  change_type: ChangeType;
  title: string;
  description: string;
  justification?: string | null;
  risk_impact?: RiskImpact;
  regulatory_impact?: boolean;
  owner_id?: string | null;
  target_implementation_date?: string | null;
  /** Optional list of document IDs that this CCR will affect (bulk creation). */
  affected_documents?: string[];
}

// Update CCR Input
export interface UpdateCCRInput {
  id: string;
  title?: string;
  description?: string;
  justification?: string | null;
  change_type?: ChangeType;
  risk_impact?: RiskImpact;
  regulatory_impact?: boolean;
  regulatory_impact_description?: string | null;
  cost_impact?: number | null;
  affected_documents?: string[];
  affected_requirements?: string[];
  affected_specifications?: string[];
  owner_id?: string | null;
  implementation_plan?: string | null;
  implementation_notes?: string | null;
  verification_plan?: string | null;
  verification_evidence?: string | null;
  target_implementation_date?: string | null;
  // Approval tracking (set via approval action)
  technical_approved?: boolean;
  technical_approved_by?: string | null;
  technical_approved_at?: string | null;
  quality_approved?: boolean;
  quality_approved_by?: string | null;
  quality_approved_at?: string | null;
  regulatory_approved?: boolean;
  regulatory_approved_by?: string | null;
  regulatory_approved_at?: string | null;
  // Reviewer assignments
  technical_reviewer_id?: string | null;
  quality_reviewer_id?: string | null;
  regulatory_reviewer_id?: string | null;
}

// CCR with related data
export interface CCRWithRelations extends ChangeControlRequest {
  owner?: { id: string; full_name: string } | null;
  source_capa?: { id: string; capa_id: string; problem_description: string } | null;
  company?: { id: string; name: string } | null;
  product?: { id: string; name: string } | null;
}

// CCR Analytics
export interface CCRAnalytics {
  total_ccrs: number;
  by_status: Record<CCRStatus, number>;
  by_change_type: Record<ChangeType, number>;
  by_source: Record<CCRSourceType, number>;
  open_count: number;
  pending_approval_count: number;
  average_cycle_time_days: number;
}

// State Machine Gates
export const CCR_STATE_GATES: Record<CCRStatus, CCRStatus[]> = {
  draft: ['under_review'],
  under_review: ['approved', 'rejected', 'draft'],
  approved: ['implemented', 'under_review'],
  rejected: [],
  implemented: ['verified', 'approved'],
  verified: ['closed', 'implemented'],
  closed: []
};

// CCR Status Labels
export const CCR_STATUS_LABELS: Record<CCRStatus, string> = {
  draft: 'Draft',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  implemented: 'Implemented',
  verified: 'Verified',
  closed: 'Closed'
};

// CCR Status Colors
export const CCR_STATUS_COLORS: Record<CCRStatus, string> = {
  draft: 'gray',
  under_review: 'yellow',
  approved: 'blue',
  rejected: 'red',
  implemented: 'purple',
  verified: 'cyan',
  closed: 'green'
};

// Change Type Labels
export const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
  design: 'Design Change',
  process: 'Process Change',
  document: 'Document Change',
  supplier: 'Supplier Change',
  software: 'Software Change',
  labeling: 'Labeling Change'
};

// Source Type Labels
export const CCR_SOURCE_LABELS: Record<CCRSourceType, string> = {
  capa: 'CAPA',
  design_review: 'Design Review',
  regulatory: 'Regulatory Update',
  audit: 'Audit Finding',
  pms_event: 'PMS Event',
  other: 'Other'
};

// Risk Impact Labels
export const RISK_IMPACT_LABELS: Record<RiskImpact, string> = {
  none: 'None',
  low: 'Low',
  medium: 'Medium',
  high: 'High'
};
