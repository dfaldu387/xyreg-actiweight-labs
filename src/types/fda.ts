// FDA API data models and types

export interface FDADevice {
  registration_number?: string;
  fei_number?: string;
  facility_name?: string;
  facility_address?: string;
  facility_city?: string;
  facility_state?: string;
  facility_zip_code?: string;
  facility_country?: string;
  device_name?: string;
  product_code?: string;
  product_codes?: string[]; // Multiple product codes
  device_class?: string;
  regulation_number?: string;
  submission_type?: string;
  submission_number?: string;
  date_received?: string;
  decision_date?: string;
  decision?: string;
  advisory_committee?: string;
  statement_or_summary?: string;
  type?: string;
  third_party?: string;
  expedited_review?: string;
  [key: string]: any;
}

export interface FDA510kDevice {
  k_number?: string;
  device_name?: string;
  product_code?: string;
  product_codes?: string[]; // Multiple product codes
  device_class?: string;
  date_received?: string;
  decision_date?: string;
  decision?: string;
  statement_or_summary?: string;
  applicant?: string;
  contact?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  country_code?: string;
  zip?: string;
  postal_code?: string;
  advisory_committee?: string;
  [key: string]: any;
}

export interface FDACompetitiveData {
  total_devices: number;
  devices_by_class: Record<string, number>;
  devices_by_state: Record<string, number>;
  devices_by_applicant: Record<string, number>;
  recent_clearances: FDA510kDevice[];
  regulatory_pathways: Record<string, number>;
  geographic_distribution: Record<string, number>;
  devices: FDADevice[];
}

export interface EnhancedCompetitiveAnalysis {
  emdn_code: string;
  eu_data: {
    total_competitors: number;
    competitors_by_class: Record<string, number>;
    geographic_distribution: Record<string, number>;
    devices: any[];
  };
  us_data: FDACompetitiveData;
  cross_reference_matches: {
    matched_companies: string[];
    potential_global_competitors: string[];
  };
  market_insights: {
    eu_market_concentration: number;
    us_market_concentration: number;
    regulatory_complexity_score: number;
    global_market_opportunity: string;
  };
  generated_at: string;
}

export interface FDASearchParams {
  search?: string;
  product_code?: string;
  product_codes?: string[]; // Multiple product codes for search
  device_class?: string;
  applicant?: string;
  limit?: number;
  skip?: number;
}

export interface FDAApiResponse<T> {
  meta: {
    disclaimer: string;
    terms: string;
    license: string;
    last_updated: string;
    results?: {
      skip: number;
      limit: number;
      total: number;
    };
  };
  results?: T[];
}