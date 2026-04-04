export interface ScopeOfSupply {
  category: 'Raw Materials' | 'Electronic Components' | 'Manufacturing Services' | 'Packaging Materials' | 'Testing & Validation Services' | 'Software Components' | 'Regulatory Services' | 'Logistics & Distribution' | 'Quality Systems' | 'Other';
  custom_description?: string;
}

export type SupplierType = 
  | 'Component Supplier'
  | 'Raw Material Supplier'
  | 'Service Provider'
  | 'Consultant'
  | 'CMO / CDMO'
  | 'Other';

export interface Supplier {
  id: string;
  company_id: string;
  name: string;
  status: 'Approved' | 'Probationary' | 'Disqualified';
  criticality: 'Critical' | 'Non-Critical';
  supplier_type: SupplierType;
  scope_of_supply?: string | ScopeOfSupply;
  contact_info: {
    email?: string;
    phone?: string;
    address?: string;
    contact_person?: string;
    position?: string;
  };
  next_scheduled_audit?: string;
  audit_interval?: string;
  probationary_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierEvaluation {
  id: string;
  supplier_id: string;
  evaluation_date: string;
  checklist_results: {
    quality_agreement_sent?: boolean;
    nda_signed?: boolean;
    initial_audit_completed?: boolean;
    technical_capability_assessed?: boolean;
    [key: string]: boolean | undefined;
  };
  evaluator_id?: string;
  status: 'In Progress' | 'Completed' | 'Approved';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductSupplier {
  id: string;
  product_id: string;
  supplier_id: string;
  component_name: string;
  inspection_requirements?: string;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
}

export interface SupplierCertification {
  id: string;
  supplier_id: string;
  cert_type: string;
  cert_number?: string;
  issue_date?: string;
  expiry_date?: string;
  file_path?: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierPerformanceLog {
  id: string;
  supplier_id: string;
  log_date: string;
  event_type: string;
  description: string;
  logged_by?: string;
  created_at: string;
}

export interface SupplierEvaluationDocument {
  id: string;
  supplier_id: string;
  evaluation_id?: string;
  document_name: string;
  document_type: 'CI_Issue' | 'Quality_Agreement' | 'NDA' | 'Audit_Report' | 'Other';
  file_path?: string;
  file_url?: string;
  description?: string;
  uploaded_by?: string;
  related_checklist_item?: string;
  created_at: string;
  updated_at: string;
}