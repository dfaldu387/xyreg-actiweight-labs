-- Update lifecycle_phases to reflect the corrected company_phases configuration
-- Product ID from the current route: 11d98c61-f080-47c1-a189-81ac6ed6f647

-- First, let's update Phase 08 to be linear with proper end date
UPDATE lifecycle_phases 
SET end_date = start_date + interval '90 days',
    status = 'Not Started'
WHERE product_id = '11d98c61-f080-47c1-a189-81ac6ed6f647'
  AND name = '(08) Launch & Post-Launch';

-- Now update C1 to start after Phase 08 completes (day 885 from project start)
-- Assuming project started around 2025-01-01, day 885 would be approximately 2027-05-27
WITH project_start AS (
  SELECT start_date as project_start_date
  FROM lifecycle_phases 
  WHERE product_id = '11d98c61-f080-47c1-a189-81ac6ed6f647'
    AND name = '(1) Concept & Feasibility'
  LIMIT 1
),
phase_08_end AS (
  SELECT end_date as phase_08_end_date
  FROM lifecycle_phases 
  WHERE product_id = '11d98c61-f080-47c1-a189-81ac6ed6f647'
    AND name = '(08) Launch & Post-Launch'
  LIMIT 1
)
UPDATE lifecycle_phases 
SET start_date = (SELECT phase_08_end_date FROM phase_08_end),
    end_date = (SELECT phase_08_end_date FROM phase_08_end) + interval '365 days',
    status = 'Not Started'
WHERE product_id = '11d98c61-f080-47c1-a189-81ac6ed6f647'
  AND name = '(C1) Risk Management';