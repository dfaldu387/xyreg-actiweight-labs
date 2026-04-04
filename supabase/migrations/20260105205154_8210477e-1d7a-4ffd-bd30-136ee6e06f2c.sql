-- Add heor_by_market JSONB column for market-specific HEOR data
-- This allows different health economics models per target market
ALTER TABLE product_reimbursement_strategy
ADD COLUMN IF NOT EXISTS heor_by_market JSONB DEFAULT '{}'::jsonb;

-- Add value_dossier_by_market JSONB column for market-specific value dossier data
ALTER TABLE product_reimbursement_strategy
ADD COLUMN IF NOT EXISTS value_dossier_by_market JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN product_reimbursement_strategy.heor_by_market IS 'Market-specific HEOR data structured as { "US": { heor_model_type, cost_per_procedure_current, ... }, "EU": { ... } }';
COMMENT ON COLUMN product_reimbursement_strategy.value_dossier_by_market IS 'Market-specific value dossier data structured as { "US": { status, evidence }, "EU": { ... } }';