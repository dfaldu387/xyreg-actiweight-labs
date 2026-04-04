-- Fix the phase dates to match the expected timeframe (Jan 1 - Feb 10, 2025)
-- Get the first phase ID that contains "Concept" 
UPDATE lifecycle_phases 
SET start_date = '2025-01-01', end_date = '2025-02-10'
WHERE product_id = '9e794e95-ecfe-4e6b-8b9b-ae371c16b272' 
AND LOWER(name) LIKE '%concept%';

-- For other phases, space them out after the concept phase
UPDATE lifecycle_phases 
SET start_date = '2025-02-11', end_date = '2025-03-11'
WHERE product_id = '9e794e95-ecfe-4e6b-8b9b-ae371c16b272' 
AND LOWER(name) NOT LIKE '%concept%'
AND position = (
  SELECT MIN(position) FROM lifecycle_phases 
  WHERE product_id = '9e794e95-ecfe-4e6b-8b9b-ae371c16b272' 
  AND LOWER(name) NOT LIKE '%concept%'
);