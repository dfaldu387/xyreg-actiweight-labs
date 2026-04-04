// Nonconformity (NC) Module Type Definitions — ISO 13485 Clause 8.3

import { RCAData, CombinedRCAData } from './rcaData';
import { RCAMethodology } from './capa';

// NC Status State Machine
export type NCStatus = 'open' | 'investigation' | 'disposition' | 'verification' | 'closed';

// NC Source Types
export type NCSourceType =
  | 'production'
  | 'incoming_inspection'
  | 'design_review'
  | 'pms'
  | 'audit'
  | 'supplier'
  | 'internal';

// NC Severity
export type NCSeverity = 'critical' | 'major' | 'minor';

// NC Disposition Options
export type NCDisposition = 'scrap' | 'rework' | 'concession' | 'return_to_supplier';

// Root Cause Category (for trending)
export type NCRootCauseCategory =
  | 'design'
  | 'supplier'
  | 'process_sop'
  | 'training'
  | 'material'
  | 'equipment'
  | 'environment'
  | 'unknown';

// NC Evidence Type
export type NCEvidenceType = 'photo' | 'inspection_report' | 'rca' | 'disposition' | 'other';

// Main NC Record Interface
export interface NCRecord {
  id: string;
  nc_id: string;
  company_id: string;
  product_id: string | null;
  source_type: NCSourceType;
  source_id: string | null;
  title: string;
  description_is: string;
  description_should_be: string;
  status: NCStatus;
  disposition: NCDisposition | null;
  disposition_justification: string | null;
  severity: NCSeverity | null;
  batch_lot_number: string | null;
  serial_number: string | null;
  affected_field_ids: string[];
  affected_requirement_ids: string[];
  rca_methodology: RCAMethodology | null;
  rca_methodologies: RCAMethodology[];
  rca_data: RCAData | CombinedRCAData | null;
  root_cause_summary: string | null;
  root_cause_category: NCRootCauseCategory | null;
  linked_capa_id: string | null;
  linked_ccr_id: string | null;
  owner_id: string | null;
  quality_approved_by: string | null;
  quality_approved_at: string | null;
  target_disposition_date: string | null;
  target_verification_date: string | null;
  target_closure_date: string | null;
  closed_by: string | null;
  closure_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// NC State Transition (Audit Trail)
export interface NCStateTransition {
  id: string;
  nc_id: string;
  from_status: NCStatus | null;
  to_status: NCStatus;
  transitioned_by: string;
  transition_reason: string | null;
  digital_signature: string | null;
  created_at: string;
}

// NC Evidence
export interface NCEvidence {
  id: string;
  nc_id: string;
  evidence_type: NCEvidenceType;
  file_name: string;
  storage_path: string;
  description: string | null;
  uploaded_by: string | null;
  created_at: string;
}

// State Machine Gates — valid transitions
export const NC_STATE_GATES: Record<NCStatus, NCStatus[]> = {
  open: ['investigation', 'closed'],
  investigation: ['disposition', 'open'],
  disposition: ['verification', 'investigation'],
  verification: ['closed', 'disposition'],
  closed: [],
};

// Gate Rules
export interface NCGateRule {
  from: NCStatus | NCStatus[];
  to: NCStatus;
  required_fields?: (keyof NCRecord)[];
  validation_message: string;
}

export const NC_GATE_RULES: NCGateRule[] = [
  {
    from: 'open',
    to: 'investigation',
    required_fields: ['title', 'description_is', 'description_should_be'],
    validation_message: 'Title and "Is" / "Should Be" descriptions are required',
  },
  {
    from: 'investigation',
    to: 'disposition',
    required_fields: ['root_cause_summary'],
    validation_message: 'Root cause summary must be completed before disposition',
  },
  {
    from: 'disposition',
    to: 'verification',
    required_fields: ['disposition'],
    validation_message: 'A disposition decision must be selected',
  },
  {
    from: 'verification',
    to: 'closed',
    validation_message: 'Verification evidence must be provided',
  },
];

// Display Labels
export const NC_STATUS_LABELS: Record<NCStatus, string> = {
  open: 'Open',
  investigation: 'Investigation',
  disposition: 'Disposition',
  verification: 'Verification',
  closed: 'Closed',
};

export const NC_STATUS_COLORS: Record<NCStatus, string> = {
  open: 'red',
  investigation: 'blue',
  disposition: 'orange',
  verification: 'cyan',
  closed: 'green',
};

export const NC_SOURCE_LABELS: Record<NCSourceType, string> = {
  production: 'Production',
  incoming_inspection: 'Incoming Inspection',
  design_review: 'Design Review',
  pms: 'Post-Market Surveillance',
  audit: 'Audit Finding',
  supplier: 'Supplier',
  internal: 'Internal',
};

export const NC_SEVERITY_LABELS: Record<NCSeverity, string> = {
  critical: 'Critical',
  major: 'Major',
  minor: 'Minor',
};

export const NC_DISPOSITION_LABELS: Record<NCDisposition, string> = {
  scrap: 'Scrap',
  rework: 'Rework',
  concession: 'Concession (Use As-Is)',
  return_to_supplier: 'Return to Supplier',
};

export const NC_ROOT_CAUSE_CATEGORY_LABELS: Record<NCRootCauseCategory, string> = {
  design: 'Design Issue',
  supplier: 'Supplier Issue',
  process_sop: 'Process / SOP Issue',
  training: 'Training Issue',
  material: 'Material Issue',
  equipment: 'Equipment Issue',
  environment: 'Environmental Factor',
  unknown: 'Unknown',
};
