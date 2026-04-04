export interface CompanyDocumentTemplate {
  id: string;
  company_id: string;
  name: string;
  description?: string | null;
  document_type?: string | null;
  template_scope?: TemplateScope | null;
  template_category?: TemplateCategory | null;
  file_path?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  file_type?: string | null;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateUploadData {
  name: string;
  description?: string;
  document_type?: string;
  template_scope?: TemplateScope;
  template_category?: TemplateCategory;
  file: File;
}

export interface TemplateFilters {
  scope?: TemplateScope | 'all';
  category?: TemplateCategory | 'all';
  documentType?: string | 'all';
  search?: string;
}

export type TemplateScope = 'company-wide' | 'product-specific';

export type TemplateCategory = 
  | 'quality-system-procedures'
  | 'design-development'
  | 'safety-risk-management'
  | 'regulatory-clinical'
  | 'operations-production'
  | 'forms-logs';

export const TEMPLATE_CATEGORIES = {
  'quality-system-procedures': {
    label: 'Quality System Procedures',
    description: 'SOPs and procedures that define QMS rules and processes',
    examples: ['SOP-001: Document Control', 'SOP-003: Management Review', 'Quality Manual']
  },
  'design-development': {
    label: 'Design & Development',
    description: 'Technical documents for product development lifecycle',
    examples: ['Design Plans', 'Software Requirements', 'V&V Plans', 'DHF Templates']
  },
  'safety-risk-management': {
    label: 'Safety & Risk Management',
    description: 'Documents proving device safety and risk control',
    examples: ['Risk Management Plans', 'uFMEA Templates', 'Usability Engineering']
  },
  'regulatory-clinical': {
    label: 'Regulatory & Clinical',
    description: 'Documents for market access and clinical evidence',
    examples: ['Clinical Evaluation Plans', 'CEP/CER Templates', 'PMS Plans']
  },
  'operations-production': {
    label: 'Operations & Production Control',
    description: 'Manufacturing, inspection, and production management',
    examples: ['Production Controls', 'Inspection Records', 'DMR Templates']
  },
  'forms-logs': {
    label: 'Forms & Logs',
    description: 'Individual forms, checklists, and records for QMS',
    examples: ['Document Change Orders', 'Complaint Forms', 'CAPA Logs']
  }
} as const;