// Incoming Inspection Module Type Definitions — ISO 13485 §7.4.3

// Status State Machine
export type InspectionStatus = 'draft' | 'in_progress' | 'pending_review' | 'completed' | 'cancelled';

// Disposition
export type InspectionDisposition = 'pending' | 'accepted' | 'rejected' | 'conditional_accept';

// Sampling Plan Type
export type SamplingPlanType = 'aql' | 'hundred_percent' | 'skip_lot' | 'custom';

// Main Inspection Record
export interface InspectionRecord {
  id: string;
  inspection_id: string;
  company_id: string;
  product_id: string | null;
  supplier_id: string | null;
  purchase_order_number: string | null;
  lot_batch_number: string | null;
  material_description: string | null;
  quantity_received: number | null;
  quantity_inspected: number | null;
  quantity_accepted: number | null;
  quantity_rejected: number | null;
  sampling_plan_type: SamplingPlanType;
  aql_level: string | null;
  status: InspectionStatus;
  disposition: InspectionDisposition;
  disposition_notes: string | null;
  coc_received: boolean;
  coc_reference: string | null;
  inspector_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  linked_nc_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Inspection Line Item
export interface InspectionItem {
  id: string;
  inspection_id: string;
  check_name: string;
  specification: string | null;
  measured_value: string | null;
  unit: string | null;
  result: 'pass' | 'fail' | 'na' | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// State Transition (Audit Trail)
export interface InspectionTransition {
  id: string;
  inspection_id: string;
  from_status: InspectionStatus | null;
  to_status: InspectionStatus;
  transitioned_by: string;
  transition_reason: string | null;
  created_at: string;
}

// Evidence
export interface InspectionEvidence {
  id: string;
  inspection_id: string;
  evidence_type: string;
  file_name: string;
  storage_path: string;
  description: string | null;
  uploaded_by: string | null;
  created_at: string;
}

// State Machine Gates
export const INSPECTION_STATE_GATES: Record<InspectionStatus, InspectionStatus[]> = {
  draft: ['in_progress', 'cancelled'],
  in_progress: ['pending_review', 'draft', 'cancelled'],
  pending_review: ['completed', 'in_progress'],
  completed: [],
  cancelled: [],
};

// Display Labels
export const INSPECTION_STATUS_LABELS: Record<InspectionStatus, string> = {
  draft: 'Draft',
  in_progress: 'In Progress',
  pending_review: 'Pending Review',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const INSPECTION_DISPOSITION_LABELS: Record<InspectionDisposition, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  conditional_accept: 'Conditional Accept',
};

export const SAMPLING_PLAN_LABELS: Record<SamplingPlanType, string> = {
  aql: 'AQL-Based',
  hundred_percent: '100% Inspection',
  skip_lot: 'Skip-Lot',
  custom: 'Custom',
};

export const INSPECTION_STATUS_COLORS: Record<InspectionStatus, string> = {
  draft: 'gray',
  in_progress: 'blue',
  pending_review: 'orange',
  completed: 'green',
  cancelled: 'red',
};

export const INSPECTION_DISPOSITION_COLORS: Record<InspectionDisposition, string> = {
  pending: 'gray',
  accepted: 'green',
  rejected: 'red',
  conditional_accept: 'orange',
};
