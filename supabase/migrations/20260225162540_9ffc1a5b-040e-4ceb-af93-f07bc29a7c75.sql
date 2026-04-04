CREATE OR REPLACE FUNCTION public.generate_dr_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  next_num integer;
  yr text;
BEGIN
  yr := to_char(now(), 'YYYY');

  -- Prevent concurrent inserts from generating the same DR number
  PERFORM pg_advisory_xact_lock(hashtext('design_reviews_dr_id_' || yr));

  SELECT COALESCE(MAX((regexp_replace(dr_id, '^DR-' || yr || '-', ''))::integer), 0) + 1
  INTO next_num
  FROM public.design_reviews
  WHERE dr_id LIKE 'DR-' || yr || '-%';

  NEW.dr_id := 'DR-' || yr || '-' || lpad(next_num::text, 4, '0');
  RETURN NEW;
END;
$function$;