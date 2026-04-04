-- Create function to count EUDAMED devices by SRN (id_srn)
CREATE OR REPLACE FUNCTION public.count_eudamed_devices_by_srn(p_srn text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  device_count integer;
BEGIN
  IF p_srn IS NULL OR length(trim(p_srn)) = 0 THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*)::integer INTO device_count
  FROM eudamed.medical_devices e
  WHERE e.id_srn = p_srn
    AND e.udi_di IS NOT NULL;

  RETURN COALESCE(device_count, 0);
END;
$$;