
export interface ActivityTemplate {
  id: string;
  company_id: string;
  name: string;
  type: 'training_sessions' | 'reviews_meetings' | 'compliance_remediation' | 'testing_validation' | 'analysis_assessment' | 'validation_qualification' | 'production_monitoring' | 'submission_reporting' | 'surveillance_followup' | 'other';
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  company_id: string;
  product_id?: string;
  template_id?: string;
  phase_id?: string;
  name: string;
  type: 'training_sessions' | 'reviews_meetings' | 'compliance_remediation' | 'testing_validation' | 'analysis_assessment' | 'validation_qualification' | 'production_monitoring' | 'submission_reporting' | 'surveillance_followup' | 'other';
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  assignee_ids: string[];
  start_date?: string;
  end_date?: string;
  due_date?: string; // Kept for backward compatibility
  created_at: string;
  updated_at: string;
  phases?: {
    id: string;
    name: string;
    start_date?: string;
    end_date?: string;
  } | null;
  // Admin approval fields
  admin_approved?: boolean;
  admin_approved_by?: string;
  admin_approved_at?: string;
  admin_comments?: string;
}

export const ACTIVITY_TYPES = {
  training_sessions: 'Training Sessions',
  reviews_meetings: 'Reviews & Meetings',
  compliance_remediation: 'Compliance & Remediation',
  testing_validation: 'Testing & Validation',
  analysis_assessment: 'Analysis & Assessment',
  validation_qualification: 'Validation & Qualification',
  production_monitoring: 'Production & Monitoring',
  submission_reporting: 'Submission & Reporting',
  surveillance_followup: 'Surveillance & Follow-up',
  other: 'Other'
} as const;

export const ACTIVITY_TYPE_DESCRIPTIONS = {
  training_sessions: 'QMS onboarding, SOP training, GDP refresher training, standard-specific training (e.g., IEC 62304)',
  reviews_meetings: 'Design reviews, management reviews, risk management reviews, post-market data review meetings',
  compliance_remediation: 'CAPA execution, complaint handling, health hazard evaluations, non-conformance investigations',
  testing_validation: 'Usability testing, biocompatibility testing, software validation, electrical safety & EMC testing',
  analysis_assessment: 'Hazard analysis, clinical evaluation, supplier evaluation, risk assessments',
  validation_qualification: 'Process validation (IQ/OQ/PQ), sterilization validation, test method validation',
  production_monitoring: 'Environmental monitoring, sterilization cycles, equipment calibration, QC testing',
  submission_reporting: 'Technical file compilation, adverse event reporting, regulatory submissions',
  surveillance_followup: 'Post-market clinical follow-up studies, trend analysis, post-market surveillance',
  other: 'Any other activity not covered by the standard categories'
} as const;
