
export interface NotifiedBodyScope {
  mdr: boolean;
  ivdr: boolean;
  highRiskActiveImplantables: boolean;
  highRiskImplantsNonActive: boolean;
  medicalSoftware: boolean;
  sterilizationMethods: boolean;
  drugDeviceCombinations: boolean;
}

export interface NotifiedBody {
  id: string;
  name: string;
  nb_number: number;
  scope: NotifiedBodyScope;
  address: string;
  contactNumber: string;
  email: string;
  website?: string;
  country: string;
  source?: 'database' | 'manual';
  data_source?: 'official_eu_nando' | 'manual_entry' | 'custom_import';
  // Comparison data
  category?: 'big_four' | 'established' | 'new_entrant' | 'standard';
  typicalLeadTimeMonthsMin?: number;
  typicalLeadTimeMonthsMax?: number;
  auditFeePerDayMin?: number;
  auditFeePerDayMax?: number;
  scopeDepth?: 'full' | 'focused' | 'standard';
  waitlistStatus?: 'open' | 'closed' | 'limited' | 'unknown';
  strengths?: string[];
  notes?: string;
}
