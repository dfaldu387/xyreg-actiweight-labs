-- Document Draft Tab Groups
CREATE TABLE public.document_draft_tab_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  owner_user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  member_ci_ids UUID[] NOT NULL DEFAULT '{}',
  last_opened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ddtg_company ON public.document_draft_tab_groups(company_id);
CREATE INDEX idx_ddtg_owner ON public.document_draft_tab_groups(owner_user_id);

ALTER TABLE public.document_draft_tab_groups ENABLE ROW LEVEL SECURITY;

-- Helper: does the current user belong to this company?
-- Reuse existing pattern: check user_company_access
CREATE POLICY "View own or shared groups in company"
ON public.document_draft_tab_groups
FOR SELECT
USING (
  owner_user_id = auth.uid()
  OR (
    is_shared = true
    AND EXISTS (
      SELECT 1 FROM public.user_company_access uca
      WHERE uca.user_id = auth.uid() AND uca.company_id = document_draft_tab_groups.company_id
    )
  )
);

CREATE POLICY "Owner can insert groups"
ON public.document_draft_tab_groups
FOR INSERT
WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Owner can update own groups"
ON public.document_draft_tab_groups
FOR UPDATE
USING (owner_user_id = auth.uid());

CREATE POLICY "Owner can delete own groups"
ON public.document_draft_tab_groups
FOR DELETE
USING (owner_user_id = auth.uid());

-- updated_at trigger
CREATE TRIGGER update_ddtg_updated_at
BEFORE UPDATE ON public.document_draft_tab_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Validation trigger: all member CI ids must belong to same company
CREATE OR REPLACE FUNCTION public.validate_ddtg_members()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bad_count INT;
BEGIN
  IF NEW.member_ci_ids IS NULL OR array_length(NEW.member_ci_ids, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM unnest(NEW.member_ci_ids) AS m(id)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.phase_assigned_document_template padt
    WHERE padt.id = m.id AND padt.company_id = NEW.company_id
  );

  IF bad_count > 0 THEN
    RAISE EXCEPTION 'All member_ci_ids must belong to company %', NEW.company_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_ddtg_members_trigger
BEFORE INSERT OR UPDATE ON public.document_draft_tab_groups
FOR EACH ROW
EXECUTE FUNCTION public.validate_ddtg_members();
