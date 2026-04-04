
export interface CountryRegulatory {
  id: string;
  country_code: string;
  country_name: string;
  iso_alpha_2: string;
  iso_alpha_3: string;
  region: string;
  regulatory_framework?: string;
  medical_device_authority?: string;
  registration_required: boolean;
  harmonized_standards: string[];
}

export interface DeviceClassificationRule {
  id: string;
  regulatory_framework: string;
  rule_number: string;
  rule_description: string;
  decision_criteria: Record<string, any>;
  resulting_class: string;
  applicable_annexes: string[];
  examples: string[];
}

export interface ComplianceFramework {
  id: string;
  framework_code: string;
  framework_name: string;
  jurisdiction: string;
  description?: string;
  version: string;
  is_active: boolean;
  framework_config: Record<string, any>;
}

export interface GapTemplateItem {
  id: string;
  template_id: string;
  item_number: string;
  clause_reference?: string;
  requirement_text: string;
  guidance_text?: string;
  evidence_requirements: string[];
  applicable_phases: string[];
  priority: 'low' | 'medium' | 'high';
  category?: string;
  sort_order: number;
}

export interface EnhancedGapAnalysisTemplate {
  id: string;
  name: string;
  framework: string;
  description?: string;
  importance: 'low' | 'medium' | 'high';
  scope: 'company' | 'product';
  is_active: boolean;
  is_custom: boolean;
  company_id?: string;
  version: string;
  parent_template_id?: string;
  template_type: string;
  regulatory_framework?: string;
  applicable_device_classes: string[];
  template_config: Record<string, any>;
  items?: GapTemplateItem[];
}

export type DeviceRegion = 'Europe' | 'Americas' | 'APAC' | 'Africa' | 'Middle East';
export type RegulatoryFramework = 'EU_MDR' | 'FDA_510K' | 'Health_Canada' | 'TGA' | 'PMDA' | 'NMPA' | 'UKCA' | 'ANVISA';
export type DeviceClass = 'Class I' | 'Class IIa' | 'Class IIb' | 'Class III';
