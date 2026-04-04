/**
 * High-Level Risk Options by Category
 * Industry-specific predefined risks for medtech products
 */

export type RiskCategory = 'Clinical' | 'Technical' | 'Regulatory' | 'Commercial';

export interface RiskOption {
  key: string;
  label: string;
  description: string;
}

export const RISK_CATEGORIES: RiskCategory[] = ['Clinical', 'Technical', 'Regulatory', 'Commercial'];

export const RISK_OPTIONS: Record<RiskCategory, RiskOption[]> = {
  Clinical: [
    { key: 'clinical_none_known', label: 'None known', description: 'No known clinical risks identified' },
    { key: 'patient_safety_failure', label: 'Patient safety during device failure', description: 'Device malfunction causes harm to patient' },
    { key: 'adverse_events_prolonged', label: 'Adverse events from prolonged use', description: 'Long-term use complications or side effects' },
    { key: 'infection_risk', label: 'Infection risk', description: 'Device-related infection potential' },
    { key: 'user_error_harm', label: 'User error leading to harm', description: 'Misuse by operator or patient causing injury' },
    { key: 'biocompatibility_issues', label: 'Biocompatibility issues', description: 'Material reaction with tissue or body fluids' },
    { key: 'software_malfunction', label: 'Software malfunction affecting treatment', description: 'SaMD/SiMD failure modes impacting clinical outcomes' },
    { key: 'delayed_diagnosis', label: 'Delayed diagnosis or treatment', description: 'False negatives/positives affecting patient care' },
    { key: 'cross_contamination', label: 'Cross-contamination', description: 'Multi-use contamination risk between patients' },
    { key: 'emi_interference', label: 'Electromagnetic interference', description: 'EMI affecting device operation or patient safety' },
    { key: 'clinical_other', label: 'Other', description: 'Custom clinical risk' },
  ],
  Technical: [
    { key: 'technical_none_known', label: 'None known', description: 'No known technical risks identified' },
    { key: 'software_bugs', label: 'Software bugs or crashes', description: 'Critical software failures affecting device operation' },
    { key: 'hardware_failure', label: 'Hardware component failure', description: 'Mechanical or electrical component failure' },
    { key: 'cybersecurity', label: 'Cybersecurity vulnerabilities', description: 'Data breach or device hacking potential' },
    { key: 'battery_failure', label: 'Battery failure or fire risk', description: 'Power system failures or thermal runaway' },
    { key: 'calibration_drift', label: 'Calibration drift', description: 'Accuracy degradation over time' },
    { key: 'manufacturing_defects', label: 'Manufacturing defects', description: 'Production quality issues affecting performance' },
    { key: 'single_source', label: 'Single-source component dependency', description: 'Supply chain vulnerability from sole suppliers' },
    { key: 'interoperability', label: 'Interoperability failures', description: 'System integration issues with other devices/software' },
    { key: 'environmental_sensitivity', label: 'Environmental sensitivity', description: 'Temperature, humidity, or shock failures' },
    { key: 'technical_other', label: 'Other', description: 'Custom technical risk' },
  ],
  Regulatory: [
    { key: 'regulatory_none_known', label: 'None known', description: 'No known regulatory risks identified' },
    { key: 'delayed_approval', label: 'Delayed regulatory approval', description: 'Extended review timelines from FDA, CE, etc.' },
    { key: 'classification_change', label: 'Classification change', description: 'Higher risk class determination by regulators' },
    { key: 'pms_findings', label: 'Post-market surveillance findings', description: 'PMCF/PMS data revealing safety concerns' },
    { key: 'nb_audit_findings', label: 'Notified Body audit findings', description: 'Non-conformities during certification audits' },
    { key: 'clinical_evidence_gaps', label: 'Clinical evidence gaps', description: 'Insufficient clinical data for approval' },
    { key: 'labeling_noncompliance', label: 'Labeling non-compliance', description: 'IFU or label deficiencies requiring revision' },
    { key: 'udi_compliance', label: 'UDI compliance issues', description: 'Unique Device Identification problems' },
    { key: 'country_registration', label: 'Country-specific registration delays', description: 'Market entry barriers in target countries' },
    { key: 'mdr_ivdr_transition', label: 'MDR/IVDR transition challenges', description: 'EU regulation compliance difficulties' },
    { key: 'regulatory_other', label: 'Other', description: 'Custom regulatory risk' },
  ],
  Commercial: [
    { key: 'commercial_none_known', label: 'None known', description: 'No known commercial risks identified' },
    { key: 'reimbursement_denial', label: 'Reimbursement denial', description: 'Payer rejection or inadequate coverage' },
    { key: 'competitive_launch', label: 'Competitive product launch', description: 'Market share threat from competitors' },
    { key: 'pricing_pressure', label: 'Pricing pressure', description: 'Margin compression from market forces' },
    { key: 'customer_concentration', label: 'Key customer concentration', description: 'Revenue dependency on few customers' },
    { key: 'distribution_disruption', label: 'Distribution channel disruption', description: 'Go-to-market barriers or partner issues' },
    { key: 'ip_challenge', label: 'Intellectual property challenge', description: 'Patent or IP litigation risk' },
    { key: 'manufacturing_cost', label: 'Manufacturing cost overrun', description: 'COGS exceeding targets' },
    { key: 'market_adoption', label: 'Market adoption slower than expected', description: 'Adoption curve delays or resistance' },
    { key: 'currency_tariff', label: 'Currency/tariff exposure', description: 'International trade and exchange rate risks' },
    { key: 'commercial_other', label: 'Other', description: 'Custom commercial risk' },
  ],
};

// Get risk option by key
export function getRiskOptionByKey(category: RiskCategory, key: string): RiskOption | undefined {
  return RISK_OPTIONS[category]?.find(opt => opt.key === key);
}

// Check if a risk option is custom/other
export function isCustomRisk(key: string): boolean {
  return key.endsWith('_other');
}

// Check if a risk option is "None known"
export function isNoneKnownRisk(key: string): boolean {
  return key.endsWith('_none_known');
}

// Likelihood and Impact scales
export const LIKELIHOOD_OPTIONS = [
  { value: 1, label: 'Very Low', description: 'Extremely unlikely to occur' },
  { value: 2, label: 'Low', description: 'Unlikely but possible' },
  { value: 3, label: 'Medium', description: 'May occur occasionally' },
  { value: 4, label: 'High', description: 'Likely to occur' },
  { value: 5, label: 'Very High', description: 'Almost certain to occur' },
];

export const IMPACT_OPTIONS = [
  { value: 1, label: 'Negligible', description: 'Minimal impact on objectives' },
  { value: 2, label: 'Minor', description: 'Small impact, easily managed' },
  { value: 3, label: 'Moderate', description: 'Notable impact requiring attention' },
  { value: 4, label: 'Major', description: 'Significant impact on success' },
  { value: 5, label: 'Catastrophic', description: 'Severe impact, potentially fatal to project' },
];

export const STATUS_OPTIONS = [
  { value: 'Open', label: 'Open', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  { value: 'In Progress', label: 'In Progress', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 'Mitigated', label: 'Mitigated', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
];

// Risk level calculation
export function calculateRiskLevel(likelihood: number, impact: number): string {
  const score = likelihood * impact;
  if (score <= 4) return 'Low';
  if (score <= 9) return 'Medium';
  if (score <= 15) return 'High';
  return 'Critical';
}

export function getRiskLevelColor(level: string): string {
  switch (level) {
    case 'Low': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
    case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
    case 'High': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
    case 'Critical': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}
