-- Fix Phase 08 configuration: should be linear, not continuous
UPDATE company_phases 
SET is_continuous_process = false,
    typical_duration_days = 90
WHERE name = '(08) Launch & Post-Launch' 
  AND is_continuous_process = true;

-- Fix C1 timing: should start after phase 08 completes (day 885)
UPDATE company_phases 
SET typical_start_day = 885
WHERE name = '(C1) Risk Management' 
  AND is_continuous_process = true;