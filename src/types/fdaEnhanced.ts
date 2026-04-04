// Enhanced FDA API data models for comprehensive search

export interface FDAProductCodeInfo {
  code: string;
  description: string;
  deviceClass: string;
  regulationNumber: string;
  medicalSpecialty: string;
  fdaUrl: string;
}

export interface FDAUDIDevice {
  udi_di: string;
  device_description?: string;
  brand_name?: string;
  version_model_number?: string;
  labeler_duns_number?: string;
  company_name?: string;
  device_count?: string;
  device_size?: string;
  device_size_unit?: string;
  device_size_type?: string;
  sterilization_prior_to_use?: string;
  storage?: string;
  rx?: string;
  otc?: string;
  device_id?: string;
  pkg_quantity?: string;
  pkg_discontinue_date?: string;
  pkg_status?: string;
  commercial_distribution_end_date?: string;
  commercial_distribution_status?: string;
  identifiers?: any[];
  [key: string]: any;
}

export interface FDARegistrationDevice {
  registration_number?: string;
  fei_number?: string;
  facility_name?: string;
  facility_address?: string;
  facility_city?: string;
  facility_state?: string;
  facility_zip_code?: string;
  facility_country?: string;
  iso_country_code?: string;
  establishment_type?: string[];
  proprietary_name?: string;
  establishment_types?: string[];
  products?: any[];
  [key: string]: any;
}

export interface FDASearchResult {
  type: 'fda510k' | 'udi' | 'registration';
  totalResults: number;
  devices: any[];
  searchTerms: string[];
  productCodes: string[];
  pagination: {
    skip: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface FDAMultiSearchParams {
  keywords?: string[];
  productCodes?: string[];
  deviceClass?: string;
  applicant?: string;
  brandName?: string;
  companyName?: string;
  limit?: number;
  skip?: number;
  searchTypes?: Array<'fda510k' | 'udi' | 'registration'>;
  emdnCode?: string;
}

export interface FDAComprehensiveResults {
  fda510k: FDASearchResult;
  udi: FDASearchResult;
  registration: FDASearchResult;
  aggregatedStats: {
    totalDevices: number;
    totalManufacturers: number;
    topProductCodes: Array<{ code: string; count: number; description?: string }>;
    deviceClasses: Record<string, number>;
    manufacturers: Record<string, number>;
  };
  searchMetadata: {
    originalQuery: string;
    emdnDerivedTerms: string[];
    actualSearchTerms: string[];
    queryTime: number;
  };
}