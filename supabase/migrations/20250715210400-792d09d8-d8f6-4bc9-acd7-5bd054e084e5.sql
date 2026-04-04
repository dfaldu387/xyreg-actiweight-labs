-- Update Launch & Post-Launch phase to be continuous process with unlimited duration
UPDATE company_phases 
SET is_continuous_process = true,
    typical_duration_days = null
WHERE name = '(08) Launch & Post-Launch';

-- Ensure Post-Market Surveillance is also properly configured as continuous
UPDATE company_phases 
SET is_continuous_process = true,
    typical_duration_days = null
WHERE name = '(C4) Post-Market Surveillance (PMS)' 
  AND (is_continuous_process = false OR typical_duration_days IS NOT NULL);