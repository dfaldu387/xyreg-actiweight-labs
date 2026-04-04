-- Update the Concept & Feasibility phase to have correct dates (Jan 1 - Feb 10, 2025)
UPDATE milestone_phases 
SET 
  start_date = '2025-01-01'::date,
  end_date = '2025-02-10'::date,
  updated_at = now()
WHERE product_id = '9e794e95-ecfe-4e6b-8b9b-ae371c16b272' 
AND phase_name = 'Concept & Feasibility';