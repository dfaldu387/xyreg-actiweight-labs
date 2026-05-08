
CREATE OR REPLACE FUNCTION public.sop_subprefix(canonical text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE upper(canonical)
    WHEN 'SOP-001' THEN 'QA' WHEN 'SOP-002' THEN 'QA' WHEN 'SOP-003' THEN 'QA'
    WHEN 'SOP-004' THEN 'QA' WHEN 'SOP-021' THEN 'QA' WHEN 'SOP-022' THEN 'QA'
    WHEN 'SOP-023' THEN 'QA' WHEN 'SOP-024' THEN 'QA' WHEN 'SOP-025' THEN 'QA'
    WHEN 'SOP-028' THEN 'QA' WHEN 'SOP-031' THEN 'QA' WHEN 'SOP-032' THEN 'QA'
    WHEN 'SOP-033' THEN 'QA' WHEN 'SOP-042' THEN 'QA' WHEN 'SOP-050' THEN 'QA'
    WHEN 'SOP-005' THEN 'DE' WHEN 'SOP-006' THEN 'DE' WHEN 'SOP-007' THEN 'DE'
    WHEN 'SOP-008' THEN 'DE' WHEN 'SOP-009' THEN 'DE' WHEN 'SOP-011' THEN 'DE'
    WHEN 'SOP-012' THEN 'DE' WHEN 'SOP-019' THEN 'DE' WHEN 'SOP-026' THEN 'DE'
    WHEN 'SOP-027' THEN 'DE' WHEN 'SOP-029' THEN 'DE' WHEN 'SOP-045' THEN 'DE'
    WHEN 'SOP-049' THEN 'DE'
    WHEN 'SOP-015' THEN 'RM'
    WHEN 'SOP-014' THEN 'CL' WHEN 'SOP-047' THEN 'CL' WHEN 'SOP-048' THEN 'CL'
    WHEN 'SOP-013' THEN 'RA' WHEN 'SOP-034' THEN 'RA' WHEN 'SOP-035' THEN 'RA'
    WHEN 'SOP-036' THEN 'RA' WHEN 'SOP-037' THEN 'RA' WHEN 'SOP-038' THEN 'RA'
    WHEN 'SOP-044' THEN 'RA' WHEN 'SOP-046' THEN 'RA'
    WHEN 'SOP-010' THEN 'MF' WHEN 'SOP-017' THEN 'MF' WHEN 'SOP-018' THEN 'MF'
    WHEN 'SOP-020' THEN 'MF' WHEN 'SOP-039' THEN 'MF' WHEN 'SOP-040' THEN 'MF'
    WHEN 'SOP-041' THEN 'MF' WHEN 'SOP-051' THEN 'MF'
    WHEN 'SOP-016' THEN 'SC' WHEN 'SOP-030' THEN 'SC' WHEN 'SOP-043' THEN 'SC'
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION public.canonicalize_sop_id(legacy text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  num text;
  sub text;
BEGIN
  IF legacy IS NULL THEN RETURN NULL; END IF;
  IF legacy ~ '^SOP-[A-Z]{2,3}-[0-9]{1,3}$' THEN
    RETURN upper(legacy);
  END IF;
  IF legacy ~ '^SOP-[0-9]{1,3}$' THEN
    num := lpad(substring(legacy from '^SOP-([0-9]{1,3})$'), 3, '0');
    sub := public.sop_subprefix('SOP-' || num);
    IF sub IS NULL THEN
      RETURN legacy;
    END IF;
    RETURN 'SOP-' || sub || '-' || num;
  END IF;
  RETURN legacy;
END;
$$;

UPDATE public.phase_assigned_document_template
SET document_number = public.canonicalize_sop_id(document_number)
WHERE document_number ~ '^SOP-[0-9]{1,3}$'
  AND public.canonicalize_sop_id(document_number) <> document_number;

UPDATE public.phase_assigned_document_template
SET document_reference = public.canonicalize_sop_id(document_reference)
WHERE document_reference ~ '^SOP-[0-9]{1,3}$'
  AND public.canonicalize_sop_id(document_reference) <> document_reference;

CREATE OR REPLACE FUNCTION public.enforce_sop_subprefix()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.document_number IS NOT NULL
     AND NEW.document_number ~* '^SOP-'
     AND NEW.document_number !~ '^SOP-[A-Z]{2,3}-[0-9]{1,3}$'
  THEN
    RAISE EXCEPTION
      'SOP document_number must use the 3-part canonical form SOP-XX-NNN (got: %)',
      NEW.document_number
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_sop_subprefix ON public.phase_assigned_document_template;
CREATE TRIGGER trg_enforce_sop_subprefix
BEFORE INSERT OR UPDATE OF document_number
ON public.phase_assigned_document_template
FOR EACH ROW
EXECUTE FUNCTION public.enforce_sop_subprefix();
