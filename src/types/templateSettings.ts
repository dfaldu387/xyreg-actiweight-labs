
export interface TemplateSettings {
  id: string;
  company_id: string;
  setting_key: string;
  setting_value: any;
  setting_type: 'boolean' | 'string' | 'number' | 'array' | 'object';
  category: 'defaults' | 'notifications' | 'workflows' | 'rules' | 'integrations' | 'udi_configuration' | 'digital_templates' | 'document_numbering';
  created_at: string;
  updated_at: string;
}

export interface DigitalTemplate {
  id: string;
  template_name: string;
  template_type: 'activity' | 'document';
  base_template: string; // e.g., 'design_review'
  phase_adaptations: Record<string, DigitalTemplateSection[]>;
  company_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DigitalTemplateSection {
  id: string;
  title: string;
  content: string;
  section_type: 'checklist' | 'form' | 'table' | 'text';
  phase_specific_data?: Record<string, any>;
  required: boolean;
  order: number;
}

export interface TemplateSettingDefinition {
  key: string;
  label: string;
  description: string;
  type: 'boolean' | 'string' | 'number' | 'select' | 'multiselect';
  category: string;
  defaultValue: any;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
  };
}

export interface TemplateSettingsGroup {
  category: string;
  title: string;
  description: string;
  settings: TemplateSettingDefinition[];
}
