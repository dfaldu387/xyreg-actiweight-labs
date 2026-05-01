
-- 1) Drop the global unique constraint on ccr_id (companies must be isolated)
ALTER TABLE public.change_control_requests
  DROP CONSTRAINT IF EXISTS change_control_requests_ccr_id_key;

-- 2) Renumber existing CCRs per-company (now safe, no global unique)
WITH renumbered AS (
  SELECT
    id,
    'CCR-' || TO_CHAR(created_at, 'YYYY') || '-' ||
      LPAD(
        ROW_NUMBER() OVER (
          PARTITION BY company_id, TO_CHAR(created_at, 'YYYY')
          ORDER BY created_at
        )::TEXT,
      4, '0') AS new_ccr_id
  FROM public.change_control_requests
)
UPDATE public.change_control_requests c
SET ccr_id = r.new_ccr_id
FROM renumbered r
WHERE c.id = r.id
  AND c.ccr_id IS DISTINCT FROM r.new_ccr_id;

-- 3) Add a per-company unique constraint instead
ALTER TABLE public.change_control_requests
  ADD CONSTRAINT change_control_requests_company_ccr_id_key
  UNIQUE (company_id, ccr_id);

-- 4) Per-company CCR ID generation trigger function
CREATE OR REPLACE FUNCTION public.generate_ccr_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  new_ccr_id TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(ccr_id FROM 'CCR-' || year_part || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO sequence_num
  FROM public.change_control_requests
  WHERE ccr_id LIKE 'CCR-' || year_part || '-%'
    AND company_id = NEW.company_id;

  new_ccr_id := 'CCR-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
  NEW.ccr_id := new_ccr_id;

  RETURN NEW;
END;
$function$;
