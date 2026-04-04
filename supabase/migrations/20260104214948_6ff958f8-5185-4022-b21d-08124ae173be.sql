-- Add IP Strategy & FTO fields to products table for Genesis investor readiness
-- These are product-specific strategy fields, separate from company-level IP assets

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS ip_strategy_summary TEXT,
ADD COLUMN IF NOT EXISTS ip_protection_types TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ip_ownership_status TEXT CHECK (ip_ownership_status IN ('company_owned', 'founder_owned', 'university_licensed', 'pending_assignment', 'mixed')),
ADD COLUMN IF NOT EXISTS ip_ownership_notes TEXT,
ADD COLUMN IF NOT EXISTS fto_risk_level TEXT CHECK (fto_risk_level IN ('none', 'internal_review', 'legal_opinion', 'litigation_pending')),
ADD COLUMN IF NOT EXISTS fto_analysis_date DATE,
ADD COLUMN IF NOT EXISTS fto_notes TEXT,
ADD COLUMN IF NOT EXISTS is_software_project BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS samd_license_audit_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS samd_gpl_code_present BOOLEAN,
ADD COLUMN IF NOT EXISTS samd_license_notes TEXT,
ADD COLUMN IF NOT EXISTS ip_strategy_completed BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.products.ip_strategy_summary IS 'High-level description of IP protection strategy for investors';
COMMENT ON COLUMN public.products.ip_protection_types IS 'Array of protection types: patent, trade_secret, copyright, design_right';
COMMENT ON COLUMN public.products.ip_ownership_status IS 'Current ownership status of core IP assets';
COMMENT ON COLUMN public.products.fto_risk_level IS 'Freedom to Operate risk assessment level';
COMMENT ON COLUMN public.products.is_software_project IS 'Whether this is a SaMD/software project requiring license audit';
COMMENT ON COLUMN public.products.samd_license_audit_completed IS 'Whether open source license audit has been completed';
COMMENT ON COLUMN public.products.samd_gpl_code_present IS 'Whether GPL/copyleft licensed code is present';
COMMENT ON COLUMN public.products.ip_strategy_completed IS 'Whether IP strategy section is completed for Genesis checklist';