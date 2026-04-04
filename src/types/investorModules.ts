// Types for the 6 investor-critical analysis modules

export interface MarketSizing {
  id: string;
  product_id: string;
  company_id: string;
  // TAM
  tam_value: number | null;
  tam_currency: string;
  tam_methodology: string | null;
  tam_sources: string | null;
  // SAM
  sam_value: number | null;
  sam_methodology: string | null;
  sam_sources: string | null;
  // SOM
  som_value: number | null;
  som_timeline_years: number;
  som_methodology: string | null;
  // Clinical Impact
  lives_impacted_annually: number | null;
  procedures_enabled_annually: number | null;
  cost_savings_per_procedure: number | null;
  clinical_impact_sources: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReimbursementCode {
  market: string;
  code: string;
  description: string;
  status: 'existing' | 'new_needed' | 'bundled';
}

export interface PayerMix {
  medicare?: number;
  medicaid?: number;
  private?: number;
  self_pay?: number;
}

export interface ReimbursementMilestone {
  date: string;
  milestone: string;
  status: 'completed' | 'pending' | 'planned';
}

export interface PayerMeeting {
  payer: string;
  date: string;
  outcome: 'positive' | 'neutral' | 'negative' | 'pending';
}

export interface ReimbursementStrategy {
  id: string;
  product_id: string;
  company_id: string;
  target_codes: ReimbursementCode[];
  payer_mix: PayerMix;
  coverage_status: 'covered' | 'pending' | 'not_covered' | 'variable' | null;
  coverage_notes: string | null;
  reimbursement_timeline_months: number | null;
  key_milestones: ReimbursementMilestone[];
  value_dossier_status: 'not_started' | 'in_progress' | 'complete' | null;
  health_economics_evidence: string | null;
  payer_meetings: PayerMeeting[];
  // HEOR fields (Step 14)
  heor_model_type?: string | null;
  cost_savings_per_procedure?: number | null;
  cost_savings_annual?: number | null;
  qaly_gain_estimate?: number | null;
  icer_value?: number | null;
  icer_currency?: string | null;
  willingness_to_pay_threshold?: number | null;
  budget_impact_year1?: number | null;
  budget_impact_year2?: number | null;
  budget_impact_year3?: number | null;
  roi_percent?: number | null;
  heor_by_market?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface Competencies {
  regulatory?: 'strong' | 'developing' | 'gap' | 'outsourced';
  clinical?: 'strong' | 'developing' | 'gap' | 'outsourced';
  commercial?: 'strong' | 'developing' | 'gap' | 'outsourced';
  manufacturing?: 'strong' | 'developing' | 'gap' | 'outsourced';
  quality?: 'strong' | 'developing' | 'gap' | 'outsourced';
  engineering?: 'strong' | 'developing' | 'gap' | 'outsourced';
}

export interface CriticalGap {
  role: string;
  priority: 'high' | 'medium' | 'low';
  target_hire_date: string;
  budget: number | null;
}

export interface HiringRoadmapItem {
  role: string;
  phase: string;
  reason: string;
}

export interface Advisor {
  name: string;
  expertise: string;
  affiliation: string;
  linkedin_url?: string;
}

export interface FounderAllocation {
  product?: number;
  fundraising?: number;
  operations?: number;
  sales?: number;
  other?: number;
}

export interface TeamGaps {
  id: string;
  product_id: string;
  company_id: string;
  competencies: Competencies;
  critical_gaps: CriticalGap[];
  hiring_roadmap: HiringRoadmapItem[];
  advisors: Advisor[];
  founder_allocation: FounderAllocation;
  created_at: string;
  updated_at: string;
}

export interface MarketTimeline {
  market: string;
  submission_date: string | null;
  approval_date_best: string | null;
  approval_date_expected: string | null;
  approval_date_worst: string | null;
}

export interface RegulatoryMilestone {
  milestone: string;
  date: string;
  status: 'completed' | 'in_progress' | 'pending';
  market: string;
}

export interface RegulatoryDependency {
  dependency: string;
  impact: 'high' | 'medium' | 'low';
  mitigation: string;
}

export interface RegulatoryTimeline {
  id: string;
  product_id: string;
  company_id: string;
  market_timelines: MarketTimeline[];
  milestones: RegulatoryMilestone[];
  dependencies: RegulatoryDependency[];
  benchmark_notes: string | null;
  similar_device_timeline_months: number | null;
  created_at: string;
  updated_at: string;
}

export interface StudyDesign {
  type: 'RCT' | 'Single-arm' | 'Observational' | 'Registry' | 'Other' | null;
  endpoints: string[];
  sample_size: number | null;
  duration_months: number | null;
  control: string | null;
}

export interface KOL {
  name: string;
  institution: string;
  role: 'PI' | 'Advisor' | 'Consultant';
  engaged: boolean;
}

export type LiteratureRelevance = 'direct' | 'analogous' | 'supportive';

export interface LiteratureReference {
  citation: string;
  relevance: LiteratureRelevance;
  url?: string;
}

export interface ClinicalEvidencePlan {
  id: string;
  product_id: string;
  company_id: string;
  regulator_requirements: string | null;
  payer_requirements: string | null;
  physician_requirements: string | null;
  study_design: StudyDesign;
  study_start_date: string | null;
  study_end_date: string | null;
  study_budget: number | null;
  study_budget_currency: string;
  kol_strategy: string | null;
  kols: KOL[];
  pmcf_required: boolean;
  pmcf_plan: string | null;
  supporting_literature: LiteratureReference[];
  created_at: string;
  updated_at: string;
}

export interface ReadinessGate {
  id: string;
  name: string;
  order: number;
  entry_criteria: string[];
  exit_criteria: string[];
  status: 'not_started' | 'in_progress' | 'passed' | 'failed';
  decision_date: string | null;
  decision: 'go' | 'no_go' | 'conditional' | null;
  decision_makers: string[];
}

export interface GateDecision {
  gate_id: string;
  date: string;
  decision: 'go' | 'no_go' | 'conditional';
  rationale: string;
  attendees: string[];
}

export interface ReadinessGates {
  id: string;
  product_id: string;
  company_id: string;
  gates: ReadinessGate[];
  current_gate_id: string;
  decision_log: GateDecision[];
  created_at: string;
  updated_at: string;
}
