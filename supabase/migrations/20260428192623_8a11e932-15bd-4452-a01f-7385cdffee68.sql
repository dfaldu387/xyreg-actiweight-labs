CREATE OR REPLACE FUNCTION public.rewrite_sop_tokens(input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  result text := input;
  mapping jsonb := '{
    "SOP-001":"QA","SOP-002":"QA","SOP-003":"QA","SOP-004":"QA",
    "SOP-021":"QA","SOP-022":"QA","SOP-023":"QA","SOP-024":"QA",
    "SOP-025":"QA","SOP-028":"QA","SOP-031":"QA","SOP-032":"QA",
    "SOP-033":"QA","SOP-042":"QA","SOP-050":"QA",
    "SOP-005":"DE","SOP-006":"DE","SOP-007":"DE","SOP-008":"DE",
    "SOP-009":"DE","SOP-011":"DE","SOP-012":"DE","SOP-019":"DE",
    "SOP-026":"DE","SOP-027":"DE","SOP-029":"DE","SOP-045":"DE",
    "SOP-049":"DE",
    "SOP-015":"RM",
    "SOP-014":"CL","SOP-047":"CL","SOP-048":"CL",
    "SOP-013":"RA","SOP-034":"RA","SOP-035":"RA","SOP-036":"RA",
    "SOP-037":"RA","SOP-038":"RA","SOP-044":"RA","SOP-046":"RA",
    "SOP-010":"MF","SOP-017":"MF","SOP-018":"MF","SOP-020":"MF",
    "SOP-039":"MF","SOP-040":"MF","SOP-041":"MF","SOP-051":"MF",
    "SOP-016":"SC","SOP-030":"SC","SOP-043":"SC"
  }'::jsonb;
  m record;
  key text;
  sub text;
  num int;
  padded text;
  replacement text;
BEGIN
  IF input IS NULL THEN RETURN NULL; END IF;

  FOR m IN
    SELECT DISTINCT (regexp_matches(result, '\mSOP-([0-9]{1,3})\M', 'gi'))[1] AS num_str
  LOOP
    num := m.num_str::int;
    padded := lpad(num::text, 3, '0');
    key := 'SOP-' || padded;
    sub := mapping ->> key;
    IF sub IS NULL THEN CONTINUE; END IF;
    replacement := 'SOP-' || sub || '-' || padded;
    result := regexp_replace(
      result,
      '\mSOP-0*' || num::text || '\M(?!-)',
      replacement,
      'gi'
    );
  END LOOP;

  RETURN result;
END;
$$;

UPDATE public.document_studio_templates
SET sections = public.rewrite_sop_tokens(sections::text)::jsonb,
    updated_at = now()
WHERE sections::text ~ 'SOP-[0-9]{1,3}([^0-9-]|$)';