-- Update Launch & Post-Launch phase duration from -1 to 100 days
UPDATE company_phases 
SET typical_duration_days = 100
WHERE name = '(08) Launch & Post-Launch' 
  AND typical_duration_days = -1;