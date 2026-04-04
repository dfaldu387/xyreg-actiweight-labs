-- Clean up duplicate lifecycle_phases entries and add unique constraint
-- Step 1: Remove duplicate lifecycle_phases, keeping only the most recent entry
WITH ranked_phases AS (
  SELECT 
    id,
    product_id,
    phase_id,
    ROW_NUMBER() OVER (
      PARTITION BY product_id, phase_id 
      ORDER BY updated_at DESC, inserted_at DESC
    ) as rn
  FROM lifecycle_phases
),
duplicates_to_delete AS (
  SELECT id 
  FROM ranked_phases 
  WHERE rn > 1
)
DELETE FROM lifecycle_phases 
WHERE id IN (SELECT id FROM duplicates_to_delete);

-- Step 2: Add unique constraint to prevent future duplicates
ALTER TABLE lifecycle_phases 
ADD CONSTRAINT unique_product_phase 
UNIQUE (product_id, phase_id);

-- Step 3: Create function to safely sync product phases without duplicates
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
  -- Get company phases in correct order
  FOR phase_record IN 
    SELECT 
      cp.id as phase_id,
      cp.name,
      cp.description,
      ccp.position
    FROM company_chosen_phases ccp
    JOIN company_phases cp ON cp.id = ccp.phase_id
    WHERE ccp.company_id = target_company_id
    ORDER BY ccp.position
  LOOP
    -- Use INSERT ... ON CONFLICT to prevent duplicates
    INSERT INTO lifecycle_phases (
      product_id,
      phase_id,
      name,
      description,
      status
    ) VALUES (
      target_product_id,
      phase_record.phase_id,
      phase_record.name,
      phase_record.description,
      'Not Started'
    )
    ON CONFLICT (product_id, phase_id) 
    DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      updated_at = now();
    
    synced_count := synced_count + 1;
  END LOOP;
  
  RETURN synced_count;
END;
$$;