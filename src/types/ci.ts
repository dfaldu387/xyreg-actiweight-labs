
// Compliance Intelligence (CI) Type Definitions
export type CIType = "audit" | "gap" | "document" | "activity" | "clinical" | "capa";

export type CIStatus = "pending" | "in_progress" | "completed" | "blocked" | "cancelled";

export type CIPriority = "low" | "medium" | "high" | "critical";

export interface BaseCI {
  id: string;
  type: CIType;
  title: string;
  description?: string;
  status: CIStatus;
  priority: CIPriority;
  assigned_to?: string;
  due_date?: string;
  company_id: string;
  product_id?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface AuditCI extends BaseCI {
  type: "audit";
  audit_type: string;
  auditor_type: "internal" | "external" | "third-party";
  scope: "company" | "product";
  scheduled_date?: string;
  completion_date?: string;
}

export interface GapCI extends BaseCI {
  type: "gap";
  gap_item_id: string;
  framework: string;
  compliance_requirement: string;
  evidence_required: boolean;
  review_status: "not_started" | "under_review" | "approved" | "rejected";
}

export interface DocumentCI extends BaseCI {
  type: "document";
  document_id: string;
  document_type: string;
  phase_id?: string;
  approval_status: "draft" | "under_review" | "approved" | "rejected";
  reviewer_group_id?: string;
}

export interface ActivityCI extends BaseCI {
  type: "activity";
  activity_type: "training" | "testing" | "validation" | "calibration" | "maintenance";
  participants?: string[];
  location?: string;
  duration_hours?: number;
  completion_percentage: number;
  certification_required: boolean;
}

export interface ClinicalCI extends BaseCI {
  type: "clinical";
  study_type: "feasibility" | "pivotal" | "pmcf" | "registry" | "other";
  protocol_id: string;
  study_phase: "protocol" | "ethics_review" | "enrollment" | "data_collection" | "analysis" | "reporting" | "completed";
  target_enrollment: number;
  actual_enrollment: number;
  study_sites: Array<{
    name: string;
    location: string;
    pi_name?: string;
  }>;
  cro_name?: string;
  principal_investigator?: string;
  ethics_approval_date?: string;
  primary_endpoint: string;
  secondary_endpoints?: string[];
  completion_percentage: number;
  start_date?: string;
  estimated_completion_date?: string;
  actual_completion_date?: string;
}

export interface CAPACI extends BaseCI {
  type: "capa";
  capa_type: "correction" | "corrective" | "preventive" | "both";
  source_type: "complaint" | "audit" | "ncr" | "pms_event" | "defect" | "internal" | "supplier";
  source_id?: string;
  severity: number;
  probability: number;
  root_cause_summary?: string;
  voe_result?: "pending" | "pass" | "fail";
  requires_regulatory_update: boolean;
  technical_approved: boolean;
  quality_approved: boolean;
}

export type CI = AuditCI | GapCI | DocumentCI | ActivityCI | ClinicalCI | CAPACI;

export interface CIWorkflow {
  id: string;
  name: string;
  description?: string;
  ci_type: CIType;
  trigger_conditions: Record<string, any>;
  automation_rules: Record<string, any>;
  notification_settings: Record<string, any>;
  is_active: boolean;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface CIDependency {
  id: string;
  source_ci_id: string;
  target_ci_id: string;
  dependency_type: "prerequisite" | "blocking" | "related";
  description?: string;
  company_id: string;
  created_at: string;
}

export interface CIAnalytics {
  total_cis: number;
  by_type: Record<CIType, number>;
  by_status: Record<CIStatus, number>;
  overdue_count: number;
  completion_rate: number;
  average_completion_time: number;
  trending_data: Array<{
    date: string;
    completed: number;
    created: number;
  }>;
}
