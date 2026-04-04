-- Fix C1 Risk Management timeline calculation issue
-- The problem: C1 is a continuous process that should start at day 0 (project start)
-- but existing lifecycle_phases still have old calculated dates

-- Step 1: Update the lifecycle_phases for the current product to fix C1 dates
WITH project_start AS (
  SELECT MIN(start_date) as project_start_date
  FROM lifecycle_phases 
  WHERE product_id = '11d98c61-f080-47c1-a189-81ac6ed6f647'
    AND start_date IS NOT NULL
  LIMIT 1
)
UPDATE lifecycle_phases 
SET start_date = (SELECT project_start_date FROM project_start),
    end_date = (SELECT project_start_date FROM project_start) + interval '795 days'
WHERE product_id = '11d98c61-f080-47c1-a189-81ac6ed6f647'
  AND name = '(C1) Risk Management';

-- Step 2: Create a function to recalculate continuous process dates for any product
CREATE OR REPLACE FUNCTION recalculate_continuous_process_dates(target_product_id uuid)
RETURNS TABLE(phase_name text, old_start_date date, new_start_date date, old_end_date date, new_end_date date)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_start_date date;
  phase_rec RECORD;
BEGIN
  -- Get the project start date (earliest phase start date)
  SELECT MIN(lp.start_date) INTO project_start_date
  FROM lifecycle_phases lp
  WHERE lp.product_id = target_product_id
    AND lp.start_date IS NOT NULL;
    
  IF project_start_date IS NULL THEN
    RAISE EXCEPTION 'No project start date found for product %', target_product_id;
  END IF;
  
  -- Update all continuous processes to start at project start
  FOR phase_rec IN 
    SELECT lp.id, lp.name, lp.start_date, lp.end_date, cp.typical_duration_days
    FROM lifecycle_phases lp
    JOIN company_phases cp ON cp.id = lp.phase_id
    WHERE lp.product_id = target_product_id
      AND cp.is_continuous_process = true
      AND cp.typical_start_day = 0
  LOOP
    -- Return the changes being made
    RETURN QUERY SELECT 
      phase_rec.name,
      phase_rec.start_date,
      project_start_date,
      phase_rec.end_date,
      (project_start_date + (phase_rec.typical_duration_days || ' days')::interval)::date;
    
    -- Update the phase dates
    UPDATE lifecycle_phases 
    SET start_date = project_start_date,
        end_date = (project_start_date + (phase_rec.typical_duration_days || ' days')::interval)::date
    WHERE id = phase_rec.id;
  END LOOP;
END;
$$;