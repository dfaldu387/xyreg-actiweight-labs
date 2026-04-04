-- Add current_phase column to company_investor_share_settings table
ALTER TABLE company_investor_share_settings
ADD COLUMN current_phase TEXT CHECK (current_phase IN (
  'concept-planning',
  'design-inputs',
  'design-development',
  'verification-validation',
  'transfer-production',
  'market-surveillance'
)) DEFAULT 'concept-planning';

COMMENT ON COLUMN company_investor_share_settings.current_phase IS 'Current ISO 13485 development phase for investor timeline display';