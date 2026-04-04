// Investor Profile Types

export interface InvestorProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  company_name: string | null;
  linkedin_url: string;
  investment_focus: string[];
  typical_check_size: string | null;
  accredited_self_cert: boolean;
  verification_tier: 'pending' | 'tier1' | 'tier2' | 'verified';
  verified_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvestorViewLog {
  id: string;
  investor_profile_id: string;
  share_settings_id: string;
  company_id: string;
  product_id: string | null;
  viewed_at: string;
  view_duration_seconds: number | null;
}

export interface InvestorViewLogWithProfile extends InvestorViewLog {
  investor_profiles: InvestorProfile;
}

export interface MarketplaceListing {
  id: string;
  company_id: string;
  public_slug: string;
  marketplace_slug: string | null;
  marketplace_expires_at: string | null;
  is_active: boolean;
  list_on_marketplace: boolean;
  marketplace_listed_at: string | null;
  marketplace_categories: string[];
  view_count: number;
  current_phase: string | null;
  featured_product_id: string | null;
  // Funding requirements (for investor sharing)
  funding_amount: number | null;
  funding_currency: string | null;
  funding_stage: string | null;
  // Marketplace-specific funding requirements
  mp_funding_amount: number | null;
  mp_funding_currency: string | null;
  mp_funding_stage: string | null;
  // Marketplace visibility settings
  mp_show_viability_score?: boolean;
  mp_show_technical_specs?: boolean;
  mp_show_media_gallery?: boolean;
  mp_show_business_canvas?: boolean;
  mp_show_roadmap?: boolean;
  mp_show_team_profile?: boolean;
  mp_show_venture_blueprint?: boolean;
  mp_show_market_sizing?: boolean;
  mp_show_reimbursement_strategy?: boolean;
  mp_show_team_gaps?: boolean;
  mp_show_regulatory_timeline?: boolean;
  mp_show_clinical_evidence?: boolean;
  mp_show_readiness_gates?: boolean;
  mp_show_gtm_strategy?: boolean;
  mp_show_key_risks?: boolean;
  mp_show_manufacturing?: boolean;
  mp_show_unit_economics?: boolean;
  mp_show_use_of_proceeds?: boolean;
  // Joined data
  companies: {
    id: string;
    name: string;
    logo_url: string | null;
    description: string | null;
  };
  products?: {
    id: string;
    name: string;
    description: string | null;
    device_category: string | null;
    markets: any;
    images: any[] | null;
  };
  product_viability_scorecards?: {
    total_score: number | null;
  }[];
  business_canvas?: {
    value_propositions: string | null;
  };
}

export const INVESTMENT_FOCUS_OPTIONS = [
  'MedTech',
  'HealthTech', 
  'Diagnostics',
  'Digital Health',
  'Therapeutics',
  'Medical Devices',
  'Biotech',
  'AI in Healthcare',
  'Wearables',
  'Surgical Tech',
];

export const CHECK_SIZE_OPTIONS = [
  '$10K - $50K',
  '$50K - $100K',
  '$100K - $250K',
  '$250K - $500K',
  '$500K - $1M',
  '$1M+',
];

export const DEVICE_CATEGORY_OPTIONS = [
  'Diagnostic',
  'Therapeutic',
  'Monitoring',
  'Surgical',
  'Implantable',
  'In Vitro Diagnostic',
  'Digital Health',
  'Wearable',
  'Other',
];
