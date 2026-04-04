
export interface Project {
  id: string;
  name: string;
  description?: string;
  project_category: string;
  project_types: string[];
  company_id: string;
  product_id?: string;
  parent_product_id?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreationData {
  name: string;
  description?: string;
  project_category: string;
  project_types: string[];
  company_id: string;
  product_id?: string; // For projects on existing products
  parent_product_id?: string; // For line extensions
}

export interface ProductForSelection {
  id: string;
  name: string;
  description?: string;
  status: string;
  inserted_at: string;
  version?: string; // Now supported with database column
  parent_product_id?: string; // Add parent relationship
  basic_udi_di?: string; // Basic UDI-DI for grouping variants
  udi_di?: string; // Full UDI-DI for individual variant
  company_id: string; // CRITICAL: Company ID for security validation
}

export interface LineExtensionResult {
  product_id: string;
  project_id: string;
  success: boolean;
}

export interface VersionCreationResult {
  project_id: string;
  product_id: string;
  version: string;
  product_name: string;
}

export type CreationMode = 'new_product' | 'existing_product' | 'line_extension';

// Project categories and types
export const PROJECT_CATEGORIES = {
  NEW_PRODUCT: 'NEW PRODUCT',
  EXISTING_PRODUCT: 'PRODUCT UPGRADE', 
  LINE_EXTENSION: 'LINE EXTENSION'
} as const;

export const PROJECT_TYPES = {
  // New Product categories
  NEW_PRODUCT_DEVELOPMENT: 'New Device Development (NDD)',
  TECHNOLOGY_DEVELOPMENT: 'Technology Development / Research',
  FEASIBILITY_STUDY: 'Feasibility Study',
  
  // Product Upgrade categories
  PRODUCT_IMPROVEMENT: 'Device Improvement / Feature Enhancement',
  COMPONENT_MATERIAL_CHANGE: 'Component or Material Change',
  LABELING_PACKAGING_CHANGE: 'Labeling or Packaging Change',
  SOFTWARE_UPDATE: 'Software Update / Patch Release',
  CYBERSECURITY_ENHANCEMENT: 'Cybersecurity Enhancement',
  CAPA_IMPLEMENTATION: 'CAPA Implementation',
  COMPLIANCE_REMEDIATION: 'Compliance Remediation / Recertification',
  REGULATORY_SUBMISSION: 'Regulatory Submission (New Market)',
  MANUFACTURING_PROCESS_CHANGE: 'Manufacturing Process Change',
  PRODUCTION_SITE_TRANSFER: 'Production Site Transfer',
  
  // Line Extension categories
  LINE_EXTENSION: 'Line Extension'
} as const;

export const PROJECT_TYPES_BY_MODE = {
  new_product: [
    PROJECT_TYPES.NEW_PRODUCT_DEVELOPMENT,
    PROJECT_TYPES.TECHNOLOGY_DEVELOPMENT,
    PROJECT_TYPES.FEASIBILITY_STUDY
  ],
  existing_product: [
    PROJECT_TYPES.PRODUCT_IMPROVEMENT,
    PROJECT_TYPES.COMPONENT_MATERIAL_CHANGE,
    PROJECT_TYPES.LABELING_PACKAGING_CHANGE,
    PROJECT_TYPES.SOFTWARE_UPDATE,
    PROJECT_TYPES.CYBERSECURITY_ENHANCEMENT,
    PROJECT_TYPES.CAPA_IMPLEMENTATION,
    PROJECT_TYPES.COMPLIANCE_REMEDIATION,
    PROJECT_TYPES.REGULATORY_SUBMISSION,
    PROJECT_TYPES.MANUFACTURING_PROCESS_CHANGE,
    PROJECT_TYPES.PRODUCTION_SITE_TRANSFER
  ],
  line_extension: [
    PROJECT_TYPES.LINE_EXTENSION
  ]
} as const;

// New types for version management
export interface ProductVersionHierarchy {
  product_id: string;
  product_name: string;
  version: string;
  parent_id?: string;
  level: number;
  created_at: string;
}

export interface ProductVersionHistory {
  id: string;
  product_id: string;
  parent_product_id?: string;
  version: string;
  version_type: 'major' | 'minor' | 'patch';
  created_by?: string;
  created_at: string;
  change_description?: string;
  metadata?: Record<string, any>;
}
