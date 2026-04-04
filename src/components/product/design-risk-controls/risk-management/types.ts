export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Very High';
export type SeverityLevel = 1 | 2 | 3 | 4 | 5;
export type ProbabilityLevel = 1 | 2 | 3 | 4 | 5;

export type MitigationType = 'Design Control' | 'Protective Measure' | 'Information for Safety';
export type RiskControlType = 'design' | 'protective_measure' | 'information_for_safety';

// Enhanced comprehensive hazard interface
export interface Hazard {
  id: string;
  hazard_id: string; // HAZ-001 format
  product_id: string;
  company_id: string;
  
  // Basic hazard identification
  description: string;
  
  // Category information
  category_id?: string;
  category?: string; // For backward compatibility
  assessment_status?: string;
  kol_assignment_id?: string;
  
  // Comprehensive risk analysis chain
  foreseeable_sequence_events?: string;
  hazardous_situation?: string;
  potential_harm?: string;
  
  // Initial risk assessment (pre-mitigation)
  initial_severity?: SeverityLevel;
  initial_probability?: ProbabilityLevel;
  initial_risk_level?: RiskLevel;
  initial_risk?: RiskLevel; // Legacy field for backward compatibility
  
  // Risk control measures
  risk_control_measure?: string;
  risk_control_type?: RiskControlType;
  mitigation_measure: string; // Legacy field for backward compatibility
  mitigation_type: MitigationType; // Legacy field for backward compatibility
  mitigation_link?: string;
  
  // Residual risk assessment (post-mitigation)
  residual_severity?: SeverityLevel;
  residual_probability?: ProbabilityLevel;
  residual_risk_level?: RiskLevel;
  residual_risk: RiskLevel; // Legacy field for backward compatibility
  
  // Verification and validation
  verification_implementation?: string;
  verification_effectiveness?: string;
  
  // Traceability
  linked_requirements?: string;
  traceability_requirements?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by: string | null;

  // Inheritance (in-memory only, not persisted)
  isInheritedFromMaster?: boolean;
  masterProductName?: string;
}

export interface CreateHazardInput {
  description: string;
  
  // Comprehensive risk analysis
  foreseeable_sequence_events?: string;
  hazardous_situation?: string;
  potential_harm?: string;
  category?: string; // Added for AI-generated hazards
  
  // Initial risk assessment
  initial_severity?: SeverityLevel;
  initial_probability?: ProbabilityLevel;
  initial_risk?: RiskLevel; // For backward compatibility
  
  // Risk control measures
  risk_control_measure?: string;
  risk_control_type?: RiskControlType;
  mitigation_measure?: string; // For backward compatibility
  mitigation_type?: MitigationType; // For backward compatibility
  mitigation_link?: string;
  
  // Residual risk assessment
  residual_severity?: SeverityLevel;
  residual_probability?: ProbabilityLevel;
  residual_risk?: RiskLevel; // For backward compatibility
  
  // Verification and validation
  verification_implementation?: string;
  verification_effectiveness?: string;
  
  // Traceability
  linked_requirements?: string;
  traceability_requirements?: string;

  // Product scope / applicability
  productScope?: {
    categoryNames: string[];
    productIds: string[];
  };
}

// Risk calculation utilities
export const calculateRiskLevel = (severity?: SeverityLevel, probability?: ProbabilityLevel): RiskLevel | undefined => {
  if (!severity || !probability) return undefined;
  
  const riskScore = severity * probability;
  
  if (riskScore <= 4) return 'Low';
  if (riskScore <= 9) return 'Medium';
  if (riskScore <= 15) return 'High';
  return 'Very High';
};

export const getSeverityLabel = (level: SeverityLevel): string => {
  const labels = {
    1: 'Negligible',
    2: 'Minor',
    3: 'Serious',
    4: 'Major',
    5: 'Catastrophic'
  };
  return labels[level];
};

export const getProbabilityLabel = (level: ProbabilityLevel): string => {
  const labels = {
    1: 'Very Rare',
    2: 'Rare',
    3: 'Occasional',
    4: 'Likely',
    5: 'Very Likely'
  };
  return labels[level];
};