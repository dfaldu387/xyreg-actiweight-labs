-- Add funding/capital requirement columns to company_investor_share_settings
ALTER TABLE company_investor_share_settings
ADD COLUMN funding_amount integer,
ADD COLUMN funding_currency text DEFAULT 'EUR',
ADD COLUMN funding_stage text;

-- Add comment for documentation
COMMENT ON COLUMN company_investor_share_settings.funding_amount IS 'Amount of capital being sought in smallest currency units (cents)';
COMMENT ON COLUMN company_investor_share_settings.funding_currency IS 'Currency code for funding amount (default EUR)';
COMMENT ON COLUMN company_investor_share_settings.funding_stage IS 'Funding round stage: pre-seed, seed, series-a, series-b, bridge, other';