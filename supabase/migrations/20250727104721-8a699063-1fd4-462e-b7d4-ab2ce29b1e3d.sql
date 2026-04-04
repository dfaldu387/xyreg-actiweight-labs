-- Add milestone budget and pre-launch classification fields to support rNPV integration

-- Add estimated_budget field to track development costs per phase
ALTER TABLE lifecycle_phases 
ADD COLUMN estimated_budget NUMERIC DEFAULT 0;

-- Add is_pre_launch field to classify phases for development cost calculation
ALTER TABLE lifecycle_phases 
ADD COLUMN is_pre_launch BOOLEAN DEFAULT true;

-- Add cost_category field to categorize different types of costs
ALTER TABLE lifecycle_phases 
ADD COLUMN cost_category TEXT DEFAULT 'development';

-- Add budget_currency field for multi-currency support
ALTER TABLE lifecycle_phases 
ADD COLUMN budget_currency TEXT DEFAULT 'USD';

-- Update company_phases table as well since it's used for phase management
ALTER TABLE company_phases 
ADD COLUMN estimated_budget NUMERIC DEFAULT 0;

ALTER TABLE company_phases 
ADD COLUMN is_pre_launch BOOLEAN DEFAULT true;

ALTER TABLE company_phases 
ADD COLUMN cost_category TEXT DEFAULT 'development';

ALTER TABLE company_phases 
ADD COLUMN budget_currency TEXT DEFAULT 'USD';

-- Add comments for documentation
COMMENT ON COLUMN lifecycle_phases.estimated_budget IS 'Estimated budget for this phase in the specified currency';
COMMENT ON COLUMN lifecycle_phases.is_pre_launch IS 'Whether this phase occurs before product launch (for rNPV development cost calculation)';
COMMENT ON COLUMN lifecycle_phases.cost_category IS 'Category of costs: development, regulatory, clinical, operational';
COMMENT ON COLUMN lifecycle_phases.budget_currency IS 'Currency code for the estimated budget (e.g., USD, EUR)';

COMMENT ON COLUMN company_phases.estimated_budget IS 'Estimated budget for this phase in the specified currency';
COMMENT ON COLUMN company_phases.is_pre_launch IS 'Whether this phase occurs before product launch (for rNPV development cost calculation)';
COMMENT ON COLUMN company_phases.cost_category IS 'Category of costs: development, regulatory, clinical, operational';
COMMENT ON COLUMN company_phases.budget_currency IS 'Currency code for the estimated budget (e.g., USD, EUR)';