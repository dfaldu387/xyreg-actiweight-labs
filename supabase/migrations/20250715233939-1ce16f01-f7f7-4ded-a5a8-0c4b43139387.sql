-- Fix C1 Risk Management to start at day 0 as it's a continuous process
-- Update the company_phases table to set typical_start_day = 0 for Risk Management

UPDATE company_phases 
SET typical_start_day = 0
WHERE name = '(C1) Risk Management' 
  AND is_continuous_process = true;

-- Also update any existing lifecycle_phases for this specific product
-- to reflect the correct start date (project start date)
WITH project_start AS (
  SELECT start_date as project_start_date
  FROM lifecycle_phases 
  WHERE product_id = '11d98c61-f080-47c1-a189-81ac6ed6f647'
    AND name = '(01) Concept & Feasibility'
  LIMIT 1
)
UPDATE lifecycle_phases 
SET start_date = (SELECT project_start_date FROM project_start),
    end_date = (SELECT project_start_date FROM project_start) + interval '795 days'
WHERE product_id = '11d98c61-f080-47c1-a189-81ac6ed6f647'
  AND name = '(C1) Risk Management';