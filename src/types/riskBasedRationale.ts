// QMSR Risk-Based Rationale Types
// Aligns with FDA QMSR requirements effective February 2, 2026

// Severity levels mapped from risk management
export type SeverityOfHarm = 'Critical' | 'Major' | 'Minor';
export type ProbabilityOfOccurrence = 'Frequent' | 'Occasional' | 'Remote';
export type ValidationRigor = 'High' | 'Medium' | 'Low';
export type RationaleStatus = 'Draft' | 'Pending Approval' | 'Approved';

// Process types for validation rationale
export type ProcessType = 'manufacturing' | 'design_verification' | 'test_method' | 'other';

// Safety impact levels for supplier rationale
export type SafetyImpact = 'Direct Impact' | 'Indirect Impact' | 'No Impact';
export type CriticalityClass = 'Class A (Critical)' | 'Class B (Important)' | 'Class C (Standard)';
export type OversightLevel = 'On-Site Audit' | 'Paper Audit' | 'Certificate Only';

// Determination options
export type ValidationDetermination = 'Proceed with High Rigor Validation' | 'Proceed with Standard Verification';
export type SupplierDecision = 'Approved for ASL with High Oversight' | 'Approved with Standard Monitoring';

// ============= Document ID Prefixes for All RBR Types =============
export type RBRDocumentPrefix = 
  | 'RBR-ENG'  // Engineering - Process Validation (existing)
  | 'RBR-SUP'  // Supplier Criticality (existing)
  | 'RBR-SAM'  // Sample Size (new)
  | 'RBR-DCH'  // Design Change (new)
  | 'RBR-REG'  // Regulatory Pathway (new)
  | 'RBR-CLE'  // Clinical Evidence (new)
  | 'RBR-SWV'  // Software Validation (new)
  | 'RBR-TRN'  // Training Effectiveness (new)
  | 'RBR-CAP'; // CAPA Priority (new)

// ============= Base Interface for All RBR Rationales =============
export interface RBRBaseRationale {
  id: string;
  document_id: string;
  company_id: string;
  rationale_text: string;
  qmsr_clause_reference: string;
  created_by: string;
  approved_by?: string;
  status: RationaleStatus;
  created_at: string;
  updated_at: string;
}

/**
 * Engineering/Lab - Process Validation Rationale
 * Document ID format: RBR-ENG-{ID}
 * 
 * Purpose: To justify the sample sizes and test rigor for a new 
 * manufacturing process or design verification.
 */
export interface ProcessValidationRationale {
  id: string;
  document_id: string; // RBR-ENG-XXX
  product_id: string;
  company_id: string;
  
  // Activity Description
  activity_description: string;
  process_type: ProcessType;
  
  // Risk Classification (from Risk Management File)
  hazard_identified: string;
  linked_hazard_id?: string; // Links to hazards table
  severity_of_harm: SeverityOfHarm;
  probability_of_occurrence: ProbabilityOfOccurrence;
  
  // AI-Generated Rationale
  rationale_text: string;
  validation_rigor: ValidationRigor;
  confidence_interval: string; // e.g., "95/95" or "90/90"
  qmsr_clause_reference: string; // e.g., "7.1"
  
  // Determination
  determination: ValidationDetermination;
  
  // Audit Trail
  created_by: string;
  approved_by?: string;
  status: RationaleStatus;
  created_at: string;
  updated_at: string;
}

/**
 * Business/Supplier - Criticality Rationale
 * Document ID format: RBR-SUP-{ID}
 * 
 * Purpose: To justify why a specific supplier is being audited 
 * annually versus just being monitored via certificates.
 */
export interface SupplierCriticalityRationale {
  id: string;
  document_id: string; // RBR-SUP-XXX
  supplier_id: string;
  company_id: string;
  
  // Supplier Context
  supplier_name: string;
  component_role: string;
  safety_impact: SafetyImpact;
  
  // Pulled from Supplier record
  criticality_class: CriticalityClass;
  
  // AI-Generated Rationale
  rationale_text: string;
  oversight_level: OversightLevel;
  qmsr_clause_reference: string; // e.g., "820.10 / ISO 13485:2016 7.4.1"
  
  // Decision
  decision: SupplierDecision;
  
  // Audit Trail
  created_by: string;
  approved_by?: string;
  status: RationaleStatus;
  created_at: string;
  updated_at: string;
}

// ============= NEW RBR Node Types (Phase 1: FDA Focus) =============

/**
 * Sample Size Rationale
 * Document ID format: RBR-SAM-{ID}
 * 
 * Purpose: To justify why n=30 (or another value) is sufficient for 
 * verification based on the severity of the failure mode.
 */
export interface SampleSizeRationale extends RBRBaseRationale {
  product_id: string;
  test_case_id?: string;
  linked_hazard_id?: string;
  failure_mode: string;
  severity_level: SeverityOfHarm;
  sample_size: number;
  confidence_level: string;    // "95/95", "90/90", etc.
  statistical_method: string;  // "Binomial", "Normal", "Attribute", etc.
  determination: 'Sample Size Justified' | 'Increased Sample Required';
}

/**
 * Design Change Rationale
 * Document ID format: RBR-DCH-{ID}
 * 
 * Purpose: To justify whether a change is "minor" or "major" 
 * and why it does or doesn't require new clinical data.
 */
export interface DesignChangeRationale extends RBRBaseRationale {
  product_id: string;
  change_request_id?: string;
  change_description: string;
  change_classification: 'Minor' | 'Major';
  affected_design_outputs: string[];
  clinical_data_required: boolean;
  regulatory_submission_required: boolean;
  determination: 'Proceed as Minor Change' | 'Requires Full Re-Validation';
}

/**
 * CAPA Priority Rationale
 * Document ID format: RBR-CAP-{ID}
 * 
 * Purpose: To justify why a specific non-conformance was NOT 
 * promoted to a full CAPA. HIGH-SCRUTINY node for FDA inspectors.
 */
export interface CAPAPriorityRationale extends RBRBaseRationale {
  source_event_id: string;
  source_type: 'NCR' | 'Audit Finding' | 'Customer Complaint';
  event_description: string;
  risk_assessment: { severity: number; probability: number };
  is_recurring: boolean;
  promoted_to_capa: boolean;
  capa_id?: string;
  determination: 'CAPA Not Required - Correction Sufficient' | 'CAPA Required';
}

// ============= NEW RBR Node Types (Phase 2: Regulatory Track) =============

/**
 * Regulatory Pathway Rationale
 * Document ID format: RBR-REG-{ID}
 * 
 * Purpose: To justify the choice of a specific predicate device (510k) 
 * or the "de novo" classification.
 */
export interface PathwayRationale extends RBRBaseRationale {
  product_id: string;
  regulatory_pathway: '510(k)' | 'De Novo' | 'PMA' | 'CE Mark';
  predicate_devices?: string[];
  substantial_equivalence_justification?: string;
  determination: 'Pathway Appropriate' | 'Alternative Pathway Required';
}

/**
 * Clinical Evidence Rationale
 * Document ID format: RBR-CLE-{ID}
 * 
 * Purpose: To justify why the current clinical data set is sufficient 
 * to prove safety and effectiveness without further human trials.
 */
export interface ClinicalEvidenceRationale extends RBRBaseRationale {
  product_id: string;
  device_class: string;
  existing_clinical_data_summary: string;
  gap_analysis: string;
  additional_trials_required: boolean;
  determination: 'Clinical Evidence Sufficient' | 'Additional Data Required';
}

/**
 * Software Validation Rationale
 * Document ID format: RBR-SWV-{ID}
 * 
 * Purpose: To justify the level of validation for "Off-the-Shelf" (OTS) 
 * software used in production or the QMS.
 */
export interface SoftwareValidationRationale extends RBRBaseRationale {
  product_id?: string;
  software_name: string;
  software_version?: string;
  software_type: 'OTS' | 'SOUP' | 'Custom';
  safety_impact: SafetyImpact;
  validation_level: 'Full IQ/OQ/PQ' | 'Documented Evaluation' | 'Vendor Audit Only';
  determination: 'Validation Approach Justified' | 'Enhanced Validation Required';
}

// ============= NEW RBR Node Types (Phase 3: Business Track) =============

/**
 * Training Effectiveness Rationale
 * Document ID format: RBR-TRN-{ID}
 * 
 * Purpose: To justify why a "quiz" was sufficient to prove 
 * competence rather than a "practical demonstration."
 */
export interface TrainingEffectivenessRationale extends RBRBaseRationale {
  training_module_id?: string;
  competency_area: string;
  verification_method: 'Written Quiz' | 'Practical Demonstration' | 'On-the-Job Observation';
  risk_to_product_quality: 'High' | 'Medium' | 'Low';
  determination: 'Method Appropriate' | 'Enhanced Verification Required';
}

// ============= Input Types for Creating Rationales =============

export interface CreateProcessValidationRationaleInput {
  product_id: string;
  activity_description: string;
  process_type: ProcessType;
  hazard_identified: string;
  linked_hazard_id?: string;
  severity_of_harm: SeverityOfHarm;
  probability_of_occurrence: ProbabilityOfOccurrence;
}

export interface CreateSupplierCriticalityRationaleInput {
  supplier_id: string;
  supplier_name: string;
  component_role: string;
  safety_impact: SafetyImpact;
  criticality_class: CriticalityClass;
}

export interface CreateSampleSizeRationaleInput {
  product_id: string;
  test_case_id?: string;
  linked_hazard_id?: string;
  failure_mode: string;
  severity_level: SeverityOfHarm;
  sample_size: number;
  statistical_method: string;
}

export interface CreateDesignChangeRationaleInput {
  product_id: string;
  change_request_id?: string;
  change_description: string;
  affected_design_outputs: string[];
}

export interface CreateCAPAPriorityRationaleInput {
  source_event_id: string;
  source_type: 'NCR' | 'Audit Finding' | 'Customer Complaint';
  event_description: string;
  risk_assessment: { severity: number; probability: number };
  is_recurring: boolean;
}

// ============= AI Generation Request Types =============

export interface GenerateRationaleRequest {
  type: 'validation' | 'supplier' | 'sample_size' | 'design_change' | 'capa_priority' | 'pathway' | 'clinical' | 'software' | 'training';
  context: ValidationRationaleContext | SupplierRationaleContext | SampleSizeContext | DesignChangeContext | CAPAPriorityContext;
  companyId: string;
}

export interface ValidationRationaleContext {
  activity_description: string;
  process_type: ProcessType;
  hazard_identified: string;
  severity_of_harm: SeverityOfHarm;
  probability_of_occurrence: ProbabilityOfOccurrence;
}

export interface SupplierRationaleContext {
  supplier_name: string;
  component_role: string;
  safety_impact: SafetyImpact;
  criticality_class: CriticalityClass;
}

export interface SampleSizeContext {
  failure_mode: string;
  severity_level: SeverityOfHarm;
  sample_size: number;
  statistical_method: string;
  test_description?: string;
}

export interface DesignChangeContext {
  change_description: string;
  affected_design_outputs: string[];
  risk_impact: 'critical' | 'high' | 'medium' | 'low';
  product_name?: string;
}

export interface CAPAPriorityContext {
  event_description: string;
  source_type: 'NCR' | 'Audit Finding' | 'Customer Complaint';
  severity: number;
  probability: number;
  is_recurring: boolean;
  similar_events_count?: number;
}

export interface GenerateRationaleResponse {
  rationale_text: string;
  validation_rigor?: ValidationRigor;
  confidence_interval?: string;
  confidence_level?: string;
  oversight_level?: OversightLevel;
  qmsr_clause_reference: string;
  determination?: ValidationDetermination | 'Sample Size Justified' | 'Increased Sample Required' | 'Proceed as Minor Change' | 'Requires Full Re-Validation' | 'CAPA Not Required - Correction Sufficient' | 'CAPA Required';
  decision?: SupplierDecision;
  change_classification?: 'Minor' | 'Major';
  clinical_data_required?: boolean;
  regulatory_submission_required?: boolean;
  promoted_to_capa?: boolean;
}

// ============= Helper Functions =============

export const mapSeverityToHarm = (severity: number): SeverityOfHarm => {
  if (severity >= 4) return 'Critical';
  if (severity >= 2) return 'Major';
  return 'Minor';
};

export const mapProbabilityToOccurrence = (probability: number): ProbabilityOfOccurrence => {
  if (probability >= 4) return 'Frequent';
  if (probability >= 2) return 'Occasional';
  return 'Remote';
};

export const mapCriticalityToClass = (criticality: string): CriticalityClass => {
  if (criticality === 'Critical') return 'Class A (Critical)';
  if (criticality === 'Important') return 'Class B (Important)';
  return 'Class C (Standard)';
};

export const getRecommendedRigor = (severity: SeverityOfHarm, probability: ProbabilityOfOccurrence): ValidationRigor => {
  if (severity === 'Critical') return 'High';
  if (severity === 'Major' && probability !== 'Remote') return 'High';
  if (severity === 'Major' || probability === 'Frequent') return 'Medium';
  return 'Low';
};

export const getRecommendedConfidenceInterval = (rigor: ValidationRigor): string => {
  switch (rigor) {
    case 'High': return '95/95';
    case 'Medium': return '90/90';
    case 'Low': return '80/80';
  }
};

export const getRecommendedOversight = (criticalityClass: CriticalityClass, safetyImpact: SafetyImpact): OversightLevel => {
  if (criticalityClass === 'Class A (Critical)' || safetyImpact === 'Direct Impact') {
    return 'On-Site Audit';
  }
  if (criticalityClass === 'Class B (Important)' || safetyImpact === 'Indirect Impact') {
    return 'Paper Audit';
  }
  return 'Certificate Only';
};

// Sample size recommendations based on severity (binomial sampling)
export const getRecommendedSampleSize = (severity: SeverityOfHarm, confidenceLevel: string): number => {
  // Based on binomial sampling for zero defects
  const sampleSizeTable: Record<string, Record<SeverityOfHarm, number>> = {
    '95/95': { Critical: 59, Major: 59, Minor: 29 },
    '90/90': { Critical: 59, Major: 22, Minor: 22 },
    '80/80': { Critical: 29, Major: 15, Minor: 10 },
  };
  return sampleSizeTable[confidenceLevel]?.[severity] || 30;
};

// Design change classification helper
export const getRecommendedChangeClassification = (
  affectedOutputsCount: number,
  riskImpact: 'critical' | 'high' | 'medium' | 'low'
): 'Minor' | 'Major' => {
  if (riskImpact === 'critical' || riskImpact === 'high') return 'Major';
  if (affectedOutputsCount > 3) return 'Major';
  return 'Minor';
};

// CAPA promotion recommendation
export const getRecommendedCAPAPromotion = (
  severity: number,
  probability: number,
  isRecurring: boolean
): boolean => {
  const rpn = severity * probability;
  // Promote to CAPA if: RPN >= 15, OR is recurring, OR severity >= 4
  if (rpn >= 15) return true;
  if (isRecurring) return true;
  if (severity >= 4) return true;
  return false;
};

// RBR Node type labels for UI
export const RBR_NODE_LABELS: Record<RBRDocumentPrefix, { name: string; clause: string; track: string }> = {
  'RBR-ENG': { name: 'Process Validation', clause: '7.1', track: 'Engineering' },
  'RBR-SUP': { name: 'Supplier Criticality', clause: '7.4.1', track: 'Business' },
  'RBR-SAM': { name: 'Sample Size', clause: '7.3.6', track: 'Engineering' },
  'RBR-DCH': { name: 'Design Change', clause: '7.3.9', track: 'Engineering' },
  'RBR-REG': { name: 'Regulatory Pathway', clause: '21 CFR 807', track: 'Regulatory' },
  'RBR-CLE': { name: 'Clinical Evidence', clause: '7.3.7', track: 'Regulatory' },
  'RBR-SWV': { name: 'Software Validation', clause: '7.6', track: 'Regulatory' },
  'RBR-TRN': { name: 'Training Effectiveness', clause: '6.2', track: 'Business' },
  'RBR-CAP': { name: 'CAPA Priority', clause: '8.5', track: 'Business' },
};
