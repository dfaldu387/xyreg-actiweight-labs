-- Add Health Economics (HEOR) fields to product_reimbursement_strategy table
ALTER TABLE product_reimbursement_strategy
ADD COLUMN IF NOT EXISTS heor_model_type TEXT,
ADD COLUMN IF NOT EXISTS cost_per_procedure_current DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS cost_per_procedure_new DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS cost_savings_per_procedure DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS procedure_volume_annual INTEGER,
ADD COLUMN IF NOT EXISTS cost_savings_annual DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS qaly_gain_estimate DECIMAL(5,3),
ADD COLUMN IF NOT EXISTS icer_value DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS icer_currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS willingness_to_pay_threshold DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS budget_impact_year1 DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS budget_impact_year2 DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS budget_impact_year3 DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS budget_impact_notes TEXT,
ADD COLUMN IF NOT EXISTS device_capital_cost DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS payback_period_months INTEGER,
ADD COLUMN IF NOT EXISTS roi_percent DECIMAL(6,2),
ADD COLUMN IF NOT EXISTS heor_evidence_sources JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS heor_assumptions TEXT,
ADD COLUMN IF NOT EXISTS heor_completed BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN product_reimbursement_strategy.heor_model_type IS 'Type of HEOR model: cost_savings, cost_utility, budget_impact, roi';