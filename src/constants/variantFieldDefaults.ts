export interface VariantFieldConfig {
  enabled: boolean;
  required: boolean;
  label?: string;
  category?: 'overview' | 'purpose' | 'regulatory';
  order?: number;
}

export type VariantFieldKey =
  | 'referenceNumber' | 'variantName' | 'tradeName' | 'emdnCode'
  | 'modelReference' | 'udiDi' | 'basicUdiDi' | 'intendedPurpose'
  | 'medicalDeviceType' | 'notifiedBody' | 'designFreezeDate'
  | 'regulatoryStatusByMarket'
  | 'intendedUse' | 'intendedFunction' | 'modeOfAction'
  | 'intendedPatientPopulation' | 'intendedUser' | 'durationOfUse'
  | 'environmentOfUse' | 'contraindications' | 'warningsPrecautions'
  | 'clinicalBenefits' | 'howToUse' | 'charging' | 'maintenance'
  | 'regulatoryInformation' | 'suggestedClass' | 'reasoning'
  | 'improveClassificationAccuracy' | 'overallProgress' | 'criticalFields'
  | 'criticalFieldStatus' | 'additionalAnalysisFeatures' | 'emdnClassification'
  | 'currentEmdnCode' | 'fullText' | 'predicateTrail' | 'similarDevices';

export type VariantFieldConfigMap = Record<string, VariantFieldConfig>;

export const VARIANT_OVERVIEW_FIELDS: VariantFieldKey[] = [
  'referenceNumber',
  'variantName',
  'tradeName',
  'emdnCode',
  'modelReference',
  'udiDi',
  'basicUdiDi',
  'intendedPurpose',
  'medicalDeviceType',
  'notifiedBody',
  'designFreezeDate',
  'regulatoryStatusByMarket'
];

export const VARIANT_PURPOSE_FIELDS: VariantFieldKey[] = [
  'intendedUse', 'intendedFunction', 'modeOfAction',
  'intendedPatientPopulation', 'intendedUser', 'durationOfUse',
  'environmentOfUse', 'contraindications', 'warningsPrecautions',
  'clinicalBenefits', 'howToUse', 'charging', 'maintenance'
];

export const VARIANT_REGULATORY_FIELDS: VariantFieldKey[] = [
  'regulatoryInformation', 'suggestedClass', 'reasoning',
  'improveClassificationAccuracy', 'overallProgress', 'criticalFields',
  'criticalFieldStatus', 'additionalAnalysisFeatures', 'emdnClassification',
  'currentEmdnCode', 'fullText', 'predicateTrail', 'similarDevices'
];

export const VARIANT_FIELD_LABELS: Record<VariantFieldKey, string> = {
  referenceNumber: 'Reference Number',
  variantName: 'Variant Name',
  tradeName: 'Trade Name',
  emdnCode: 'EMDN Code',
  modelReference: 'Model / Reference',
  udiDi: 'UDI-DI',
  basicUdiDi: 'Basic UDI-DI',
  intendedPurpose: 'Intended Purpose',
  medicalDeviceType: 'Device Category',
  notifiedBody: 'Notified Body',
  designFreezeDate: 'Design Freeze Date',
  regulatoryStatusByMarket: 'Regulatory Information',
  intendedUse: 'Intended Use (The Why)',
  intendedFunction: 'Intended Function / Indications (The What and for What)',
  modeOfAction: 'Mode of Action (The How)',
  intendedPatientPopulation: 'Intended Patient Population (On Whom)',
  intendedUser: 'Intended User (By Whom)',
  durationOfUse: 'Duration of Use (How Long)',
  environmentOfUse: 'Environment of Use (The Where)',
  contraindications: 'Contraindications',
  warningsPrecautions: 'Warnings & Precautions',
  clinicalBenefits: 'Clinical Benefits - Optional',
  howToUse: 'How to Use',
  charging: 'Charging',
  maintenance: 'Maintenance',
  regulatoryInformation: 'Regulatory Information',
  suggestedClass: 'Suggested Class',
  reasoning: 'Reasoning',
  improveClassificationAccuracy: 'Improve Classification Accuracy',
  overallProgress: 'Overall Progress',
  criticalFields: 'Critical Fields',
  criticalFieldStatus: 'Critical Field Status',
  additionalAnalysisFeatures: 'Additional Analysis Features',
  emdnClassification: 'EMDN Classification',
  currentEmdnCode: 'Current EMDN Code',
  fullText: 'Full Text',
  predicateTrail: 'Predicate Trail',
  similarDevices: 'Similar Devices',
};

export const DEFAULT_VARIANT_FIELDS: VariantFieldConfigMap = {
  referenceNumber: { enabled: true, required: true },
  variantName: { enabled: true, required: true },
  tradeName: { enabled: true, required: false },
  emdnCode: { enabled: true, required: false },
  modelReference: { enabled: true, required: false },
  udiDi: { enabled: true, required: false },
  basicUdiDi: { enabled: true, required: false },
  intendedPurpose: { enabled: true, required: false },
  medicalDeviceType: { enabled: true, required: false },
  notifiedBody: { enabled: true, required: false },
  designFreezeDate: { enabled: true, required: false },
  regulatoryStatusByMarket: { enabled: true, required: false },
  intendedUse: { enabled: true, required: false },
  intendedFunction: { enabled: true, required: false },
  modeOfAction: { enabled: false, required: false },
  intendedPatientPopulation: { enabled: true, required: false },
  intendedUser: { enabled: true, required: false },
  durationOfUse: { enabled: true, required: false },
  environmentOfUse: { enabled: true, required: false },
  contraindications: { enabled: true, required: false },
  warningsPrecautions: { enabled: true, required: false },
  clinicalBenefits: { enabled: false, required: false },
  howToUse: { enabled: true, required: false },
  charging: { enabled: true, required: false },
  maintenance: { enabled: true, required: false },
  regulatoryInformation: { enabled: true, required: false },
  suggestedClass: { enabled: true, required: false },
  reasoning: { enabled: true, required: false },
  improveClassificationAccuracy: { enabled: true, required: false },
  overallProgress: { enabled: true, required: false },
  criticalFields: { enabled: true, required: false },
  criticalFieldStatus: { enabled: true, required: false },
  additionalAnalysisFeatures: { enabled: true, required: false },
  emdnClassification: { enabled: true, required: false },
  currentEmdnCode: { enabled: true, required: false },
  fullText: { enabled: true, required: false },
  predicateTrail: { enabled: true, required: false },
  similarDevices: { enabled: true, required: false },
};

const CATEGORY_LOOKUP: Record<string, 'overview' | 'purpose' | 'regulatory'> = {};
VARIANT_OVERVIEW_FIELDS.forEach((key) => (CATEGORY_LOOKUP[key] = 'overview'));
VARIANT_PURPOSE_FIELDS.forEach((key) => (CATEGORY_LOOKUP[key] = 'purpose'));
VARIANT_REGULATORY_FIELDS.forEach((key) => (CATEGORY_LOOKUP[key] = 'regulatory'));

export const getDefaultVariantFields = (): VariantFieldConfigMap => {
  const entries = Object.keys(DEFAULT_VARIANT_FIELDS) as VariantFieldKey[];
  return entries.reduce((acc, key, index) => {
    const base = DEFAULT_VARIANT_FIELDS[key];
    acc[key] = {
      enabled: base.enabled,
      required: base.required,
      label: VARIANT_FIELD_LABELS[key] || key,
      category: base.category || CATEGORY_LOOKUP[key] || 'overview',
      order: base.order || index + 1,
    };
    return acc;
  }, {} as VariantFieldConfigMap);
};

