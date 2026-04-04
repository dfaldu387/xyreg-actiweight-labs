
export type DeviceClass =
  | 'Class I'
  | 'Class Is (Sterile)'
  | 'Class Im (Measuring)'
  | 'Class Ir (Reusable surgical)'
  | 'Class Is (Sterile), Class Im (Measuring)'
  | 'Class Is (Sterile), Class Ir (Reusable surgical)'
  | 'Class Im (Measuring), Class Ir (Reusable surgical)'
  | 'Class Is (Sterile), Class Im (Measuring), Class Ir (Reusable surgical)'
  | 'Class II'  // Canada, Japan, China classifications
  | 'Class IIa'
  | 'Class IIb'
  | 'Class III'
  | 'Class IV'  // Canada, Japan classifications
  | 'Class A'  // IVDR classes
  | 'Class B'
  | 'Class C'
  | 'Class D'
  // Australia TGA IVD classes (numeric)
  | 'Class 1'
  | 'Class 2'
  | 'Class 3'
  | 'Class 4'
  | 'Not determined'
  | 'Not a medical device'
  | 'Not an IVD device'
  | 'Consultation required';

export interface DecisionPathEntry {
  questionId: string;
  questionText: string;
  selectedOptionId: string;
  selectedOptionText: string;
}

export interface ClassificationResult {
  class: DeviceClass;
  rule: string; // e.g., "MDR Annex VIII, Rule 1"
  description: string; // Description of the rule or class
  regulatoryPathway?: string; // e.g., "510(k)" or "PMA"
  requirements?: string[]; // Key requirements for this classification
  productCodeExamples?: string[]; // FDA product code examples
  ruleText?: string; // Full official regulatory text for this rule
  ruleSource?: string; // Citation source for the rule text
  decisionPath?: DecisionPathEntry[]; // Step-by-step path to classification
}

export interface QuestionOption {
  id: string;
  text: string;
  description?: string; // Additional context for the option
  nextQuestionId?: string;
  result?: ClassificationResult;
  helpText?: string;
}

export interface Question {
  id: string;
  text: string;
  description?: string; // Optional further explanation of the question
  helpText?: string; // General help for the question
  options: QuestionOption[];
}

export interface ClassificationSession {
  currentQuestionId: string;
  answers: Record<string, string>; // Map of questionId to optionId
  path: string[]; // History of questionIds for navigation
  result?: ClassificationResult;
}

export interface ClassISubcategoryAnswers {
  sterile: boolean | null;
  measuring: boolean | null;
  reusable: boolean | null;
}
