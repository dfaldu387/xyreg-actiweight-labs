
CREATE TABLE public.ccr_reviewer_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ccr_id UUID NOT NULL REFERENCES public.change_control_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  perspectives TEXT[] NOT NULL DEFAULT '{}',
  approved_perspectives TEXT[] NOT NULL DEFAULT '{}',
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ccr_id, user_id)
);

CREATE INDEX idx_ccr_reviewer_assignments_ccr ON public.ccr_reviewer_assignments(ccr_id);
CREATE INDEX idx_ccr_reviewer_assignments_user ON public.ccr_reviewer_assignments(user_id);

CREATE OR REPLACE FUNCTION public.validate_ccr_perspectives()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  allowed TEXT[] := ARRAY['reviewer','clinical','usability','manufacturing','cybersecurity','supply_chain','labeling','quality','regulatory'];
  p TEXT;
BEGIN
  IF NEW.perspectives IS NULL OR array_length(NEW.perspectives,1) IS NULL THEN
    RAISE EXCEPTION 'At least one perspective is required';
  END IF;
  FOREACH p IN ARRAY NEW.perspectives LOOP
    IF NOT (p = ANY(allowed)) THEN
      RAISE EXCEPTION 'Invalid perspective: %', p;
    END IF;
  END LOOP;
  IF NEW.approved_perspectives IS NOT NULL THEN
    FOREACH p IN ARRAY NEW.approved_perspectives LOOP
      IF NOT (p = ANY(NEW.perspectives)) THEN
        RAISE EXCEPTION 'Approved perspective % not in assigned perspectives', p;
      END IF;
    END LOOP;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_ccr_perspectives
BEFORE INSERT OR UPDATE ON public.ccr_reviewer_assignments
FOR EACH ROW EXECUTE FUNCTION public.validate_ccr_perspectives();

ALTER TABLE public.ccr_reviewer_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View CCR reviewer assignments for company"
ON public.ccr_reviewer_assignments FOR SELECT
USING (ccr_id IN (SELECT id FROM public.change_control_requests
  WHERE company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid())));

CREATE POLICY "Insert CCR reviewer assignments for company"
ON public.ccr_reviewer_assignments FOR INSERT
WITH CHECK (ccr_id IN (SELECT id FROM public.change_control_requests
  WHERE company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid())));

CREATE POLICY "Update CCR reviewer assignments for company"
ON public.ccr_reviewer_assignments FOR UPDATE
USING (ccr_id IN (SELECT id FROM public.change_control_requests
  WHERE company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid())));

CREATE POLICY "Delete CCR reviewer assignments for company"
ON public.ccr_reviewer_assignments FOR DELETE
USING (ccr_id IN (SELECT id FROM public.change_control_requests
  WHERE company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid())));

-- Backfill from legacy 3 reviewer columns
WITH legacy AS (
  SELECT id AS ccr_id, technical_reviewer_id AS user_id, 'reviewer'::text AS persp,
         technical_approved AS approved, technical_approved_at AS at_, technical_approved_by AS by_
  FROM public.change_control_requests WHERE technical_reviewer_id IS NOT NULL
  UNION ALL
  SELECT id, quality_reviewer_id, 'quality', quality_approved, quality_approved_at, quality_approved_by
  FROM public.change_control_requests WHERE quality_reviewer_id IS NOT NULL
  UNION ALL
  SELECT id, regulatory_reviewer_id, 'regulatory', regulatory_approved, regulatory_approved_at, regulatory_approved_by
  FROM public.change_control_requests WHERE regulatory_reviewer_id IS NOT NULL
),
agg AS (
  SELECT ccr_id, user_id,
    array_agg(DISTINCT persp) AS persps,
    array_agg(DISTINCT persp) FILTER (WHERE approved) AS approved_persps,
    max(at_) AS at_,
    (array_agg(by_) FILTER (WHERE by_ IS NOT NULL))[1] AS by_
  FROM legacy GROUP BY ccr_id, user_id
)
INSERT INTO public.ccr_reviewer_assignments (ccr_id, user_id, perspectives, approved_perspectives, approved_at, approved_by)
SELECT ccr_id, user_id, persps, COALESCE(approved_persps, ARRAY[]::text[]), at_, by_
FROM agg
ON CONFLICT (ccr_id, user_id) DO NOTHING;
