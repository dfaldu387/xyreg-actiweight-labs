// Production Module Type Definitions — ISO 13485 §7.5

// Production Order Status State Machine
export type ProductionOrderStatus = 'draft' | 'ready' | 'in_progress' | 'pending_review' | 'released' | 'rejected' | 'on_hold' | 'cancelled';

// Batch Disposition
export type BatchDisposition = 'pending' | 'released' | 'rejected' | 'on_hold' | 'quarantined';

// Checkpoint Result
export type CheckpointResult = 'pass' | 'fail' | 'conditional' | 'na' | 'pending';

// Component Lot Number (traceability)
export interface ComponentLotEntry {
  component: string;
  lot_number: string;
  supplier?: string;
}

// Equipment Entry
export interface EquipmentEntry {
  equipment_id: string;
  name: string;
  calibration_date?: string;
}

// Operator Entry
export interface OperatorEntry {
  user_id: string;
  name: string;
  training_verified: boolean;
}

// Main Production Order
export interface ProductionOrder {
  id: string;
  order_id: string;
  company_id: string;
  product_id: string | null;
  batch_number: string | null;
  lot_number: string | null;
  serial_number_range: string | null;
  quantity_planned: number | null;
  quantity_produced: number;
  quantity_accepted: number;
  quantity_rejected: number;
  status: ProductionOrderStatus;
  disposition: BatchDisposition;
  disposition_notes: string | null;
  disposition_date: string | null;
  disposition_by: string | null;
  component_lot_numbers: ComponentLotEntry[];
  equipment_ids: EquipmentEntry[];
  operator_ids: OperatorEntry[];
  planned_start_date: string | null;
  planned_end_date: string | null;
  actual_start_date: string | null;
  actual_end_date: string | null;
  linked_nc_id: string | null;
  bom_revision_id: string | null;
  dhr_generated: boolean;
  dhr_generated_at: string | null;
  dhr_generated_by: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Production Checkpoint
export interface ProductionCheckpoint {
  id: string;
  order_id: string;
  checkpoint_name: string;
  description: string | null;
  specification: string | null;
  measured_value: string | null;
  unit: string | null;
  result: CheckpointResult;
  inspector_id: string | null;
  inspected_at: string | null;
  equipment_used: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// State Transition
export interface ProductionTransition {
  id: string;
  order_id: string;
  from_status: string | null;
  to_status: string;
  transitioned_by: string;
  transition_reason: string | null;
  created_at: string;
}

// Evidence
export interface ProductionEvidence {
  id: string;
  order_id: string;
  evidence_type: string;
  file_name: string;
  storage_path: string;
  description: string | null;
  uploaded_by: string | null;
  created_at: string;
}

// State Machine Gates
export const PRODUCTION_STATE_GATES: Record<ProductionOrderStatus, ProductionOrderStatus[]> = {
  draft: ['ready', 'cancelled'],
  ready: ['in_progress', 'draft', 'cancelled'],
  in_progress: ['pending_review', 'on_hold', 'cancelled'],
  pending_review: ['released', 'rejected', 'in_progress'],
  released: [],
  rejected: ['draft'],
  on_hold: ['in_progress', 'cancelled'],
  cancelled: [],
};

// Display Labels
export const PRODUCTION_STATUS_LABELS: Record<ProductionOrderStatus, string> = {
  draft: 'Draft',
  ready: 'Ready',
  in_progress: 'In Progress',
  pending_review: 'Pending Review',
  released: 'Released',
  rejected: 'Rejected',
  on_hold: 'On Hold',
  cancelled: 'Cancelled',
};

export const BATCH_DISPOSITION_LABELS: Record<BatchDisposition, string> = {
  pending: 'Pending',
  released: 'Released',
  rejected: 'Rejected',
  on_hold: 'On Hold',
  quarantined: 'Quarantined',
};

export const CHECKPOINT_RESULT_LABELS: Record<CheckpointResult, string> = {
  pass: 'Pass',
  fail: 'Fail',
  conditional: 'Conditional',
  na: 'N/A',
  pending: 'Pending',
};
