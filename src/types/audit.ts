export type AuditStatus = "Planned" | "In Progress" | "Completed" | "Overdue";

export interface CompanyAudit {
  id: string;
  company_id: string;
  audit_name: string;
  audit_type: string;
  status: AuditStatus;
  start_date?: string;
  end_date?: string;
  deadline_date?: string; // Keep for backward compatibility
  completion_date?: string;
  responsible_person_id?: string;
  notes?: string;
  lead_auditor_name?: string;
  actual_audit_duration?: string;
  executive_summary?: string;
  overall_assessment?: string;
  close_out_actions_summary?: string;
  phase_id?: string;
  created_at: string;
  updated_at: string;
  // Admin approval fields
  admin_approved?: boolean;
  admin_approved_by?: string;
  admin_approved_at?: string;
  admin_comments?: string;
}

export interface ProductAudit {
  id: string;
  product_id: string;
  audit_name: string;
  audit_type: string;
  status: AuditStatus;
  start_date?: string;
  end_date?: string;
  deadline_date?: string; // Keep for backward compatibility
  completion_date?: string;
  responsible_person_id?: string;
  notes?: string;
  lead_auditor_name?: string;
  actual_audit_duration?: string;
  executive_summary?: string;
  overall_assessment?: string;
  close_out_actions_summary?: string;
  lifecycle_phase?: string;
  phase_id?: string;
  created_at: string;
  updated_at: string;
  // Admin approval fields
  admin_approved?: boolean;
  admin_approved_by?: string;
  admin_approved_at?: string;
  admin_comments?: string;
}

export interface AuditMetadata {
  id: string;
  audit_type: string;
  lifecycle_phase?: string;
  purpose?: string;
  suggested_documents?: string;
  duration?: string;
  auditor_type?: string;
  applies_to?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditDocument {
  audit_id: string;
  document_id: string;
  audit_type: 'product' | 'company';
  id?: string;
  name?: string;
  status?: string;
  type?: string;
  dueDate?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  inserted_at?: string;
  product_id?: string;
  phase_id?: string;
  company_id?: string;
  document_type?: string;
  due_date?: string;
}

// Constants
export const AUDIT_TYPES = [
  "ISO 13485 Internal Audit",
  "Design Control Audit",
  "Risk Management Audit",
  "Clinical Evaluation Audit",
  "Post-Market Surveillance Audit",
  "Supplier Audit",
  "Management Review",
  "Corrective Action Audit",
  "Document Control Audit",
  "Training Records Audit",
  "Equipment Calibration Audit",
  "Facility Audit",
  "Software Validation Audit",
  "Sterilization Validation Audit",
  "Packaging Validation Audit",
  "Labeling Review Audit",
  "Regulatory Compliance Audit",
  "Notified Body Audit",
  "FDA Inspection Preparation",
  "CE Marking Audit"
];

export const LIFECYCLE_PHASES = [
  "Concept Development",
  "Design Input",
  "Design Development",
  "Design Verification",
  "Design Validation",
  "Design Transfer",
  "Production",
  "Post-Market Surveillance",
  "End of Life"
];
