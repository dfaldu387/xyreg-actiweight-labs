/**
 * Maps Genesis step data to Viability Scorecard inputs
 * Eliminates duplicate data entry by deriving scorecard fields from existing product data
 */

import type { ViabilityAnswers } from '@/components/product/business-case/viability/ViabilityWizard';

// Type for market data structure from products table
export interface MarketData {
  code?: string;
  name?: string;
  market?: string;
  riskClass?: string;
}

// Type for key technology characteristics from products table
export interface TechCharacteristics {
  isSoftwareAsaMedicalDevice?: boolean;
  isSoftwareMobileApp?: boolean;
  isSoftwareInMedicalDevice?: boolean;
  noSoftware?: boolean;
}

// Type for clinical evidence plan data
export interface ClinicalEvidenceData {
  study_design?: {
    type?: string;
    sample_size?: number;
  };
}

// Type for reimbursement strategy data
export interface ReimbursementStrategyData {
  target_codes?: Array<{
    code?: string;
    type?: string;
  }>;
}

/**
 * Maps a market code to a regulatory framework value
 */
export function mapMarketToFramework(marketCode: string | undefined): string {
  if (!marketCode) return '';
  
  const code = marketCode.toUpperCase().trim();
  
  // EU member states map to EU MDR
  const euCountries = ['EU', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PL', 'SE', 'DK', 'FI', 'IE', 'PT', 'GR', 'CZ', 'RO', 'HU', 'SK', 'BG', 'HR', 'SI', 'LT', 'LV', 'EE', 'CY', 'LU', 'MT'];
  
  if (euCountries.includes(code)) return 'eu-mdr';
  
  const frameworkMap: Record<string, string> = {
    'US': 'us-fda',
    'USA': 'us-fda',
    'UK': 'uk-mhra',
    'GB': 'uk-mhra',
    'CA': 'ca-hc',
    'CAN': 'ca-hc',
    'AU': 'au-tga',
    'AUS': 'au-tga',
    'JP': 'jp-pmda',
    'JPN': 'jp-pmda',
    'CN': 'cn-nmpa',
    'CHN': 'cn-nmpa',
    'BR': 'br-anvisa',
    'BRA': 'br-anvisa',
    'KR': 'kr-mfds',
    'KOR': 'kr-mfds',
  };
  
  return frameworkMap[code] || '';
}

/**
 * Maps a risk class value to scorecard device class format
 * Uses the framework to create the correct prefix (eu-class-iia, fda-class-ii-510k, etc.)
 */
export function mapRiskClassToDeviceClass(riskClass: string | undefined, framework: string): string {
  if (!riskClass) return '';
  
  const normalized = riskClass.toString().toLowerCase().trim()
    .replace(/^class\s*/i, '')
    .replace(/[^a-z0-9]/gi, '');
  
  // Framework-specific mappings
  if (framework === 'eu-mdr') {
    const euMap: Record<string, string> = {
      'i': 'eu-class-i',
      'iia': 'eu-class-iia',
      'iib': 'eu-class-iib',
      'iii': 'eu-class-iii',
    };
    return euMap[normalized] || '';
  }
  
  if (framework === 'eu-ivdr') {
    const ivdrMap: Record<string, string> = {
      'a': 'ivdr-class-a',
      'b': 'ivdr-class-b',
      'c': 'ivdr-class-c',
      'd': 'ivdr-class-d',
    };
    return ivdrMap[normalized] || '';
  }
  
  if (framework === 'us-fda') {
    const fdaMap: Record<string, string> = {
      'i': 'fda-class-i-510k-exempt',
      'ii': 'fda-class-ii-510k',
      'iii': 'fda-class-iii-pma',
    };
    return fdaMap[normalized] || '';
  }
  
  if (framework === 'uk-mhra') {
    const ukMap: Record<string, string> = {
      'i': 'uk-class-i',
      'iia': 'uk-class-iia',
      'iib': 'uk-class-iib',
      'iii': 'uk-class-iii',
    };
    return ukMap[normalized] || '';
  }
  
  if (framework === 'ca-hc') {
    const caMap: Record<string, string> = {
      'i': 'ca-class-i',
      'ii': 'ca-class-ii',
      'iii': 'ca-class-iii',
      'iv': 'ca-class-iv',
    };
    return caMap[normalized] || '';
  }
  
  if (framework === 'au-tga') {
    const auMap: Record<string, string> = {
      'i': 'au-class-i',
      'iia': 'au-class-iia',
      'iib': 'au-class-iib',
      'iii': 'au-class-iii',
    };
    return auMap[normalized] || '';
  }
  
  if (framework === 'jp-pmda') {
    const jpMap: Record<string, string> = {
      'i': 'jp-class-i',
      'ii': 'jp-class-ii',
      'iii': 'jp-class-iii',
      'iv': 'jp-class-iv',
    };
    return jpMap[normalized] || '';
  }
  
  if (framework === 'cn-nmpa') {
    const cnMap: Record<string, string> = {
      'i': 'cn-class-i',
      'ii': 'cn-class-ii',
      'iii': 'cn-class-iii',
    };
    return cnMap[normalized] || '';
  }
  
  if (framework === 'br-anvisa') {
    const brMap: Record<string, string> = {
      'i': 'br-class-i',
      'ii': 'br-class-ii',
      'iii': 'br-class-iii',
      'iv': 'br-class-iv',
    };
    return brMap[normalized] || '';
  }
  
  if (framework === 'kr-mfds') {
    const krMap: Record<string, string> = {
      'i': 'kr-class-i',
      'ii': 'kr-class-ii',
      'iii': 'kr-class-iii',
      'iv': 'kr-class-iv',
    };
    return krMap[normalized] || '';
  }
  
  return '';
}

/**
 * Maps technology characteristics to scorecard technology type
 */
export function mapTechToType(techChars: TechCharacteristics | null | undefined): string {
  if (!techChars) return '';
  
  if (techChars.isSoftwareAsaMedicalDevice === true || techChars.isSoftwareMobileApp === true) {
    return 'samd';
  }
  
  if (techChars.isSoftwareInMedicalDevice === true) {
    return 'simd';
  }
  
  if (techChars.noSoftware === true) {
    return 'standard-hw';
  }
  
  return '';
}

/**
 * Maps clinical evidence study design to scorecard clinical strategy
 */
export function mapStudyDesignToStrategy(clinicalData: ClinicalEvidenceData | null | undefined): string[] {
  if (!clinicalData?.study_design?.type) return [];
  
  const studyType = clinicalData.study_design.type.toLowerCase().trim();
  
  // Map study design types to scorecard options
  const strategyMap: Record<string, string[]> = {
    // Literature-based strategies
    'literature': ['literature'],
    'literature_review': ['literature'],
    'systematic_review': ['literature'],
    'meta_analysis': ['literature'],
    'equivalence': ['literature'],
    
    // Post-market strategies
    'pmcf': ['post-market'],
    'post_market': ['post-market'],
    'registry': ['post-market'],
    'real_world': ['post-market'],
    'observational': ['post-market'],
    'retrospective': ['post-market'],
    
    // Pre-market strategies
    'clinical_trial': ['pre-market'],
    'rct': ['pre-market'],
    'randomized': ['pre-market'],
    'prospective': ['pre-market'],
    'interventional': ['pre-market'],
    'pivotal': ['pre-market'],
    
    // Combined strategies
    'hybrid': ['literature', 'post-market'],
    'combined': ['literature', 'post-market'],
  };
  
  // Try exact match first
  if (strategyMap[studyType]) {
    return strategyMap[studyType];
  }
  
  // Try partial matching
  for (const [key, value] of Object.entries(strategyMap)) {
    if (studyType.includes(key) || key.includes(studyType)) {
      return value;
    }
  }
  
  return [];
}

/**
 * Extracts patient count from clinical evidence data
 */
export function getPatientCount(clinicalData: ClinicalEvidenceData | null | undefined): number | undefined {
  if (!clinicalData?.study_design?.sample_size) return undefined;
  
  const sampleSize = clinicalData.study_design.sample_size;
  if (typeof sampleSize === 'number' && sampleSize > 0) {
    return sampleSize;
  }
  
  return undefined;
}

/**
 * Maps reimbursement target codes to scorecard reimbursement code status
 */
export function mapReimbursementCodes(reimbursementData: ReimbursementStrategyData | null | undefined): string {
  if (!reimbursementData?.target_codes) return '';
  
  const codes = reimbursementData.target_codes;
  if (!Array.isArray(codes) || codes.length === 0) return '';
  
  // Check for primary codes
  const hasPrimary = codes.some(code => code?.type === 'primary');
  if (hasPrimary) return 'exact';
  
  // Has some codes but no primary
  if (codes.length > 0) return 'partial';
  
  return '';
}

/**
 * Extracts the primary market from the markets array
 */
export function getPrimaryMarket(markets: any[] | null | undefined): MarketData | null {
  if (!markets || !Array.isArray(markets) || markets.length === 0) return null;
  
  // Try to find a market marked as primary
  const primaryMarket = markets.find(m => m?.isPrimary === true || m?.is_primary === true);
  if (primaryMarket) return primaryMarket;
  
  // Otherwise return the first market
  return markets[0] || null;
}

/**
 * Derives viability scorecard answers from Genesis data
 * Returns partial answers - only fields that can be derived
 */
export function deriveAnswersFromGenesis(
  markets: any[] | null | undefined,
  techCharacteristics: TechCharacteristics | null | undefined,
  clinicalEvidence: ClinicalEvidenceData | null | undefined,
  reimbursementStrategy: ReimbursementStrategyData | null | undefined
): Partial<ViabilityAnswers> {
  const derived: Partial<ViabilityAnswers> = {};
  
  // Extract primary market
  const primaryMarket = getPrimaryMarket(markets);
  
  if (primaryMarket) {
    // Get market code
    const marketCode = primaryMarket.code || primaryMarket.market || primaryMarket.name;
    
    // Derive regulatory framework
    const framework = mapMarketToFramework(marketCode);
    if (framework) {
      derived.regulatoryFramework = framework;
    }
    
    // Derive device class (requires framework)
    if (framework && primaryMarket.riskClass) {
      const deviceClass = mapRiskClassToDeviceClass(primaryMarket.riskClass, framework);
      if (deviceClass) {
        derived.deviceClass = deviceClass;
      }
    }
  }
  
  // Derive technology type
  const techType = mapTechToType(techCharacteristics);
  if (techType) {
    derived.technologyType = techType;
  }
  
  // Derive clinical strategy
  const clinicalStrategy = mapStudyDesignToStrategy(clinicalEvidence);
  if (clinicalStrategy.length > 0) {
    derived.clinicalStrategy = clinicalStrategy;
  }
  
  // Derive patient count
  const patientCount = getPatientCount(clinicalEvidence);
  if (patientCount !== undefined) {
    derived.patientCount = patientCount;
  }
  
  // Derive reimbursement code status
  const reimbursementCode = mapReimbursementCodes(reimbursementStrategy);
  if (reimbursementCode) {
    derived.reimbursementCode = reimbursementCode;
  }
  
  return derived;
}

/**
 * Tracks which fields were derived from Genesis data
 */
export interface DerivedFieldsInfo {
  regulatoryFramework?: string; // Source step name if derived
  deviceClass?: string;
  clinicalStrategy?: string;
  patientCount?: string;
  reimbursementCode?: string;
  technologyType?: string;
}

export function trackDerivedFields(derived: Partial<ViabilityAnswers>): DerivedFieldsInfo {
  const info: DerivedFieldsInfo = {};
  
  if (derived.regulatoryFramework) info.regulatoryFramework = 'Markets (Step 8)';
  if (derived.deviceClass) info.deviceClass = 'Regulatory (Step 8)';
  if (derived.clinicalStrategy) info.clinicalStrategy = 'Evidence Strategy (Step 17)';
  if (derived.patientCount) info.patientCount = 'Evidence Strategy (Step 17)';
  if (derived.reimbursementCode) info.reimbursementCode = 'Reimbursement Codes (Step 15)';
  if (derived.technologyType) info.technologyType = 'Device Architecture (Step 3)';
  
  return info;
}

/**
 * Merges derived answers with saved answers (saved takes precedence)
 */
export function mergeAnswers(
  derived: Partial<ViabilityAnswers>,
  saved: Partial<ViabilityAnswers> | null
): ViabilityAnswers {
  const defaults: ViabilityAnswers = {
    regulatoryFramework: '',
    deviceClass: '',
    hasPredicate: '',
    clinicalStrategy: [],
    patientCount: 50,
    reimbursementCode: '',
    technologyType: '',
  };
  
  // Start with defaults
  const result = { ...defaults };
  
  // Apply derived values
  if (derived.regulatoryFramework) result.regulatoryFramework = derived.regulatoryFramework;
  if (derived.deviceClass) result.deviceClass = derived.deviceClass;
  if (derived.clinicalStrategy && derived.clinicalStrategy.length > 0) {
    result.clinicalStrategy = derived.clinicalStrategy;
  }
  if (derived.patientCount !== undefined) result.patientCount = derived.patientCount;
  if (derived.reimbursementCode) result.reimbursementCode = derived.reimbursementCode;
  if (derived.technologyType) result.technologyType = derived.technologyType;
  
  // Override with saved values (saved takes precedence)
  if (saved) {
    if (saved.regulatoryFramework) result.regulatoryFramework = saved.regulatoryFramework;
    if (saved.deviceClass) result.deviceClass = saved.deviceClass;
    if (saved.hasPredicate) result.hasPredicate = saved.hasPredicate;
    if (saved.clinicalStrategy && saved.clinicalStrategy.length > 0) {
      result.clinicalStrategy = saved.clinicalStrategy;
    }
    if (saved.patientCount !== undefined) result.patientCount = saved.patientCount;
    if (saved.reimbursementCode) result.reimbursementCode = saved.reimbursementCode;
    if (saved.technologyType) result.technologyType = saved.technologyType;
  }
  
  return result;
}
