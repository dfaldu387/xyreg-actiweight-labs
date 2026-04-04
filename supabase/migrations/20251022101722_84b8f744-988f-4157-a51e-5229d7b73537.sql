-- Phase 4: Update feasibility tables for risk & assumptions schema

-- Update feasibility_risk_assessments table
ALTER TABLE feasibility_risk_assessments
  RENAME COLUMN risk_category TO category;

ALTER TABLE feasibility_risk_assessments
  RENAME COLUMN likelihood_of_approval TO probability_percent;

ALTER TABLE feasibility_risk_assessments
  ADD COLUMN IF NOT EXISTS impact_score integer NOT NULL DEFAULT 5 CHECK (impact_score >= 1 AND impact_score <= 10);

ALTER TABLE feasibility_risk_assessments
  ADD COLUMN IF NOT EXISTS is_portfolio_level boolean NOT NULL DEFAULT true;

ALTER TABLE feasibility_risk_assessments
  DROP COLUMN IF EXISTS confidence_level,
  DROP COLUMN IF EXISTS impact_on_valuation,
  DROP COLUMN IF EXISTS justification,
  DROP COLUMN IF EXISTS is_custom_category,
  DROP COLUMN IF EXISTS position;

-- Update feasibility_assumptions table
ALTER TABLE feasibility_assumptions
  RENAME COLUMN assumption_category TO category;

ALTER TABLE feasibility_assumptions
  ADD COLUMN IF NOT EXISTS portfolio_product_id uuid REFERENCES feasibility_portfolio_products(id) ON DELETE CASCADE;

ALTER TABLE feasibility_assumptions
  ADD COLUMN IF NOT EXISTS rationale text;

ALTER TABLE feasibility_assumptions
  ADD COLUMN IF NOT EXISTS is_portfolio_level boolean NOT NULL DEFAULT true;

ALTER TABLE feasibility_assumptions
  ALTER COLUMN confidence_level SET DEFAULT 'medium',
  ALTER COLUMN confidence_level SET NOT NULL;

ALTER TABLE feasibility_assumptions
  DROP COLUMN IF EXISTS created_by,
  DROP COLUMN IF EXISTS impact_if_wrong,
  DROP COLUMN IF EXISTS mitigation_plan;