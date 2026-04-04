
export type AuditFindingSeverity = 'Minor' | 'Major' | 'Critical';
export type AuditFindingStatus = 'Open' | 'Addressed' | 'CAPA Raised' | 'Pending Action' | 'Closed';
export type AuditRecommendationPriority = 'Low' | 'Medium' | 'High';
export type AuditOverallAssessment = 'Compliant' | 'Non-Compliant' | 'Compliant with Observations';

export interface AuditFinding {
  id?: string;
  audit_id: string;
  audit_type: 'company' | 'product';
  description: string;
  severity: AuditFindingSeverity;
  status: AuditFindingStatus;
  corrective_actions_taken?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuditRecommendation {
  id?: string;
  audit_id: string;
  audit_type: 'company' | 'product';
  description: string;
  priority: AuditRecommendationPriority;
  created_at?: string;
  updated_at?: string;
}

export interface AuditCompletionDocument {
  id?: string;
  audit_id: string;
  audit_type: 'company' | 'product';
  file_name: string;
  storage_path: string;
  description?: string;
  document_type?: string;
  uploaded_at?: string;
}

export interface AuditCompletionData {
  completion_date?: Date;
  lead_auditor_name?: string;
  actual_audit_duration?: string;
  executive_summary?: string;
  overall_assessment?: AuditOverallAssessment;
  close_out_actions_summary?: string;
  findings: AuditFinding[];
  recommendations: AuditRecommendation[];
  documents: AuditCompletionDocument[];
}
