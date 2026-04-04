export interface CategoryNumberingConfig {
  categoryKey: string;
  categoryName: string;
  description?: string;
  isCustom?: boolean;
  prefix: string;
  numberFormat: string;
  startingNumber: string;
  versionFormat: string;
}

export interface DocumentCategorySettings {
  categories: CategoryNumberingConfig[];
  defaultPrefix: string;
  defaultNumberFormat: string;
  defaultStartingNumber: string;
  defaultVersionFormat: string;
}

export const DEFAULT_NUMBERING_CONFIG: CategoryNumberingConfig = {
  categoryKey: '',
  categoryName: '',
  prefix: 'DOC',
  numberFormat: 'XXX',
  startingNumber: '001',
  versionFormat: 'V1.0'
};

export const NUMBER_FORMATS = [
  { value: 'XXX', label: 'XXX (3 digits)', example: '001' },
  { value: 'XXXX', label: 'XXXX (4 digits)', example: '0001' },
  { value: 'XX-XX', label: 'XX-XX (2-2 format)', example: '01-01' },
];

export const VERSION_FORMATS = [
  { value: 'V1.0', label: 'V1.0 (V Major.Minor)', example: 'V1.0' },
  { value: 'Rev A', label: 'Rev A (Revision Letter)', example: 'Rev A' },
  { value: '01', label: '01 (Sequential Number)', example: '01' },
];