-- Add continuous monitoring permission columns to company_investor_share_settings
ALTER TABLE company_investor_share_settings 
ADD COLUMN IF NOT EXISTS show_rnpv BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_burn_rate BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_clinical_enrollment BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_regulatory_status_map BOOLEAN DEFAULT true;