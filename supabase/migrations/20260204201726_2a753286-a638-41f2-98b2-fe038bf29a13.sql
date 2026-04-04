-- Migration: Rename all LoA (Likelihood of Approval) columns to LoS (Likelihood of Success)

-- 1. bundle_product_rnpv_inputs
ALTER TABLE bundle_product_rnpv_inputs RENAME COLUMN commercial_loa TO commercial_los;
ALTER TABLE bundle_product_rnpv_inputs RENAME COLUMN regulatory_loa TO regulatory_los;
ALTER TABLE bundle_product_rnpv_inputs RENAME COLUMN technical_loa TO technical_los;

-- 2. bundle_rnpv_analyses
ALTER TABLE bundle_rnpv_analyses RENAME COLUMN weighted_average_loa TO weighted_average_los;

-- 3. commercial_factor_categories
ALTER TABLE commercial_factor_categories RENAME COLUMN suggested_loa_range TO suggested_los_range;

-- 4. commercial_success_factors
ALTER TABLE commercial_success_factors RENAME COLUMN likelihood_of_approval TO likelihood_of_success;

-- 5. expert_loa_assessments (rename table too)
ALTER TABLE expert_loa_assessments RENAME COLUMN assessed_loa TO assessed_los;
ALTER TABLE expert_loa_assessments RENAME TO expert_los_assessments;

-- 6. feasibility_financial_analysis
ALTER TABLE feasibility_financial_analysis RENAME COLUMN commercial_loa TO commercial_los;
ALTER TABLE feasibility_financial_analysis RENAME COLUMN technical_loa TO technical_los;

-- 7. feasibility_phase_templates
ALTER TABLE feasibility_phase_templates RENAME COLUMN likelihood_of_approval TO likelihood_of_success;

-- 8. feasibility_portfolios
ALTER TABLE feasibility_portfolios RENAME COLUMN loa_methodology TO los_methodology;
ALTER TABLE feasibility_portfolios RENAME COLUMN loa_scope TO los_scope;

-- 9. lifecycle_phases (main table for phase LoS)
ALTER TABLE lifecycle_phases RENAME COLUMN likelihood_of_approval TO likelihood_of_success;

-- 10. market_extensions
ALTER TABLE market_extensions RENAME COLUMN market_commercial_loa TO market_commercial_los;

-- 11. platform_projects
ALTER TABLE platform_projects RENAME COLUMN platform_technical_loa TO platform_technical_los;

-- 12. rnpv_calculations
ALTER TABLE rnpv_calculations RENAME COLUMN cumulative_commercial_loa TO cumulative_commercial_los;
ALTER TABLE rnpv_calculations RENAME COLUMN cumulative_technical_loa TO cumulative_technical_los;

-- 13. rnpv_scenarios
ALTER TABLE rnpv_scenarios RENAME COLUMN loa_adjustments TO los_adjustments;