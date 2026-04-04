// Type definitions for user_company_module_access table

export interface UserCompanyModuleAccess {
  id: string;
  user_id: string;
  company_id: string;
  module_ids: string[];
  is_active: boolean;
  assigned_by: string | null;
  assigned_at: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserCompanyModuleAccessInput {
  user_id: string;
  company_id: string;
  module_ids: string[];
  is_active?: boolean;
  assigned_by?: string | null;
}

export interface UpdateUserCompanyModuleAccessInput {
  module_ids?: string[];
  is_active?: boolean;
}

// Company Dashboard Module IDs
export const COMPANY_MODULES = {
  DASHBOARD: 'company-dashboard',
  COMMERCIAL: 'commercial',
  DEVICE_PORTFOLIO: 'company-products',
  MILESTONES: 'company-milestones',
  OPERATIONS: 'operations',
  HUMAN_RESOURCES: 'human-resources',
  QUALITY_GOVERNANCE: 'quality-governance',
  POST_MARKET_SURVEILLANCE: 'company-pms',
  AUDIT_LOG: 'audit-log',
  COMPLIANCE_INSTANCES: 'compliance-instances',
} as const;

// Module display names
export const MODULE_DISPLAY_NAMES: Record<string, string> = {
  [COMPANY_MODULES.DASHBOARD]: 'Dashboard',
  [COMPANY_MODULES.COMMERCIAL]: 'Commercial Intelligence',
  [COMPANY_MODULES.DEVICE_PORTFOLIO]: 'Portfolio Management',
  [COMPANY_MODULES.MILESTONES]: 'Enterprise Roadmap',
  [COMPANY_MODULES.OPERATIONS]: 'Operations',
  [COMPANY_MODULES.HUMAN_RESOURCES]: 'Human Resources',
  [COMPANY_MODULES.QUALITY_GOVERNANCE]: 'Quality Governance',
  [COMPANY_MODULES.POST_MARKET_SURVEILLANCE]: 'Post-Market Surveillance',
  [COMPANY_MODULES.AUDIT_LOG]: 'Audit Log',
  [COMPANY_MODULES.COMPLIANCE_INSTANCES]: 'Enterprise Compliance',
};

// All available modules as an array
export const ALL_COMPANY_MODULES = Object.values(COMPANY_MODULES);

