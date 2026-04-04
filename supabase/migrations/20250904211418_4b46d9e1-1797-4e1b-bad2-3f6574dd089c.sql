-- Fix PMS phase start date to use the actual launch date (2026-09-18)
-- The PMS phase should start on launch date + 0 days = 2026-09-18
-- The PMS phase should end on launch date + 1000 days = 2029-06-15

UPDATE lifecycle_phases 
SET start_date = '2026-09-18',
    end_date = '2029-06-15'
WHERE id = '09313b1c-d21f-4335-bef6-2dd4e1d46b1b'
  AND product_id = '9e794e95-ecfe-4e6b-8b9b-ae371c16b272';

-- Log the update
SELECT 'Updated PMS phase dates' as result, 
       start_date, 
       end_date 
FROM lifecycle_phases 
WHERE id = '09313b1c-d21f-4335-bef6-2dd4e1d46b1b';