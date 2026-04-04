-- Update the sync_product_phases_safe function to handle both INSERT and UPDATE operations
CREATE OR REPLACE FUNCTION sync_product_phases_safe(
  target_product_id uuid,
  target_company_id uuid
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  phase_record RECORD;
  synced_count integer := 0;
BEGIN
  -- Loop through all company chosen phases for the target company
  FOR phase_record IN 
    SELECT 
      ccp.phase_id,
      ccp.position,
      cp.name,
      cp.description,
      cp.is_pre_launch,
      cp.cost_category,
      cp.typical_start_day,
      cp.typical_duration_days,
      cp.is_continuous_process
    FROM company_chosen_phases ccp
    JOIN company_phases cp ON cp.id = ccp.phase_id
    WHERE ccp.company_id = target_company_id
    ORDER BY ccp.position
  LOOP
    -- Use UPSERT (INSERT ... ON CONFLICT DO UPDATE) to handle both new and existing phases
    INSERT INTO lifecycle_phases (
      product_id,
      phase_id,
      name,
      description,
      is_pre_launch,
      cost_category,
      typical_start_day,
      typical_duration_days,
      is_continuous_process,
      position
    ) VALUES (
      target_product_id,
      phase_record.phase_id,
      phase_record.name,
      phase_record.description,
      phase_record.is_pre_launch,
      phase_record.cost_category,
      phase_record.typical_start_day,
      phase_record.typical_duration_days,
      phase_record.is_continuous_process,
      phase_record.position
    )
    ON CONFLICT (product_id, phase_id) 
    DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      is_pre_launch = EXCLUDED.is_pre_launch,
      cost_category = EXCLUDED.cost_category,
      typical_start_day = EXCLUDED.typical_start_day,
      typical_duration_days = EXCLUDED.typical_duration_days,
      is_continuous_process = EXCLUDED.is_continuous_process,
      position = EXCLUDED.position,
      updated_at = now();

    synced_count := synced_count + 1;
  END LOOP;

  -- Remove any lifecycle phases that are no longer in the company's chosen phases
  DELETE FROM lifecycle_phases lp
  WHERE lp.product_id = target_product_id
    AND NOT EXISTS (
      SELECT 1 FROM company_chosen_phases ccp 
      WHERE ccp.company_id = target_company_id 
      AND ccp.phase_id = lp.phase_id
    );

  RETURN synced_count;
END;
$$;