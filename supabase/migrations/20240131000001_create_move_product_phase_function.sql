
-- Create a database function to handle product phase moves reliably
CREATE OR REPLACE FUNCTION public.move_product_to_phase(
  target_product_id uuid,
  target_phase_id uuid,
  target_phase_name text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_phase_id uuid;
BEGIN
  -- Check if lifecycle_phases record exists
  SELECT id INTO existing_phase_id
  FROM public.lifecycle_phases
  WHERE product_id = target_product_id
  AND is_current_phase = true;

  IF existing_phase_id IS NOT NULL THEN
    -- Update existing record
    UPDATE public.lifecycle_phases
    SET 
      phase_id = target_phase_id,
      name = target_phase_name,
      updated_at = NOW()
    WHERE id = existing_phase_id;
  ELSE
    -- Create new record
    INSERT INTO public.lifecycle_phases (
      product_id,
      phase_id,
      name,
      is_current_phase,
      status,
      progress
    ) VALUES (
      target_product_id,
      target_phase_id,
      target_phase_name,
      true,
      'In Progress',
      0
    );
  END IF;

  -- Update product's current_lifecycle_phase
  UPDATE public.products
  SET 
    current_lifecycle_phase = target_phase_name,
    updated_at = NOW()
  WHERE id = target_product_id;

  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Failed to move product to phase: %', SQLERRM;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.move_product_to_phase(uuid, uuid, text) TO authenticated;
