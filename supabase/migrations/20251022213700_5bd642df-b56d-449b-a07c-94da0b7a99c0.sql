-- Add consumption tracking fields for consumables in bundles
ALTER TABLE product_bundle_members
ADD COLUMN consumption_rate NUMERIC,
ADD COLUMN consumption_period TEXT CHECK (consumption_period IN ('per_use', 'per_procedure', 'per_day', 'per_week', 'per_month', 'per_year'));

COMMENT ON COLUMN product_bundle_members.consumption_rate IS 'Number of units consumed per period (for consumables)';
COMMENT ON COLUMN product_bundle_members.consumption_period IS 'Time period or usage unit for consumption rate';