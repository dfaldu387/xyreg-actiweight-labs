-- Fix audit log trigger for review_assignments to ensure non-null company_id
-- Helper: derive document_id and company_id from a workflow id
CREATE OR REPLACE FUNCTION public._get_document_and_company_from_workflow(
  p_workflow_id uuid
)
RETURNS TABLE(out_document_id uuid, out_company_id uuid)
LANGUAGE sql
STABLE
AS $$
  SELECT d.id AS out_document_id, d.company_id AS out_company_id
  FROM public.review_workflows rw
  JOIN public.documents d
    ON rw.record_type = 'document'
   AND rw.record_id = d.id
  WHERE rw.id = p_workflow_id
$$;

-- Main trigger function: log reviewer assignment activity for document workflows
CREATE OR REPLACE FUNCTION public.log_reviewer_assignment_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_document_id uuid;
  v_company_id uuid;
  v_user_id uuid;
BEGIN
  -- Determine document/company from the workflow
  SELECT out_document_id, out_company_id
    INTO v_document_id, v_company_id
  FROM public._get_document_and_company_from_workflow(NEW.workflow_id);

  -- If this assignment is not related to a document-backed workflow, skip document audit log
  IF v_document_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Fallback: try to resolve company via reviewer_groups if available
  IF v_company_id IS NULL THEN
    BEGIN
      SELECT company_id INTO v_company_id FROM public.reviewer_groups WHERE id = NEW.reviewer_group_id;
    EXCEPTION WHEN undefined_column THEN
      -- Column not present on this schema version; ignore
      v_company_id := NULL;
    END;
  END IF;

  -- If still unknown, skip creating the audit log to avoid NOT NULL violation
  IF v_company_id IS NULL THEN
    RAISE WARNING 'Skipping audit log for review_assignment % (workflow %) due to unknown company_id', NEW.id, NEW.workflow_id;
    RETURN NEW;
  END IF;

  v_user_id := COALESCE(NEW.assigned_by, auth.uid());

  -- Insert audit log with a valid company_id
  INSERT INTO public.document_audit_logs (
    document_id,
    user_id,
    company_id,
    action,
    action_details
  ) VALUES (
    v_document_id,
    v_user_id,
    v_company_id,
    'reviewer_assigned',
    jsonb_build_object(
      'workflow_id', NEW.workflow_id,
      'assignment_id', NEW.id,
      'assigned_to', COALESCE(NEW.assigned_to, NULL)
    )
  );

  RETURN NEW;
END;
$$;

-- Ensure trigger is (re)created on review_assignments
DROP TRIGGER IF EXISTS trg_log_reviewer_assignment ON public.review_assignments;
CREATE TRIGGER trg_log_reviewer_assignment
AFTER INSERT ON public.review_assignments
FOR EACH ROW EXECUTE FUNCTION public.log_reviewer_assignment_activity();