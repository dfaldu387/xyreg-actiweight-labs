// Market configuration for Global Stakeholder & Economic Profiler

export type MarketCode = 
  | 'USA' 
  | 'UK' 
  | 'EU' 
  | 'Japan' 
  | 'China' 
  | 'Australia' 
  | 'Canada' 
  | 'India' 
  | 'Brazil' 
  | 'South_Korea';

export interface MarketConfig {
  code: MarketCode;
  label: string;
  flag: string;
  reimbursementLabel: string;
  buyerLabel: string;
  question: string;
  options: { value: string; label: string; description?: string }[];
  warnings?: {
    condition: (data: any) => boolean;
    type: 'error' | 'warning';
    message: string;
  }[];
}

export const MARKET_CONFIGS: Record<MarketCode, MarketConfig> = {
  USA: {
    code: 'USA',
    label: 'United States',
    flag: '🇺🇸',
    reimbursementLabel: 'CPT/HCPCS Code',
    buyerLabel: 'IDN / VAC / GPO',
    question: 'What is the Coding Strategy?',
    options: [
      { value: 'Existing_CPT', label: 'Existing CPT Code', description: 'Lower risk, faster path' },
      { value: 'New_CPT', label: 'New CPT Code', description: 'High risk, 18-24 month timeline' },
      { value: 'DRG_Bundle', label: 'DRG Bundle', description: 'Hospital absorbs cost in payment bundle' },
    ],
    warnings: [
      {
        condition: (data) => data.coding_strategy === 'New_CPT',
        type: 'warning',
        message: '⚠️ Timeline Risk: Obtaining a new CPT code typically takes 18-24 months.',
      },
    ],
  },
  UK: {
    code: 'UK',
    label: 'United Kingdom',
    flag: '🇬🇧',
    reimbursementLabel: 'HRG / Tariff Status',
    buyerLabel: 'NHS Trust',
    question: 'What is the Procurement Path?',
    options: [
      { value: 'National_Tender', label: 'National Tender', description: 'NHS Supply Chain framework' },
      { value: 'Local_Trust', label: 'Local Trust Direct Purchase', description: 'Individual NHS Trust procurement' },
      { value: 'Innovation_Fund', label: 'Innovation Fund', description: 'SBRI Healthcare, AAC, or innovation funding' },
    ],
    warnings: [
      {
        condition: (data) => data.user_profile?.use_environment === 'Home',
        type: 'warning',
        message: '⚠️ Reimbursement Difficulty: Home-use devices face challenges in NHS reimbursement.',
      },
    ],
  },
  EU: {
    code: 'EU',
    label: 'EU (Insurance)',
    flag: '🇪🇺',
    reimbursementLabel: 'Reimbursement Mechanism',
    buyerLabel: 'Public Tender Authority',
    question: 'What is the Procurement Path?',
    options: [
      { value: 'National_Tender', label: 'National Tender', description: 'Centralized government procurement' },
      { value: 'Regional_Tender', label: 'Regional Tender', description: 'State/region level procurement' },
      { value: 'Direct_Hospital', label: 'Direct Hospital Purchase', description: 'Individual hospital procurement' },
    ],
  },
  Japan: {
    code: 'Japan',
    label: 'Japan',
    flag: '🇯🇵',
    reimbursementLabel: 'MHLW Category (A/B/C)',
    buyerLabel: 'Hospital (via Distributor)',
    question: 'What is the MHLW Reimbursement Category?',
    options: [
      { value: 'A1_A2', label: 'A1/A2 (Bundled/Inclusive)', description: 'Reimbursed within existing fee schedule' },
      { value: 'B_STM', label: 'B (STM - Specific Treatment Material)', description: 'Separate reimbursement, moderate reward' },
      { value: 'C1_C2', label: 'C1/C2 (New Function/Technology)', description: 'High reward but longer approval process' },
    ],
  },
  China: {
    code: 'China',
    label: 'China',
    flag: '🇨🇳',
    reimbursementLabel: 'Tender / VBP Status',
    buyerLabel: 'Hospital / Provincial Tender',
    question: 'Is this device subject to VBP (Volume-Based Procurement)?',
    options: [
      { value: 'Yes_Provincial', label: 'Yes (Provincial Tender)', description: 'Provincial VBP procurement' },
      { value: 'Yes_National', label: 'Yes (National Tender)', description: 'National VBP procurement' },
      { value: 'No_Niche', label: 'No (Niche/Innovative)', description: 'Not subject to VBP' },
    ],
    warnings: [
      {
        condition: (data) => 
          (data.vbp_status === 'Yes_Provincial' || data.vbp_status === 'Yes_National') && 
          data.budget_type === 'OpEx',
        type: 'error',
        message: '⚠️ Margin Alert: VBP tenders often require 50-90% price cuts. Ensure COGS allows this.',
      },
      {
        condition: (data) => data.user_profile?.use_environment === 'Home',
        type: 'warning',
        message: '⚠️ Reimbursement Difficulty: Home-use devices face significant challenges in Chinese public reimbursement.',
      },
    ],
  },
  Australia: {
    code: 'Australia',
    label: 'Australia',
    flag: '🇦🇺',
    reimbursementLabel: 'Prostheses List Code',
    buyerLabel: 'Private Health Fund / State Health Dept',
    question: 'Are you targeting the Private Market (Prostheses List)?',
    options: [
      { value: 'Yes_Prostheses', label: 'Yes (Prostheses List)', description: 'Private health insurance reimbursement' },
      { value: 'No_Public', label: 'No (Public Hospital Tender)', description: 'State/territory hospital procurement' },
    ],
  },
  Canada: {
    code: 'Canada',
    label: 'Canada',
    flag: '🇨🇦',
    reimbursementLabel: 'Provincial Reimbursement',
    buyerLabel: 'Provincial Health Authority',
    question: 'What is the Procurement Path?',
    options: [
      { value: 'National_Tender', label: 'National Tender', description: 'Pan-Canadian procurement' },
      { value: 'Provincial_Tender', label: 'Provincial Tender', description: 'Province-level procurement' },
      { value: 'Innovation_Fund', label: 'Innovation Fund', description: 'CDMN or provincial innovation programs' },
    ],
  },
  India: {
    code: 'India',
    label: 'India',
    flag: '🇮🇳',
    reimbursementLabel: 'Reimbursement Mechanism',
    buyerLabel: 'Patient / Private Hospital',
    question: 'Who is the primary payer?',
    options: [
      { value: 'Self_Pay', label: 'Patient Out-of-Pocket (Self-Pay)', description: 'Direct patient payment' },
      { value: 'Private_Insurance', label: 'Private Insurance (Corporate)', description: 'Corporate or private insurance' },
      { value: 'Public_System', label: 'Public System (Ayushman Bharat)', description: 'Government health scheme' },
    ],
  },
  Brazil: {
    code: 'Brazil',
    label: 'Brazil',
    flag: '🇧🇷',
    reimbursementLabel: 'TUSS / SIGTAP Code',
    buyerLabel: 'Patient / Private Hospital',
    question: 'Who is the primary payer?',
    options: [
      { value: 'Self_Pay', label: 'Patient Out-of-Pocket (Self-Pay)', description: 'Direct patient payment' },
      { value: 'Private_Insurance', label: 'Private Insurance (TUSS)', description: 'Private health plans' },
      { value: 'Public_System', label: 'Public System (SUS)', description: 'Brazilian public health system' },
    ],
  },
  South_Korea: {
    code: 'South_Korea',
    label: 'South Korea',
    flag: '🇰🇷',
    reimbursementLabel: 'NHIS Code',
    buyerLabel: 'Hospital / NHIS',
    question: 'What is the NHIS Reimbursement Path?',
    options: [
      { value: 'NHIS_Listed', label: 'NHIS Listed', description: 'National health insurance reimbursement' },
      { value: 'Non_Covered', label: 'Non-Covered (Self-Pay)', description: 'Patient pays directly' },
      { value: 'Innovation_Path', label: 'Innovation Pathway', description: 'KHIDI or innovation reimbursement' },
    ],
  },
};

export const USER_OPERATOR_OPTIONS = [
  { value: 'Surgeon', label: 'Surgeon' },
  { value: 'Nurse', label: 'Nurse' },
  { value: 'Patient', label: 'Patient (Lay user)' },
  { value: 'Technician', label: 'Technician' },
];

export const USE_ENVIRONMENT_OPTIONS = [
  { value: 'Sterile_OR', label: 'Sterile OR' },
  { value: 'ICU', label: 'ICU' },
  { value: 'Ambulance', label: 'Ambulance' },
  { value: 'Home', label: 'Home' },
  { value: 'Clinic', label: 'Clinic' },
];

// SiMD-specific: Human-Machine Interface options
export const HMI_TYPE_OPTIONS = [
  { value: 'Integrated_Screen', label: 'Integrated Screen', description: 'Screen built into the device' },
  { value: 'Physical_Buttons', label: 'Physical Buttons/Knobs', description: 'Mechanical controls only' },
  { value: 'Paired_Tablet', label: 'Paired Tablet/Controller', description: 'External touchscreen controller' },
  { value: 'Voice_Controlled', label: 'Voice Controlled', description: 'Voice-activated interface' },
];

// SaMD-specific: Host platform options
export const HOST_PLATFORM_OPTIONS = [
  { value: 'Web_Browser', label: 'Web Browser', description: 'Runs in Chrome, Safari, etc.' },
  { value: 'iOS_Android', label: 'iOS/Android App', description: 'Mobile app via App Store/Play Store' },
  { value: 'EMR_Integration', label: 'Hospital EMR Integration', description: 'Embedded in Epic, Cerner, etc.' },
  { value: 'Desktop_App', label: 'Desktop Application', description: 'Installed on Windows/Mac' },
];

// SaMD-specific: Deployment environment options
export const DEPLOYMENT_ENVIRONMENT_OPTIONS = [
  { value: 'Cloud', label: 'Cloud (AWS/Azure/GCP)', description: 'Hosted on public cloud infrastructure' },
  { value: 'On_Premise', label: 'On-Premise (Hospital Server)', description: 'Installed on hospital infrastructure' },
  { value: 'Hybrid', label: 'Hybrid', description: 'Mix of cloud and local deployment' },
  { value: 'Edge', label: 'Edge Device', description: 'Processing on local hardware' },
];

// SaMD-specific: Data hosting location options
export const DATA_HOSTING_OPTIONS = [
  { value: 'US_Only', label: 'US Only', description: 'Data resides in US data centers' },
  { value: 'EU_Only', label: 'EU Only', description: 'Data resides in EU (GDPR-compliant)' },
  { value: 'Regional', label: 'Regional (Multi-region)', description: 'Data in customer-selected region' },
  { value: 'Customer_Choice', label: 'Customer Choice', description: 'Customer selects hosting location' },
];

export const BUDGET_TYPE_OPTIONS = [
  { value: 'CapEx', label: 'CapEx (Capital)', description: 'One-time capital purchase' },
  { value: 'OpEx', label: 'OpEx (Consumable)', description: 'Recurring operational expense' },
  { value: 'SaaS', label: 'SaaS / License', description: 'Subscription-based pricing' },
];

export const BUYER_TYPE_OPTIONS: Record<string, { value: string; label: string }[]> = {
  USA: [
    { value: 'IDN', label: 'IDN (Integrated Delivery Network)' },
    { value: 'ASC', label: 'ASC (Ambulatory Surgery Center)' },
    { value: 'GPO', label: 'GPO (Group Purchasing Organization)' },
  ],
  default: [
    { value: 'Hospital', label: 'Hospital' },
    { value: 'Distributor', label: 'Distributor' },
    { value: 'Direct', label: 'Direct to Customer' },
  ],
};

// Map common ISO codes to MARKET_CONFIGS keys
const CODE_ALIASES: Record<string, MarketCode> = {
  'US': 'USA',
  'GB': 'UK',
  'JP': 'Japan',
  'CN': 'China',
  'AU': 'Australia',
  'CA': 'Canada',
  'IN': 'India',
  'BR': 'Brazil',
  'KR': 'South_Korea',
  // Also support lowercase
  'usa': 'USA',
  'uk': 'UK',
  'eu': 'EU',
  'japan': 'Japan',
  'china': 'China',
  'australia': 'Australia',
  'canada': 'Canada',
  'india': 'India',
  'brazil': 'Brazil',
  'south_korea': 'South_Korea',
};

export function normalizeMarketCode(code: string): MarketCode | undefined {
  // Direct match
  if (code in MARKET_CONFIGS) {
    return code as MarketCode;
  }
  // Check aliases
  return CODE_ALIASES[code] || CODE_ALIASES[code.toUpperCase()] || CODE_ALIASES[code.toLowerCase()];
}

export function getMarketConfig(marketCode: string): MarketConfig | undefined {
  const normalizedCode = normalizeMarketCode(marketCode);
  return normalizedCode ? MARKET_CONFIGS[normalizedCode] : undefined;
}

export function getAllMarkets(): MarketConfig[] {
  return Object.values(MARKET_CONFIGS);
}

export function getActiveWarnings(marketCode: MarketCode, data: any): { type: 'error' | 'warning'; message: string }[] {
  const config = MARKET_CONFIGS[marketCode];
  if (!config.warnings) return [];
  
  return config.warnings
    .filter(w => w.condition(data))
    .map(w => ({ type: w.type, message: w.message }));
}
