-- Create a new simplified table for document review assignments
CREATE TABLE IF NOT EXISTS public.document_review_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  reviewer_group_id uuid NOT NULL REFERENCES public.reviewer_groups(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  due_date timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'completed', 'skipped')),
  notes text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add indexes for common queries
CREATE INDEX idx_document_review_assignments_document ON public.document_review_assignments(document_id);
CREATE INDEX idx_document_review_assignments_company ON public.document_review_assignments(company_id);
CREATE INDEX idx_document_review_assignments_group ON public.document_review_assignments(reviewer_group_id);
CREATE INDEX idx_document_review_assignments_status ON public.document_review_assignments(status);

-- Enable RLS
ALTER TABLE public.document_review_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view assignments for their company"
  ON public.document_review_assignments
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.user_company_access 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create assignments for their company"
  ON public.document_review_assignments
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.user_company_access 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update assignments for their company"
  ON public.document_review_assignments
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.user_company_access 
      WHERE user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER set_document_review_assignments_updated_at
  BEFORE UPDATE ON public.document_review_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();