
export type InclusionType = 
  | 'always_include'
  | 'not_included' 
  | 'class_based'
  | 'market_based'
  | 'custom_conditions';

export type DeviceClass = 'I' | 'IIa' | 'IIb' | 'III';
export type Market = 'US' | 'EU' | 'CA' | 'AU' | 'JP';

export interface InclusionRule {
  type: InclusionType;
  conditions?: {
    deviceClasses?: DeviceClass[];
    markets?: Market[];
    customLogic?: string;
  };
  description?: string;
}

export interface DocumentInclusionStatus {
  isIncluded: boolean;
  reason: string;
  appliedRule: InclusionRule;
}

export const INCLUSION_OPTIONS = [
  { value: 'always_include', label: 'Always Include', description: 'Include for all products' },
  { value: 'not_included', label: 'Not Included', description: 'Exclude from all products' },
  { value: 'class_i', label: 'Include if Class I', description: 'Include only for Class I devices' },
  { value: 'class_iia', label: 'Include if Class IIa', description: 'Include only for Class IIa devices' },
  { value: 'class_iib', label: 'Include if Class IIb', description: 'Include only for Class IIb devices' },
  { value: 'class_iii', label: 'Include if Class III', description: 'Include only for Class III devices' },
  { value: 'class_ii_plus', label: 'Include if Class II+', description: 'Include for Class IIa, IIb, and III' },
  { value: 'eu_market', label: 'Include for EU Market', description: 'Include only for EU market products' },
  { value: 'us_market', label: 'Include for US Market', description: 'Include only for US market products' },
  { value: 'custom_conditions', label: 'Custom Conditions', description: 'Define custom inclusion logic' }
] as const;
