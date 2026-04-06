-- Add individual reviewer and approver user/group columns to phase_assigned_document_template
ALTER TABLE public.phase_assigned_document_template
  ADD COLUMN IF NOT EXISTS reviewer_user_ids text[] DEFAULT '{}';

ALTER TABLE public.phase_assigned_document_template
  ADD COLUMN IF NOT EXISTS approver_user_ids text[] DEFAULT '{}';

ALTER TABLE public.phase_assigned_document_template
  ADD COLUMN IF NOT EXISTS approver_group_ids text[] DEFAULT '{}';

ALTER TABLE public.phase_assigned_document_template
  ADD COLUMN IF NOT EXISTS approver_due_date timestamptz;

-- GIN indexes for array overlap/contains queries
CREATE INDEX IF NOT EXISTS idx_padt_reviewer_user_ids ON public.phase_assigned_document_template USING GIN (reviewer_user_ids);
CREATE INDEX IF NOT EXISTS idx_padt_approver_user_ids ON public.phase_assigned_document_template USING GIN (approver_user_ids);
CREATE INDEX IF NOT EXISTS idx_padt_approver_group_ids ON public.phase_assigned_document_template USING GIN (approver_group_ids);

-- Allow individual user assignments (no group) in document_review_assignments
ALTER TABLE public.document_review_assignments
  ALTER COLUMN reviewer_group_id DROP NOT NULL;

ALTER TABLE public.document_review_assignments
  ADD COLUMN IF NOT EXISTS reviewer_user_id uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_dra_reviewer_user_id ON public.document_review_assignments(reviewer_user_id);
